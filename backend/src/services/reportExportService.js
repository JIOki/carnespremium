const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

class ReportExportService {
  /**
   * Exportar reporte de ventas a PDF
   * @param {Object} data - Datos del reporte
   * @param {String} filename - Nombre del archivo
   * @returns {String} Path del archivo generado
   */
  async exportSalesReportToPDF(data, filename = 'sales-report.pdf') {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filepath = path.join(__dirname, '../../uploads/reports', filename);

        // Crear directorio si no existe
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('Reporte de Ventas', { align: 'center' });
        doc.moveDown();
        
        // Período
        doc.fontSize(12).text(`Período: ${data.period.startDate} - ${data.period.endDate}`, {
          align: 'center'
        });
        doc.moveDown(2);

        // Estadísticas generales
        doc.fontSize(16).text('Resumen General', { underline: true });
        doc.moveDown();
        
        doc.fontSize(12);
        doc.text(`Total de Órdenes: ${data.stats.totalOrders}`);
        doc.text(`Ingreso Total: $${data.stats.totalRevenue.toFixed(2)}`);
        doc.text(`Subtotal: $${data.stats.totalSubtotal.toFixed(2)}`);
        doc.text(`Envío Total: $${data.stats.totalShipping.toFixed(2)}`);
        doc.text(`Descuentos: $${data.stats.totalDiscount.toFixed(2)}`);
        doc.text(`Impuestos: $${data.stats.totalTax.toFixed(2)}`);
        doc.text(`Valor Promedio del Pedido: $${data.stats.averageOrderValue.toFixed(2)}`);
        doc.moveDown(2);

        // Órdenes por estado
        doc.fontSize(16).text('Órdenes por Estado', { underline: true });
        doc.moveDown();
        
        doc.fontSize(12);
        Object.entries(data.stats.ordersByStatus).forEach(([status, count]) => {
          doc.text(`${this.translateStatus(status)}: ${count}`);
        });
        doc.moveDown(2);

        // Top 10 órdenes
        if (data.orders && data.orders.length > 0) {
          doc.addPage();
          doc.fontSize(16).text('Detalle de Órdenes', { underline: true });
          doc.moveDown();

          const topOrders = data.orders.slice(0, 10);
          topOrders.forEach((order, index) => {
            doc.fontSize(10);
            doc.text(`#${index + 1} - Orden #${order.id}`, { continued: true });
            doc.text(` | ${order.user.name}`, { continued: true });
            doc.text(` | $${parseFloat(order.total).toFixed(2)}`, { continued: true });
            doc.text(` | ${this.translateStatus(order.status)}`);
            doc.moveDown(0.5);
          });
        }

        // Footer
        doc.fontSize(10).text(
          `Generado el ${new Date().toLocaleString('es-ES')}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        doc.end();

        stream.on('finish', () => {
          resolve(filepath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Exportar reporte de ventas a Excel
   * @param {Object} data - Datos del reporte
   * @param {String} filename - Nombre del archivo
   * @returns {String} Path del archivo generado
   */
  async exportSalesReportToExcel(data, filename = 'sales-report.xlsx') {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Carnes Premium';
    workbook.created = new Date();

    // Hoja 1: Resumen
    const summarySheet = workbook.addWorksheet('Resumen');
    
    // Título
    summarySheet.mergeCells('A1:D1');
    summarySheet.getCell('A1').value = 'Reporte de Ventas';
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.getCell('A1').alignment = { horizontal: 'center' };

    // Período
    summarySheet.mergeCells('A2:D2');
    summarySheet.getCell('A2').value = `Período: ${data.period.startDate} - ${data.period.endDate}`;
    summarySheet.getCell('A2').alignment = { horizontal: 'center' };

    // Estadísticas
    summarySheet.addRow([]);
    summarySheet.addRow(['Métrica', 'Valor']);
    summarySheet.addRow(['Total de Órdenes', data.stats.totalOrders]);
    summarySheet.addRow(['Ingreso Total', `$${data.stats.totalRevenue.toFixed(2)}`]);
    summarySheet.addRow(['Subtotal', `$${data.stats.totalSubtotal.toFixed(2)}`]);
    summarySheet.addRow(['Envío Total', `$${data.stats.totalShipping.toFixed(2)}`]);
    summarySheet.addRow(['Descuentos', `$${data.stats.totalDiscount.toFixed(2)}`]);
    summarySheet.addRow(['Impuestos', `$${data.stats.totalTax.toFixed(2)}`]);
    summarySheet.addRow(['Valor Promedio del Pedido', `$${data.stats.averageOrderValue.toFixed(2)}`]);

    // Órdenes por estado
    summarySheet.addRow([]);
    summarySheet.addRow(['Estado', 'Cantidad']);
    Object.entries(data.stats.ordersByStatus).forEach(([status, count]) => {
      summarySheet.addRow([this.translateStatus(status), count]);
    });

    // Estilos
    summarySheet.getColumn(1).width = 30;
    summarySheet.getColumn(2).width = 20;
    
    const headerRow = summarySheet.getRow(4);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Hoja 2: Detalle de órdenes
    if (data.orders && data.orders.length > 0) {
      const ordersSheet = workbook.addWorksheet('Órdenes');
      
      // Headers
      ordersSheet.columns = [
        { header: 'ID Orden', key: 'id', width: 12 },
        { header: 'Cliente', key: 'customer', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Fecha', key: 'date', width: 20 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Subtotal', key: 'subtotal', width: 12 },
        { header: 'Envío', key: 'shipping', width: 12 },
        { header: 'Descuento', key: 'discount', width: 12 },
        { header: 'Total', key: 'total', width: 12 }
      ];

      // Estilos del header
      const headerRow2 = ordersSheet.getRow(1);
      headerRow2.font = { bold: true };
      headerRow2.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow2.font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // Agregar datos
      data.orders.forEach(order => {
        ordersSheet.addRow({
          id: order.id,
          customer: order.user.name,
          email: order.user.email,
          date: new Date(order.createdAt).toLocaleString('es-ES'),
          status: this.translateStatus(order.status),
          subtotal: parseFloat(order.subtotal),
          shipping: parseFloat(order.shippingCost || 0),
          discount: parseFloat(order.discount || 0),
          total: parseFloat(order.total)
        });
      });

      // Formato de moneda
      ordersSheet.getColumn('subtotal').numFmt = '$#,##0.00';
      ordersSheet.getColumn('shipping').numFmt = '$#,##0.00';
      ordersSheet.getColumn('discount').numFmt = '$#,##0.00';
      ordersSheet.getColumn('total').numFmt = '$#,##0.00';
    }

    // Guardar archivo
    const filepath = path.join(__dirname, '../../uploads/reports', filename);
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await workbook.xlsx.writeFile(filepath);
    return filepath;
  }

  /**
   * Exportar dashboard de analytics a PDF
   * @param {Object} data - Datos del dashboard
   * @param {String} filename - Nombre del archivo
   * @returns {String} Path del archivo generado
   */
  async exportDashboardToPDF(data, filename = 'dashboard-report.pdf') {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filepath = path.join(__dirname, '../../uploads/reports', filename);

        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('Dashboard Analytics', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Período: ${data.period.startDate} - ${data.period.endDate}`, {
          align: 'center'
        });
        doc.moveDown(2);

        // Overview
        doc.fontSize(16).text('Resumen General', { underline: true });
        doc.moveDown();
        
        doc.fontSize(12);
        doc.text(`Ventas Totales: $${data.overview.totalSales.toFixed(2)}`);
        doc.text(`Total de Órdenes: ${data.overview.totalOrders}`);
        doc.text(`Total de Clientes: ${data.overview.totalCustomers}`);
        doc.text(`Total de Productos: ${data.overview.totalProducts}`);
        doc.text(`Valor Promedio del Pedido: $${data.overview.averageOrderValue.toFixed(2)}`);
        doc.moveDown(2);

        // Estado de órdenes
        doc.fontSize(16).text('Estado de Órdenes', { underline: true });
        doc.moveDown();
        
        doc.fontSize(12);
        doc.text(`Pendientes: ${data.orderStats.pending}`);
        doc.text(`Completadas: ${data.orderStats.completed}`);
        doc.text(`Canceladas: ${data.orderStats.cancelled}`);
        doc.moveDown(2);

        // Top productos
        if (data.topProducts && data.topProducts.length > 0) {
          doc.fontSize(16).text('Top 5 Productos Más Vendidos', { underline: true });
          doc.moveDown();
          
          doc.fontSize(10);
          data.topProducts.slice(0, 5).forEach((item, index) => {
            doc.text(`${index + 1}. ${item.product.name}`);
            doc.text(`   Cantidad vendida: ${item.totalQuantitySold} | Ingresos: $${item.totalRevenue.toFixed(2)}`);
            doc.moveDown(0.5);
          });
          doc.moveDown();
        }

        // Productos con stock bajo
        if (data.lowStockProducts && data.lowStockProducts.length > 0) {
          doc.fontSize(16).text('Alerta: Productos con Stock Bajo', { underline: true });
          doc.moveDown();
          
          doc.fontSize(10);
          data.lowStockProducts.forEach((item, index) => {
            doc.text(`${index + 1}. ${item.product.name} - Stock: ${item.quantity} unidades`);
            doc.moveDown(0.3);
          });
        }

        // Footer
        doc.fontSize(10).text(
          `Generado el ${new Date().toLocaleString('es-ES')}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        doc.end();

        stream.on('finish', () => {
          resolve(filepath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Exportar analytics de clientes a Excel
   * @param {Object} data - Datos de analytics de clientes
   * @param {String} filename - Nombre del archivo
   * @returns {String} Path del archivo generado
   */
  async exportCustomerAnalyticsToExcel(data, filename = 'customer-analytics.xlsx') {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Carnes Premium';
    workbook.created = new Date();

    // Hoja 1: Resumen
    const summarySheet = workbook.addWorksheet('Resumen');
    
    summarySheet.mergeCells('A1:C1');
    summarySheet.getCell('A1').value = 'Analytics de Clientes';
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.getCell('A1').alignment = { horizontal: 'center' };

    summarySheet.addRow([]);
    summarySheet.addRow(['Total de Clientes', data.overview.totalCustomers]);
    summarySheet.addRow(['Clientes Nuevos', data.overview.newCustomers]);
    summarySheet.addRow(['Tasa de Crecimiento', `${data.overview.growthRate}%`]);
    
    summarySheet.addRow([]);
    summarySheet.addRow(['Retención', '']);
    summarySheet.addRow(['Clientes Retenidos', data.retention.retainedCustomers]);
    summarySheet.addRow(['Tasa de Retención', `${data.retention.retentionRate}%`]);
    summarySheet.addRow(['Tasa de Abandono', `${data.retention.churnRate}%`]);

    summarySheet.addRow([]);
    summarySheet.addRow(['Segmentación', 'Cantidad']);
    summarySheet.addRow(['Nuevos (0-1 orden)', data.segmentation.new]);
    summarySheet.addRow(['Ocasionales (2-4 órdenes)', data.segmentation.occasional]);
    summarySheet.addRow(['Regulares (5-9 órdenes)', data.segmentation.regular]);
    summarySheet.addRow(['Leales (10+ órdenes)', data.segmentation.loyal]);
    summarySheet.addRow(['Inactivos', data.segmentation.inactive]);

    summarySheet.getColumn(1).width = 30;
    summarySheet.getColumn(2).width = 20;

    // Hoja 2: Top Clientes
    if (data.topCustomers && data.topCustomers.length > 0) {
      const customersSheet = workbook.addWorksheet('Top Clientes');
      
      customersSheet.columns = [
        { header: 'Nombre', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Total Órdenes', key: 'orders', width: 15 },
        { header: 'Gasto Total', key: 'spent', width: 15 },
        { header: 'Valor Promedio', key: 'avg', width: 15 }
      ];

      const headerRow = customersSheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };

      data.topCustomers.forEach(customer => {
        customersSheet.addRow({
          name: customer.name,
          email: customer.email,
          orders: customer.totalOrders,
          spent: customer.totalSpent,
          avg: customer.averageOrderValue
        });
      });

      customersSheet.getColumn('spent').numFmt = '$#,##0.00';
      customersSheet.getColumn('avg').numFmt = '$#,##0.00';
    }

    // Guardar
    const filepath = path.join(__dirname, '../../uploads/reports', filename);
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await workbook.xlsx.writeFile(filepath);
    return filepath;
  }

  /**
   * Exportar reporte de inventario a Excel
   * @param {Object} data - Datos del inventario
   * @param {String} filename - Nombre del archivo
   * @returns {String} Path del archivo generado
   */
  async exportInventoryReportToExcel(data, filename = 'inventory-report.xlsx') {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Carnes Premium';
    workbook.created = new Date();

    // Hoja 1: Resumen
    const summarySheet = workbook.addWorksheet('Resumen');
    
    summarySheet.mergeCells('A1:C1');
    summarySheet.getCell('A1').value = 'Reporte de Inventario';
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.getCell('A1').alignment = { horizontal: 'center' };

    summarySheet.addRow([]);
    summarySheet.addRow(['Total de Productos', data.overview.totalProducts]);
    summarySheet.addRow(['Productos con Stock Bajo', data.overview.lowStockProducts]);
    summarySheet.addRow(['Productos Sin Stock', data.overview.outOfStockProducts]);
    summarySheet.addRow(['Valor Total del Inventario', `$${parseFloat(data.overview.totalValue).toFixed(2)}`]);

    summarySheet.getColumn(1).width = 30;
    summarySheet.getColumn(2).width = 20;

    // Hoja 2: Inventario detallado
    const inventorySheet = workbook.addWorksheet('Inventario');
    
    inventorySheet.columns = [
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Producto', key: 'name', width: 30 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Cantidad', key: 'quantity', width: 12 },
      { header: 'Stock Mín.', key: 'minStock', width: 12 },
      { header: 'Stock Máx.', key: 'maxStock', width: 12 },
      { header: 'Precio', key: 'price', width: 12 },
      { header: 'Valor Total', key: 'totalValue', width: 15 },
      { header: 'Estado', key: 'status', width: 15 }
    ];

    const headerRow = inventorySheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };

    data.inventory.forEach(item => {
      const row = inventorySheet.addRow({
        sku: item.sku,
        name: item.productName,
        category: item.category,
        quantity: item.quantity,
        minStock: item.minStock,
        maxStock: item.maxStock,
        price: parseFloat(item.price),
        totalValue: item.totalValue,
        status: this.translateStockStatus(item.status)
      });

      // Colorear según estado
      if (item.status === 'out_of_stock') {
        row.getCell('status').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' }
        };
        row.getCell('status').font = { color: { argb: 'FFFFFFFF' } };
      } else if (item.status === 'low_stock') {
        row.getCell('status').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFA500' }
        };
      }
    });

    inventorySheet.getColumn('price').numFmt = '$#,##0.00';
    inventorySheet.getColumn('totalValue').numFmt = '$#,##0.00';

    // Hoja 3: Por categoría
    if (data.categoryStats && data.categoryStats.length > 0) {
      const categorySheet = workbook.addWorksheet('Por Categoría');
      
      categorySheet.columns = [
        { header: 'Categoría', key: 'category', width: 25 },
        { header: 'Total Productos', key: 'products', width: 15 },
        { header: 'Cantidad Total', key: 'quantity', width: 15 },
        { header: 'Valor Total', key: 'value', width: 15 },
        { header: 'Promedio/Producto', key: 'avg', width: 18 }
      ];

      const headerRow2 = categorySheet.getRow(1);
      headerRow2.font = { bold: true };
      headerRow2.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow2.font = { color: { argb: 'FFFFFFFF' }, bold: true };

      data.categoryStats.forEach(cat => {
        categorySheet.addRow({
          category: cat.categoryName,
          products: cat.totalProducts,
          quantity: cat.totalQuantity,
          value: cat.totalValue,
          avg: parseFloat(cat.averageQuantityPerProduct)
        });
      });

      categorySheet.getColumn('value').numFmt = '$#,##0.00';
    }

    // Guardar
    const filepath = path.join(__dirname, '../../uploads/reports', filename);
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await workbook.xlsx.writeFile(filepath);
    return filepath;
  }

  /**
   * Traducir estado de orden
   * @param {String} status - Estado en inglés
   * @returns {String} Estado en español
   */
  translateStatus(status) {
    const translations = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      preparing: 'Preparando',
      shipped: 'Enviada',
      delivered: 'Entregada',
      cancelled: 'Cancelada',
      refunded: 'Reembolsada'
    };
    return translations[status] || status;
  }

  /**
   * Traducir estado de stock
   * @param {String} status - Estado del stock
   * @returns {String} Estado en español
   */
  translateStockStatus(status) {
    const translations = {
      in_stock: 'En Stock',
      low_stock: 'Stock Bajo',
      out_of_stock: 'Sin Stock'
    };
    return translations[status] || status;
  }
}

module.exports = new ReportExportService();
