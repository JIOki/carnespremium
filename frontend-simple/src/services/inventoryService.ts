import api from './api';

// ============================================
// TIPOS Y INTERFACES
// ============================================

export interface Supplier {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms?: string;
  rating: number;
  totalOrders: number;
  totalSpent: number;
  onTimeDelivery: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId?: string;
  variantId?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'WASTE' | 'TRANSFER';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType?: string;
  referenceId?: string;
  supplierId?: string;
  fromLocation?: string;
  toLocation?: string;
  unitCost?: number;
  totalCost?: number;
  userId?: string;
  userName?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
  supplier?: {
    id: string;
    name: string;
    code: string;
  };
  product?: {
    id: string;
    name: string;
    sku: string;
    imageUrl?: string;
  };
  variant?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface StockAlert {
  id: string;
  productId?: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku: string;
  currentStock: number;
  minStock: number;
  reorderPoint: number;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'IGNORED';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolution?: string;
  notified: boolean;
  notifiedAt?: string;
  notificationsSent: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  imageUrl?: string;
  category: {
    name: string;
  };
  variants: {
    id: string;
    name: string;
    sku: string;
    stock: number;
    price: number;
    cost?: number;
  }[];
  totalStock: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lowStockVariants: number;
  outOfStockVariants: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
}

export interface InventoryStats {
  overview: {
    totalProducts: number;
    totalVariants: number;
    totalStock: number;
    totalValue: string;
    lowStockItems: number;
    outOfStockItems: number;
    activeAlerts: number;
    movementsThisMonth: number;
  };
  topProducts: {
    id: string;
    name: string;
    imageUrl?: string;
    sku: string;
    totalSold: number;
  }[];
  alerts: {
    critical: number;
    warning: number;
    total: number;
  };
}

export interface MovementStats {
  totalMovements: number;
  totalValue: number;
  byType: {
    type: string;
    count: number;
    totalCost: number;
  }[];
}

export interface AdjustStockRequest {
  variantId: string;
  quantity: number;
  reason?: string;
  notes?: string;
}

export interface BulkAdjustRequest {
  adjustments: {
    variantId: string;
    quantity: number;
  }[];
  reason?: string;
  notes?: string;
}

export interface CreateSupplierRequest {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ============================================
// SERVICIO DE INVENTARIO
// ============================================

class InventoryService {
  // ==================== INVENTARIO ====================

  /**
   * Obtener inventario con filtros
   */
  async getInventory(params: {
    search?: string;
    categoryId?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    products: InventoryProduct[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const response = await api.get('/inventory', { params });
    return response.data;
  }

  /**
   * Obtener estadísticas de inventario
   */
  async getInventoryStats(): Promise<InventoryStats> {
    const response = await api.get('/inventory/stats');
    return response.data;
  }

  /**
   * Ajustar stock de una variante
   */
  async adjustStock(data: AdjustStockRequest): Promise<{
    message: string;
    movement: InventoryMovement;
    previousStock: number;
    newStock: number;
  }> {
    const response = await api.post('/inventory/adjust', data);
    return response.data;
  }

  /**
   * Ajustar stock de múltiples variantes
   */
  async bulkAdjustStock(data: BulkAdjustRequest): Promise<{
    message: string;
    success: number;
    errors: number;
    results: any[];
    errors: any[];
  }> {
    const response = await api.post('/inventory/bulk-adjust', data);
    return response.data;
  }

  // ==================== MOVIMIENTOS ====================

  /**
   * Obtener historial de movimientos
   */
  async getMovements(params: {
    productId?: string;
    variantId?: string;
    type?: string;
    supplierId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    movements: InventoryMovement[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const response = await api.get('/inventory/movements', { params });
    return response.data;
  }

  /**
   * Obtener movimientos de un producto
   */
  async getProductMovements(
    productId: string,
    limit: number = 50
  ): Promise<{ movements: InventoryMovement[] }> {
    const response = await api.get(`/inventory/movements/product/${productId}`, {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Obtener estadísticas de movimientos
   */
  async getMovementStats(params: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<MovementStats> {
    const response = await api.get('/inventory/movements/stats', { params });
    return response.data;
  }

  // ==================== ALERTAS ====================

  /**
   * Obtener alertas de stock
   */
  async getAlerts(params: {
    status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'IGNORED';
    alertType?: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
    page?: number;
    limit?: number;
  } = {}): Promise<{
    alerts: StockAlert[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const response = await api.get('/inventory/alerts', { params });
    return response.data;
  }

  /**
   * Reconocer una alerta
   */
  async acknowledgeAlert(alertId: string): Promise<{
    message: string;
    alert: StockAlert;
  }> {
    const response = await api.post(`/inventory/alerts/${alertId}/acknowledge`);
    return response.data;
  }

  /**
   * Resolver una alerta
   */
  async resolveAlert(
    alertId: string,
    resolution: string
  ): Promise<{
    message: string;
    alert: StockAlert;
  }> {
    const response = await api.post(`/inventory/alerts/${alertId}/resolve`, {
      resolution
    });
    return response.data;
  }

  /**
   * Verificar alertas de stock bajo
   */
  async checkAlerts(): Promise<{
    message: string;
    alertsCreated: number;
    alerts: StockAlert[];
  }> {
    const response = await api.post('/inventory/alerts/check');
    return response.data;
  }

  // ==================== PROVEEDORES ====================

  /**
   * Obtener lista de proveedores
   */
  async getSuppliers(params: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    suppliers: Supplier[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const response = await api.get('/inventory/suppliers', { params });
    return response.data;
  }

  /**
   * Obtener un proveedor específico
   */
  async getSupplier(id: string): Promise<{
    supplier: Supplier;
    recentMovements: InventoryMovement[];
  }> {
    const response = await api.get(`/inventory/suppliers/${id}`);
    return response.data;
  }

  /**
   * Crear un nuevo proveedor
   */
  async createSupplier(data: CreateSupplierRequest): Promise<{
    message: string;
    supplier: Supplier;
  }> {
    const response = await api.post('/inventory/suppliers', data);
    return response.data;
  }

  /**
   * Actualizar un proveedor
   */
  async updateSupplier(
    id: string,
    data: UpdateSupplierRequest
  ): Promise<{
    message: string;
    supplier: Supplier;
  }> {
    const response = await api.put(`/inventory/suppliers/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar (desactivar) un proveedor
   */
  async deleteSupplier(id: string): Promise<{
    message: string;
    supplier: Supplier;
  }> {
    const response = await api.delete(`/inventory/suppliers/${id}`);
    return response.data;
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Obtener badge de estado de stock
 */
export function getStockStatusBadge(status: string): {
  color: string;
  text: string;
  bgColor: string;
} {
  const badges: Record<string, { color: string; text: string; bgColor: string }> = {
    IN_STOCK: {
      color: 'text-green-700',
      text: 'En Stock',
      bgColor: 'bg-green-100'
    },
    LOW_STOCK: {
      color: 'text-yellow-700',
      text: 'Stock Bajo',
      bgColor: 'bg-yellow-100'
    },
    OUT_OF_STOCK: {
      color: 'text-red-700',
      text: 'Sin Stock',
      bgColor: 'bg-red-100'
    }
  };
  return badges[status] || badges.IN_STOCK;
}

/**
 * Obtener badge de tipo de movimiento
 */
export function getMovementTypeBadge(type: string): {
  color: string;
  text: string;
  bgColor: string;
  icon: string;
} {
  const badges: Record<string, { color: string; text: string; bgColor: string; icon: string }> = {
    IN: {
      color: 'text-green-700',
      text: 'Entrada',
      bgColor: 'bg-green-100',
      icon: '↑'
    },
    OUT: {
      color: 'text-red-700',
      text: 'Salida',
      bgColor: 'bg-red-100',
      icon: '↓'
    },
    ADJUSTMENT: {
      color: 'text-blue-700',
      text: 'Ajuste',
      bgColor: 'bg-blue-100',
      icon: '⚙'
    },
    RETURN: {
      color: 'text-purple-700',
      text: 'Devolución',
      bgColor: 'bg-purple-100',
      icon: '↩'
    },
    WASTE: {
      color: 'text-gray-700',
      text: 'Merma',
      bgColor: 'bg-gray-100',
      icon: '✗'
    },
    TRANSFER: {
      color: 'text-indigo-700',
      text: 'Transferencia',
      bgColor: 'bg-indigo-100',
      icon: '⇄'
    }
  };
  return badges[type] || badges.ADJUSTMENT;
}

/**
 * Obtener badge de severidad de alerta
 */
export function getAlertSeverityBadge(severity: string): {
  color: string;
  text: string;
  bgColor: string;
} {
  const badges: Record<string, { color: string; text: string; bgColor: string }> = {
    INFO: {
      color: 'text-blue-700',
      text: 'Info',
      bgColor: 'bg-blue-100'
    },
    WARNING: {
      color: 'text-yellow-700',
      text: 'Advertencia',
      bgColor: 'bg-yellow-100'
    },
    CRITICAL: {
      color: 'text-red-700',
      text: 'Crítico',
      bgColor: 'bg-red-100'
    }
  };
  return badges[severity] || badges.INFO;
}

/**
 * Formatear moneda
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Formatear fecha
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatear fecha relativa
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Hace un momento';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  
  return formatDate(dateString);
}

export default new InventoryService();
