const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AnalyticsService {
  /**
   * Obtener métricas generales del dashboard
   * @param {Object} filters - Filtros de fecha (startDate, endDate)
   * @returns {Object} Métricas generales
   */
  async getDashboardMetrics(filters = {}) {
    const { startDate, endDate } = this.parseDateFilters(filters);

    const dateFilter = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    // Ejecutar todas las consultas en paralelo
    const [
      totalSales,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      averageOrderValue,
      topProducts,
      recentOrders,
      lowStockProducts,
      revenueByDay
    ] = await Promise.all([
      // Total de ventas
      prisma.order.aggregate({
        where: {
          ...dateFilter,
          status: { notIn: ['cancelled', 'refunded'] }
        },
        _sum: { total: true }
      }),

      // Total de órdenes
      prisma.order.count({
        where: dateFilter
      }),

      // Total de clientes
      prisma.user.count({
        where: {
          role: 'customer',
          ...dateFilter
        }
      }),

      // Total de productos activos
      prisma.product.count({
        where: { active: true }
      }),

      // Órdenes pendientes
      prisma.order.count({
        where: {
          status: 'pending',
          ...dateFilter
        }
      }),

      // Órdenes completadas
      prisma.order.count({
        where: {
          status: 'delivered',
          ...dateFilter
        }
      }),

      // Órdenes canceladas
      prisma.order.count({
        where: {
          status: { in: ['cancelled', 'refunded'] },
          ...dateFilter
        }
      }),

      // Valor promedio del pedido
      prisma.order.aggregate({
        where: {
          ...dateFilter,
          status: { notIn: ['cancelled', 'refunded'] }
        },
        _avg: { total: true }
      }),

      // Top 5 productos más vendidos
      this.getTopProducts(5, dateFilter),

      // Órdenes recientes
      prisma.order.findMany({
        where: dateFilter,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),

      // Productos con stock bajo
      prisma.inventory.findMany({
        where: {
          quantity: { lte: 10 }
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          }
        },
        take: 10
      }),

      // Ingresos por día (últimos 30 días)
      this.getRevenueByPeriod('day', 30)
    ]);

    return {
      overview: {
        totalSales: totalSales._sum.total || 0,
        totalOrders,
        totalCustomers,
        totalProducts,
        averageOrderValue: averageOrderValue._avg.total || 0
      },
      orderStats: {
        pending: pendingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        total: totalOrders
      },
      topProducts,
      recentOrders,
      lowStockProducts,
      revenueByDay,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    };
  }

  /**
   * Obtener productos más vendidos
   * @param {Number} limit - Límite de productos
   * @param {Object} dateFilter - Filtro de fecha
   * @returns {Array} Top productos
   */
  async getTopProducts(limit = 10, dateFilter = {}) {
    const orderItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: dateFilter
      },
      _sum: {
        quantity: true,
        subtotal: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: limit
    });

    // Obtener detalles de los productos
    const productIds = orderItems.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        imageUrl: true,
        category: {
          select: {
            name: true
          }
        }
      }
    });

    // Combinar datos
    return orderItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        product,
        totalQuantitySold: item._sum.quantity || 0,
        totalRevenue: item._sum.subtotal || 0,
        orderCount: item._count.id
      };
    });
  }

  /**
   * Obtener ingresos por período
   * @param {String} period - 'day', 'week', 'month'
   * @param {Number} limit - Número de períodos
   * @returns {Array} Ingresos por período
   */
  async getRevenueByPeriod(period = 'day', limit = 30) {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - (limit * 24 * 60 * 60 * 1000));
        break;
      case 'week':
        startDate = new Date(now.getTime() - (limit * 7 * 24 * 60 * 60 * 1000));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - limit, 1);
        break;
      default:
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        },
        status: { notIn: ['cancelled', 'refunded'] }
      },
      select: {
        createdAt: true,
        total: true,
        status: true
      }
    });

    // Agrupar por período
    const revenueMap = {};
    orders.forEach(order => {
      const key = this.getDateKey(order.createdAt, period);
      if (!revenueMap[key]) {
        revenueMap[key] = {
          date: key,
          revenue: 0,
          orders: 0
        };
      }
      revenueMap[key].revenue += parseFloat(order.total);
      revenueMap[key].orders += 1;
    });

    return Object.values(revenueMap).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  }

  /**
   * Reporte de ventas detallado
   * @param {Object} filters - Filtros (startDate, endDate, categoryId, status)
   * @returns {Object} Reporte de ventas
   */
  async getSalesReport(filters = {}) {
    const { startDate, endDate, categoryId, status } = filters;
    const dateFilter = this.parseDateFilters({ startDate, endDate });

    const whereClause = {
      createdAt: {
        gte: dateFilter.startDate,
        lte: dateFilter.endDate
      }
    };

    if (status) {
      whereClause.status = status;
    }

    // Obtener todas las órdenes
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        coupon: {
          select: {
            code: true,
            discountType: true,
            discountValue: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filtrar por categoría si es necesario
    let filteredOrders = orders;
    if (categoryId) {
      filteredOrders = orders.filter(order =>
        order.items.some(item => item.product.categoryId === categoryId)
      );
    }

    // Calcular estadísticas
    const stats = {
      totalOrders: filteredOrders.length,
      totalRevenue: filteredOrders.reduce((sum, order) => sum + parseFloat(order.total), 0),
      totalSubtotal: filteredOrders.reduce((sum, order) => sum + parseFloat(order.subtotal), 0),
      totalShipping: filteredOrders.reduce((sum, order) => sum + parseFloat(order.shippingCost || 0), 0),
      totalDiscount: filteredOrders.reduce((sum, order) => sum + parseFloat(order.discount || 0), 0),
      totalTax: filteredOrders.reduce((sum, order) => sum + parseFloat(order.tax || 0), 0),
      averageOrderValue: 0,
      ordersByStatus: {}
    };

    stats.averageOrderValue = stats.totalOrders > 0 
      ? stats.totalRevenue / stats.totalOrders 
      : 0;

    // Contar por estado
    filteredOrders.forEach(order => {
      stats.ordersByStatus[order.status] = (stats.ordersByStatus[order.status] || 0) + 1;
    });

    return {
      stats,
      orders: filteredOrders,
      period: {
        startDate: dateFilter.startDate.toISOString(),
        endDate: dateFilter.endDate.toISOString()
      }
    };
  }

  /**
   * Analytics de clientes
   * @param {Object} filters - Filtros de fecha
   * @returns {Object} Analytics de clientes
   */
  async getCustomerAnalytics(filters = {}) {
    const { startDate, endDate } = this.parseDateFilters(filters);

    const dateFilter = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    const [
      totalCustomers,
      newCustomers,
      topCustomers,
      customersByOrders,
      customerRetention
    ] = await Promise.all([
      // Total de clientes
      prisma.user.count({
        where: { role: 'customer' }
      }),

      // Clientes nuevos en el período
      prisma.user.count({
        where: {
          role: 'customer',
          ...dateFilter
        }
      }),

      // Top 10 clientes por gasto
      this.getTopCustomers(10, dateFilter),

      // Segmentación por número de órdenes
      this.getCustomerSegmentation(dateFilter),

      // Tasa de retención
      this.getCustomerRetention(dateFilter)
    ]);

    return {
      overview: {
        totalCustomers,
        newCustomers,
        growthRate: totalCustomers > 0 
          ? ((newCustomers / totalCustomers) * 100).toFixed(2) 
          : 0
      },
      topCustomers,
      segmentation: customersByOrders,
      retention: customerRetention,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    };
  }

  /**
   * Obtener top clientes
   * @param {Number} limit - Límite de clientes
   * @param {Object} dateFilter - Filtro de fecha
   * @returns {Array} Top clientes
   */
  async getTopCustomers(limit = 10, dateFilter = {}) {
    const customers = await prisma.user.findMany({
      where: {
        role: 'customer'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        orders: {
          where: dateFilter,
          select: {
            total: true,
            status: true
          }
        }
      }
    });

    // Calcular totales
    const customersWithStats = customers.map(customer => {
      const completedOrders = customer.orders.filter(
        o => !['cancelled', 'refunded'].includes(o.status)
      );
      
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        memberSince: customer.createdAt,
        totalOrders: completedOrders.length,
        totalSpent: completedOrders.reduce((sum, order) => sum + parseFloat(order.total), 0),
        averageOrderValue: completedOrders.length > 0
          ? completedOrders.reduce((sum, order) => sum + parseFloat(order.total), 0) / completedOrders.length
          : 0
      };
    });

    // Ordenar por gasto total y limitar
    return customersWithStats
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  /**
   * Segmentación de clientes por número de órdenes
   * @param {Object} dateFilter - Filtro de fecha
   * @returns {Object} Segmentación
   */
  async getCustomerSegmentation(dateFilter = {}) {
    const customers = await prisma.user.findMany({
      where: {
        role: 'customer'
      },
      select: {
        id: true,
        orders: {
          where: dateFilter,
          select: {
            status: true
          }
        }
      }
    });

    const segmentation = {
      new: 0,        // 0-1 orden
      occasional: 0, // 2-4 órdenes
      regular: 0,    // 5-9 órdenes
      loyal: 0,      // 10+ órdenes
      inactive: 0    // 0 órdenes en el período
    };

    customers.forEach(customer => {
      const orderCount = customer.orders.filter(
        o => !['cancelled', 'refunded'].includes(o.status)
      ).length;

      if (orderCount === 0) {
        segmentation.inactive++;
      } else if (orderCount <= 1) {
        segmentation.new++;
      } else if (orderCount <= 4) {
        segmentation.occasional++;
      } else if (orderCount <= 9) {
        segmentation.regular++;
      } else {
        segmentation.loyal++;
      }
    });

    return segmentation;
  }

  /**
   * Calcular tasa de retención de clientes
   * @param {Object} dateFilter - Filtro de fecha
   * @returns {Object} Métricas de retención
   */
  async getCustomerRetention(dateFilter = {}) {
    const { startDate, endDate } = dateFilter;

    // Clientes que ordenaron en el período anterior
    const previousPeriod = {
      gte: new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
      lte: startDate
    };

    const [customersThisPeriod, customersPreviousPeriod] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: 'customer',
          orders: {
            some: {
              createdAt: {
                gte: startDate,
                lte: endDate
              },
              status: { notIn: ['cancelled', 'refunded'] }
            }
          }
        },
        select: { id: true }
      }),

      prisma.user.findMany({
        where: {
          role: 'customer',
          orders: {
            some: {
              createdAt: previousPeriod,
              status: { notIn: ['cancelled', 'refunded'] }
            }
          }
        },
        select: { id: true }
      })
    ]);

    const currentCustomerIds = new Set(customersThisPeriod.map(c => c.id));
    const previousCustomerIds = new Set(customersPreviousPeriod.map(c => c.id));

    // Clientes retenidos = clientes del período anterior que también ordenaron en este período
    const retainedCustomers = [...previousCustomerIds].filter(id => 
      currentCustomerIds.has(id)
    ).length;

    const retentionRate = previousCustomerIds.size > 0
      ? ((retainedCustomers / previousCustomerIds.size) * 100).toFixed(2)
      : 0;

    const newCustomers = customersThisPeriod.length - retainedCustomers;

    return {
      customersThisPeriod: customersThisPeriod.length,
      customersPreviousPeriod: previousCustomerIds.size,
      retainedCustomers,
      newCustomers,
      retentionRate: parseFloat(retentionRate),
      churnRate: parseFloat((100 - retentionRate).toFixed(2))
    };
  }

  /**
   * Reporte de inventario
   * @returns {Object} Reporte de inventario
   */
  async getInventoryReport() {
    const [
      allInventory,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      categoryStats
    ] = await Promise.all([
      // Todo el inventario
      prisma.inventory.findMany({
        include: {
          product: {
            include: {
              category: true
            }
          },
          movements: {
            take: 5,
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          product: {
            name: 'asc'
          }
        }
      }),

      // Productos con stock bajo (≤10 unidades)
      prisma.inventory.count({
        where: {
          quantity: {
            lte: 10,
            gt: 0
          }
        }
      }),

      // Productos sin stock
      prisma.inventory.count({
        where: {
          quantity: 0
        }
      }),

      // Valor total del inventario
      prisma.$queryRaw`
        SELECT SUM(i.quantity * p.price) as totalValue
        FROM Inventory i
        INNER JOIN Product p ON i.productId = p.id
        WHERE i.quantity > 0
      `,

      // Estadísticas por categoría
      this.getInventoryByCategory()
    ]);

    return {
      overview: {
        totalProducts: allInventory.length,
        lowStockProducts,
        outOfStockProducts,
        totalValue: totalValue[0]?.totalValue || 0
      },
      inventory: allInventory.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        category: item.product.category.name,
        quantity: item.quantity,
        minStock: item.minStock,
        maxStock: item.maxStock,
        price: item.product.price,
        totalValue: item.quantity * parseFloat(item.product.price),
        status: this.getStockStatus(item.quantity, item.minStock),
        lastMovements: item.movements
      })),
      categoryStats
    };
  }

  /**
   * Obtener inventario agrupado por categoría
   * @returns {Array} Estadísticas por categoría
   */
  async getInventoryByCategory() {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          include: {
            inventory: true
          }
        }
      }
    });

    return categories.map(category => {
      const totalProducts = category.products.length;
      const totalQuantity = category.products.reduce((sum, product) => {
        return sum + (product.inventory?.quantity || 0);
      }, 0);
      const totalValue = category.products.reduce((sum, product) => {
        const quantity = product.inventory?.quantity || 0;
        return sum + (quantity * parseFloat(product.price));
      }, 0);

      return {
        categoryId: category.id,
        categoryName: category.name,
        totalProducts,
        totalQuantity,
        totalValue,
        averageQuantityPerProduct: totalProducts > 0 
          ? (totalQuantity / totalProducts).toFixed(2) 
          : 0
      };
    });
  }

  /**
   * Obtener estado del stock
   * @param {Number} quantity - Cantidad actual
   * @param {Number} minStock - Stock mínimo
   * @returns {String} Estado
   */
  getStockStatus(quantity, minStock) {
    if (quantity === 0) return 'out_of_stock';
    if (quantity <= minStock) return 'low_stock';
    return 'in_stock';
  }

  /**
   * Métricas de rendimiento
   * @param {Object} filters - Filtros de fecha
   * @returns {Object} Métricas de rendimiento
   */
  async getPerformanceMetrics(filters = {}) {
    const { startDate, endDate } = this.parseDateFilters(filters);

    const dateFilter = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    const [
      conversionRate,
      averageOrderValue,
      customerLifetimeValue,
      couponROI,
      reviewStats,
      deliveryPerformance
    ] = await Promise.all([
      // Tasa de conversión (órdenes / usuarios activos)
      this.getConversionRate(dateFilter),

      // Valor promedio del pedido
      prisma.order.aggregate({
        where: {
          ...dateFilter,
          status: { notIn: ['cancelled', 'refunded'] }
        },
        _avg: {
          total: true
        }
      }),

      // Valor de vida del cliente (CLV)
      this.getCustomerLifetimeValue(),

      // ROI de cupones
      this.getCouponROI(dateFilter),

      // Estadísticas de reviews
      this.getReviewStats(dateFilter),

      // Performance de entregas
      this.getDeliveryPerformance(dateFilter)
    ]);

    return {
      conversionRate,
      averageOrderValue: averageOrderValue._avg.total || 0,
      customerLifetimeValue,
      couponROI,
      reviewStats,
      deliveryPerformance,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    };
  }

  /**
   * Calcular tasa de conversión
   * @param {Object} dateFilter - Filtro de fecha
   * @returns {Object} Tasa de conversión
   */
  async getConversionRate(dateFilter = {}) {
    const [totalVisitors, totalOrders] = await Promise.all([
      // Aproximamos visitantes únicos por usuarios que iniciaron sesión
      prisma.user.count({
        where: {
          role: 'customer',
          lastLogin: dateFilter
        }
      }),

      prisma.order.count({
        where: {
          ...dateFilter,
          status: { notIn: ['cancelled', 'refunded'] }
        }
      })
    ]);

    const rate = totalVisitors > 0 
      ? ((totalOrders / totalVisitors) * 100).toFixed(2) 
      : 0;

    return {
      totalVisitors,
      totalOrders,
      conversionRate: parseFloat(rate)
    };
  }

  /**
   * Calcular valor de vida del cliente (CLV)
   * @returns {Number} CLV promedio
   */
  async getCustomerLifetimeValue() {
    const customers = await prisma.user.findMany({
      where: {
        role: 'customer'
      },
      select: {
        orders: {
          where: {
            status: { notIn: ['cancelled', 'refunded'] }
          },
          select: {
            total: true
          }
        }
      }
    });

    const totalCLV = customers.reduce((sum, customer) => {
      const customerTotal = customer.orders.reduce((orderSum, order) => 
        orderSum + parseFloat(order.total), 0
      );
      return sum + customerTotal;
    }, 0);

    return customers.length > 0 ? totalCLV / customers.length : 0;
  }

  /**
   * Calcular ROI de cupones
   * @param {Object} dateFilter - Filtro de fecha
   * @returns {Object} ROI de cupones
   */
  async getCouponROI(dateFilter = {}) {
    const ordersWithCoupons = await prisma.order.findMany({
      where: {
        ...dateFilter,
        couponId: { not: null },
        status: { notIn: ['cancelled', 'refunded'] }
      },
      select: {
        total: true,
        discount: true,
        coupon: {
          select: {
            code: true,
            discountType: true,
            discountValue: true
          }
        }
      }
    });

    const totalRevenue = ordersWithCoupons.reduce((sum, order) => 
      sum + parseFloat(order.total), 0
    );
    const totalDiscount = ordersWithCoupons.reduce((sum, order) => 
      sum + parseFloat(order.discount || 0), 0
    );

    const roi = totalDiscount > 0 
      ? (((totalRevenue - totalDiscount) / totalDiscount) * 100).toFixed(2) 
      : 0;

    return {
      ordersWithCoupons: ordersWithCoupons.length,
      totalRevenue,
      totalDiscount,
      roi: parseFloat(roi)
    };
  }

  /**
   * Estadísticas de reviews
   * @param {Object} dateFilter - Filtro de fecha
   * @returns {Object} Estadísticas de reviews
   */
  async getReviewStats(dateFilter = {}) {
    const reviews = await prisma.review.findMany({
      where: dateFilter,
      select: {
        rating: true,
        status: true
      }
    });

    const totalReviews = reviews.length;
    const approvedReviews = reviews.filter(r => r.status === 'approved').length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    return {
      totalReviews,
      approvedReviews,
      averageRating: parseFloat(averageRating.toFixed(2)),
      ratingDistribution,
      responseRate: totalReviews > 0 
        ? ((approvedReviews / totalReviews) * 100).toFixed(2) 
        : 0
    };
  }

  /**
   * Performance de entregas
   * @param {Object} dateFilter - Filtro de fecha
   * @returns {Object} Métricas de entrega
   */
  async getDeliveryPerformance(dateFilter = {}) {
    const deliveries = await prisma.order.findMany({
      where: {
        ...dateFilter,
        status: 'delivered'
      },
      select: {
        createdAt: true,
        deliveredAt: true
      }
    });

    const totalDeliveries = deliveries.length;
    
    // Calcular tiempo promedio de entrega
    const deliveryTimes = deliveries
      .filter(d => d.deliveredAt)
      .map(d => {
        const created = new Date(d.createdAt);
        const delivered = new Date(d.deliveredAt);
        return (delivered - created) / (1000 * 60 * 60 * 24); // días
      });

    const averageDeliveryTime = deliveryTimes.length > 0
      ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
      : 0;

    // Entregas a tiempo (≤3 días)
    const onTimeDeliveries = deliveryTimes.filter(time => time <= 3).length;
    const onTimeRate = totalDeliveries > 0 
      ? ((onTimeDeliveries / totalDeliveries) * 100).toFixed(2) 
      : 0;

    return {
      totalDeliveries,
      averageDeliveryTime: parseFloat(averageDeliveryTime.toFixed(2)),
      onTimeDeliveries,
      onTimeRate: parseFloat(onTimeRate)
    };
  }

  /**
   * Parsear filtros de fecha
   * @param {Object} filters - Filtros
   * @returns {Object} Fechas parseadas
   */
  parseDateFilters(filters = {}) {
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
    const startDate = filters.startDate 
      ? new Date(filters.startDate) 
      : new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 días atrás

    return { startDate, endDate };
  }

  /**
   * Obtener key de fecha según período
   * @param {Date} date - Fecha
   * @param {String} period - Período
   * @returns {String} Key de fecha
   */
  getDateKey(date, period) {
    const d = new Date(date);
    
    switch (period) {
      case 'day':
        return d.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      default:
        return d.toISOString().split('T')[0];
    }
  }
}

module.exports = new AnalyticsService();
