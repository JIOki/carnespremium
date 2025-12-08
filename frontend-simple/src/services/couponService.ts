/**
 * Servicio de Cupones
 * Maneja todas las operaciones relacionadas con cupones y descuentos
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  maxUsage?: number;
  maxUsagePerUser: number;
  applicableProducts?: string;
  applicableCategories?: string;
  excludedProducts?: string;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  isPublic: boolean;
  timesUsed: number;
  totalDiscount: number;
  createdBy?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  orderId?: string;
  discountAmount: number;
  createdAt: string;
  coupon?: {
    code: string;
    description?: string;
    type: string;
  };
}

export interface CouponValidationResult {
  couponId: string;
  code: string;
  type: string;
  description?: string;
  discountAmount: number;
  freeShipping: boolean;
}

export interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  inactiveCoupons: number;
  totalUsages: number;
  totalDiscount: number;
  topCoupons: Array<{
    id: string;
    code: string;
    type: string;
    timesUsed: number;
    totalDiscount: number;
  }>;
}

export interface CreateCouponData {
  code: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  maxUsage?: number;
  maxUsagePerUser?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  validFrom: string;
  validUntil?: string;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
}

/**
 * Servicio de Cupones
 */
export const couponService = {
  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Obtener todos los cupones (Admin)
   */
  getAllCoupons: async (filters?: {
    search?: string;
    type?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: Coupon[]; pagination: any }> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${API_URL}/coupon/admin/all?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener cupones');
    }

    return response.json();
  },

  /**
   * Obtener detalles de un cupón específico (Admin)
   */
  getCouponById: async (id: string): Promise<{ success: boolean; data: Coupon }> => {
    const response = await fetch(`${API_URL}/coupon/admin/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener cupón');
    }

    return response.json();
  },

  /**
   * Crear un nuevo cupón (Admin)
   */
  createCoupon: async (data: CreateCouponData): Promise<{ success: boolean; data: Coupon }> => {
    const response = await fetch(`${API_URL}/coupon/admin/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear cupón');
    }

    return response.json();
  },

  /**
   * Actualizar un cupón existente (Admin)
   */
  updateCoupon: async (id: string, data: Partial<CreateCouponData>): Promise<{ success: boolean; data: Coupon }> => {
    const response = await fetch(`${API_URL}/coupon/admin/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar cupón');
    }

    return response.json();
  },

  /**
   * Eliminar un cupón (Admin)
   */
  deleteCoupon: async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_URL}/coupon/admin/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar cupón');
    }

    return response.json();
  },

  /**
   * Obtener estadísticas de cupones (Admin)
   */
  getCouponStats: async (): Promise<{ success: boolean; data: CouponStats }> => {
    const response = await fetch(`${API_URL}/coupon/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener estadísticas');
    }

    return response.json();
  },

  // ==================== PUBLIC/CUSTOMER ENDPOINTS ====================

  /**
   * Obtener cupones públicos activos
   */
  getPublicCoupons: async (): Promise<{ success: boolean; data: Coupon[] }> => {
    const response = await fetch(`${API_URL}/coupon/public`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener cupones públicos');
    }

    return response.json();
  },

  /**
   * Validar un cupón y calcular el descuento
   */
  validateCoupon: async (
    code: string,
    subtotal: number,
    items: CartItem[] = []
  ): Promise<{ 
    success: boolean; 
    valid: boolean; 
    data?: CouponValidationResult;
    error?: string;
  }> => {
    const response = await fetch(`${API_URL}/coupon/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ code, subtotal, items })
    });

    const result = await response.json();
    return result;
  },

  /**
   * Aplicar un cupón a un pedido (registrar uso)
   */
  applyCoupon: async (
    couponId: string,
    discountAmount: number,
    orderId?: string
  ): Promise<{ success: boolean; data: CouponUsage }> => {
    const response = await fetch(`${API_URL}/coupon/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ couponId, orderId, discountAmount })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al aplicar cupón');
    }

    return response.json();
  },

  /**
   * Obtener historial de uso de cupones del usuario
   */
  getMyUsage: async (): Promise<{ success: boolean; data: CouponUsage[] }> => {
    const response = await fetch(`${API_URL}/coupon/my-usage`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener historial');
    }

    return response.json();
  }
};
