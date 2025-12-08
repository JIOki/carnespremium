import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

// ==================== TIPOS ====================

export interface Notification {
  id: string;
  userId: string;
  type: 'ORDER' | 'DELIVERY' | 'PROMO' | 'REVIEW' | 'SYSTEM' | 'WISHLIST';
  title: string;
  message: string;
  data?: string;
  isRead: boolean;
  readAt?: Date;
  sentVia?: string;
  isPushed: boolean;
  pushedAt?: Date;
  actionUrl?: string;
  actionType?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  expiresAt?: Date;
  imageUrl?: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  enableOrder: boolean;
  enableDelivery: boolean;
  enablePromo: boolean;
  enableReview: boolean;
  enableSystem: boolean;
  enableWishlist: boolean;
  enablePush: boolean;
  enableEmail: boolean;
  enableSMS: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  enableQuietHours: boolean;
  digestMode: 'REALTIME' | 'HOURLY' | 'DAILY';
  createdAt: Date;
  updatedAt: Date;
}

export interface FCMToken {
  id: string;
  userId: string;
  token: string;
  deviceInfo?: string;
  platform: 'WEB' | 'IOS' | 'ANDROID';
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
  priority?: string;
}

export interface NotificationStats {
  total: number;
  read: number;
  unread: number;
  pushed: number;
  readRate: number;
  pushRate: number;
  byType: Array<{ type: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  last24Hours: number;
}

export interface SendNotificationRequest {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
  actionType?: string;
  priority?: string;
  imageUrl?: string;
  sendPush?: boolean;
}

export interface BroadcastNotificationRequest {
  targetAudience?: 'ALL' | 'CUSTOMERS' | 'DRIVERS' | 'SEGMENT';
  userIds?: string[];
  type: string;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
  actionType?: string;
  priority?: string;
  imageUrl?: string;
  sendPush?: boolean;
}

// ==================== SERVICIO ====================

class NotificationService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  // ==================== NOTIFICACIONES ====================

  /**
   * Obtener notificaciones del usuario
   */
  async getNotifications(filters?: NotificationFilters): Promise<{
    success: boolean;
    data: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
    if (filters?.priority) params.append('priority', filters.priority);

    const response = await axios.get(
      `${API_URL}/notification?${params.toString()}`,
      this.getAuthHeader()
    );
    return response.data;
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  async getUnreadCount(): Promise<number> {
    const response = await axios.get(
      `${API_URL}/notification/unread-count`,
      this.getAuthHeader()
    );
    return response.data.count;
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await axios.put(
      `${API_URL}/notification/${notificationId}/read`,
      {},
      this.getAuthHeader()
    );
    return response.data.data;
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(): Promise<{ count: number }> {
    const response = await axios.put(
      `${API_URL}/notification/read-all`,
      {},
      this.getAuthHeader()
    );
    return response.data;
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await axios.delete(
      `${API_URL}/notification/${notificationId}`,
      this.getAuthHeader()
    );
  }

  /**
   * Eliminar todas las notificaciones leídas
   */
  async clearAllRead(): Promise<{ count: number }> {
    const response = await axios.delete(
      `${API_URL}/notification/clear-all`,
      this.getAuthHeader()
    );
    return response.data;
  }

  // ==================== PREFERENCIAS ====================

  /**
   * Obtener preferencias de notificación
   */
  async getPreferences(): Promise<NotificationPreference> {
    const response = await axios.get(
      `${API_URL}/notification/preferences`,
      this.getAuthHeader()
    );
    return response.data.data;
  }

  /**
   * Actualizar preferencias de notificación
   */
  async updatePreferences(preferences: Partial<NotificationPreference>): Promise<NotificationPreference> {
    const response = await axios.put(
      `${API_URL}/notification/preferences`,
      preferences,
      this.getAuthHeader()
    );
    return response.data.data;
  }

  // ==================== FCM TOKENS ====================

  /**
   * Registrar token FCM
   */
  async registerFCMToken(token: string, deviceInfo?: any, platform: string = 'WEB'): Promise<FCMToken> {
    const response = await axios.post(
      `${API_URL}/notification/fcm-token`,
      { token, deviceInfo, platform },
      this.getAuthHeader()
    );
    return response.data.data;
  }

  /**
   * Eliminar token FCM
   */
  async deleteFCMToken(token: string): Promise<void> {
    await axios.delete(
      `${API_URL}/notification/fcm-token/${token}`,
      this.getAuthHeader()
    );
  }

  /**
   * Obtener tokens FCM del usuario
   */
  async getFCMTokens(): Promise<FCMToken[]> {
    const response = await axios.get(
      `${API_URL}/notification/fcm-tokens`,
      this.getAuthHeader()
    );
    return response.data.data;
  }

  // ==================== ADMIN ====================

  /**
   * Enviar notificación a un usuario (admin)
   */
  async sendNotification(request: SendNotificationRequest): Promise<any> {
    const response = await axios.post(
      `${API_URL}/notification/admin/send`,
      request,
      this.getAuthHeader()
    );
    return response.data;
  }

  /**
   * Envío masivo de notificaciones (admin)
   */
  async broadcastNotification(request: BroadcastNotificationRequest): Promise<any> {
    const response = await axios.post(
      `${API_URL}/notification/admin/broadcast`,
      request,
      this.getAuthHeader()
    );
    return response.data;
  }

  /**
   * Obtener estadísticas de notificaciones (admin)
   */
  async getStats(): Promise<NotificationStats> {
    const response = await axios.get(
      `${API_URL}/notification/admin/stats`,
      this.getAuthHeader()
    );
    return response.data.data;
  }

  /**
   * Obtener todas las notificaciones con filtros (admin)
   */
  async getAllNotifications(filters?: NotificationFilters & { userId?: string }): Promise<{
    success: boolean;
    data: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
    if (filters?.userId) params.append('userId', filters.userId);

    const response = await axios.get(
      `${API_URL}/notification/admin/all?${params.toString()}`,
      this.getAuthHeader()
    );
    return response.data;
  }
}

export default new NotificationService();
