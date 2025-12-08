import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

// ==================== TIPOS ====================

export type WishlistPriority = 'LOW' | 'NORMAL' | 'HIGH';

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  priceWhenAdded?: number;
  notifyPriceChange: boolean;
  notifyAvailability: boolean;
  targetPrice?: number;
  notes?: string;
  priority: WishlistPriority;
  createdAt: string;
  updatedAt: string;
  product?: any;
  currentPrice?: number;
  priceChange?: number;
  isOnSale?: boolean;
  inStock?: boolean;
}

export interface WishlistStats {
  totalItems: number;
  withPriceAlerts: number;
  withAvailabilityAlerts: number;
  highPriority: number;
}

export interface AddToWishlistRequest {
  productId: string;
  notifyPriceChange?: boolean;
  notifyAvailability?: boolean;
  targetPrice?: number;
  notes?: string;
  priority?: WishlistPriority;
}

export interface UpdateWishlistItemRequest {
  notifyPriceChange?: boolean;
  notifyAvailability?: boolean;
  targetPrice?: number;
  notes?: string;
  priority?: WishlistPriority;
}

export interface ShareWishlistRequest {
  title?: string;
  description?: string;
  isPublic?: boolean;
  allowCopy?: boolean;
  expiresIn?: number; // días
}

export interface SharedWishlist {
  id: string;
  ownerId: string;
  shareToken: string;
  title?: string;
  description?: string;
  isPublic: boolean;
  allowCopy: boolean;
  viewCount: number;
  lastViewedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  shareUrl?: string;
  isExpired?: boolean;
  owner?: {
    id: string;
    name: string;
  };
}

export interface WishlistPriceAlert {
  id: string;
  userId: string;
  productId: string;
  previousPrice: number;
  newPrice: number;
  changePercent: number;
  notified: boolean;
  notifiedAt?: string;
  createdAt: string;
}

export interface WishlistAdminStats {
  overview: {
    totalItems: number;
    totalUsers: number;
    recentItems: number;
    withPriceAlerts: number;
    withAvailabilityAlerts: number;
    avgItemsPerUser: string;
  };
  mostWishlisted: Array<{
    productId: string;
    count: number;
    product: any;
  }>;
  categoryStats: Array<{
    id: string;
    name: string;
    wishlist_count: number;
  }>;
  dailyTrends: Array<{
    date: string;
    count: number;
  }>;
}

// ==================== SERVICIO ====================

class WishlistService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  // ==================== MÉTODOS USUARIO ====================

  /**
   * Obtener wishlist del usuario
   */
  async getWishlist(params?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    priority?: WishlistPriority;
    minPrice?: number;
    maxPrice?: number;
    category?: string;
  }) {
    const response = await axios.get(`${API_URL}/wishlist`, {
      ...this.getAuthHeader(),
      params
    });
    return response.data;
  }

  /**
   * Agregar producto a wishlist
   */
  async addToWishlist(data: AddToWishlistRequest) {
    const response = await axios.post(
      `${API_URL}/wishlist`,
      data,
      this.getAuthHeader()
    );
    return response.data;
  }

  /**
   * Actualizar configuración de item en wishlist
   */
  async updateWishlistItem(itemId: string, data: UpdateWishlistItemRequest) {
    const response = await axios.put(
      `${API_URL}/wishlist/${itemId}`,
      data,
      this.getAuthHeader()
    );
    return response.data;
  }

  /**
   * Eliminar producto de wishlist
   */
  async removeFromWishlist(itemId: string) {
    const response = await axios.delete(
      `${API_URL}/wishlist/${itemId}`,
      this.getAuthHeader()
    );
    return response.data;
  }

  /**
   * Limpiar toda la wishlist
   */
  async clearWishlist() {
    const response = await axios.delete(
      `${API_URL}/wishlist`,
      this.getAuthHeader()
    );
    return response.data;
  }

  /**
   * Verificar si un producto está en wishlist
   */
  async checkInWishlist(productId: string) {
    const response = await axios.get(
      `${API_URL}/wishlist/check/${productId}`,
      this.getAuthHeader()
    );
    return response.data;
  }

  /**
   * Toggle producto en wishlist (agregar o eliminar)
   */
  async toggleWishlist(productId: string) {
    const response = await axios.post(
      `${API_URL}/wishlist/toggle/${productId}`,
      {},
      this.getAuthHeader()
    );
    return response.data;
  }

  // ==================== ALERTAS DE PRECIO ====================

  /**
   * Obtener alertas de precio del usuario
   */
  async getPriceAlerts(notified?: boolean) {
    const response = await axios.get(`${API_URL}/wishlist/price-alerts`, {
      ...this.getAuthHeader(),
      params: { notified }
    });
    return response.data;
  }

  /**
   * Marcar alerta como leída
   */
  async markAlertAsRead(alertId: string) {
    const response = await axios.put(
      `${API_URL}/wishlist/price-alerts/${alertId}/mark-read`,
      {},
      this.getAuthHeader()
    );
    return response.data;
  }

  // ==================== COMPARTIR WISHLIST ====================

  /**
   * Crear enlace para compartir wishlist
   */
  async shareWishlist(data: ShareWishlistRequest) {
    const response = await axios.post(
      `${API_URL}/wishlist/share`,
      data,
      this.getAuthHeader()
    );
    return response.data;
  }

  /**
   * Obtener wishlist compartida por token
   */
  async getSharedWishlist(token: string) {
    const response = await axios.get(
      `${API_URL}/wishlist/share/${token}`,
      this.getAuthHeader()
    );
    return response.data;
  }

  /**
   * Obtener enlaces compartidos del usuario
   */
  async getMyShares() {
    const response = await axios.get(
      `${API_URL}/wishlist/my-shares`,
      this.getAuthHeader()
    );
    return response.data;
  }

  /**
   * Eliminar enlace compartido
   */
  async deleteShare(shareId: string) {
    const response = await axios.delete(
      `${API_URL}/wishlist/share/${shareId}`,
      this.getAuthHeader()
    );
    return response.data;
  }

  // ==================== MÉTODOS ADMIN ====================

  /**
   * Obtener estadísticas generales de wishlist
   */
  async getAdminStats(period: string = '30') {
    const response = await axios.get(`${API_URL}/wishlist/admin/stats`, {
      ...this.getAuthHeader(),
      params: { period }
    });
    return response.data;
  }

  /**
   * Obtener estadísticas de un producto específico
   */
  async getProductStats(productId: string) {
    const response = await axios.get(
      `${API_URL}/wishlist/admin/products/${productId}/stats`,
      this.getAuthHeader()
    );
    return response.data;
  }

  /**
   * Ejecutar proceso de notificación de cambios de precio
   */
  async notifyPriceChanges() {
    const response = await axios.post(
      `${API_URL}/wishlist/admin/notify-price-changes`,
      {},
      this.getAuthHeader()
    );
    return response.data;
  }
}

// Exportar instancia única
const wishlistService = new WishlistService();
export default wishlistService;
