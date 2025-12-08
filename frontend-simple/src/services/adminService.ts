import { apiClient } from './apiClient';

export interface DashboardStats {
  overview: {
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    activeProducts: number;
    totalRevenue: number;
    ordersToday: number;
    ordersThisMonth: number;
    ordersThisYear: number;
    revenueToday: number;
    revenueThisMonth: number;
  };
  recentOrders: any[];
  lowStockProducts: any[];
  topProducts: any[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  sku: string;
  categoryId: string;
  imageUrl: string | null;
  gallery: string | null;
  isActive: boolean;
  isFeatured: boolean;
  weight: number | null;
  unit: string;
  origin: string | null;
  brand: string | null;
  tags: string | null;
  nutritionInfo: string | null;
  storageInstructions: string | null;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  averageRating: number;
  totalReviews: number;
  totalSales: number;
  metadata: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
  };
  variants?: ProductVariant[];
  _count?: {
    reviews: number;
    wishlist: number;
  };
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  weight: number | null;
  imageUrl: string | null;
  isActive: boolean;
  reorderPoint: number;
}

export interface Order {
  id: string;
  userId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  transactionId: string | null;
  paidAt: string | null;
  billingAddress: string;
  shippingAddress: string;
  deliveryDate: string | null;
  deliveryTimeSlot: string | null;
  specialInstructions: string | null;
  notes: string | null;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  items?: OrderItem[];
  delivery?: any;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number;
  total: number;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  variant?: {
    id: string;
    name: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders: number;
    reviews: number;
    addresses: number;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    [key: string]: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class AdminService {
  private baseUrl = '/admin';

  // ==================== DASHBOARD ====================

  async getDashboard(): Promise<DashboardStats> {
    const response = await apiClient.get<ApiResponse<DashboardStats>>(`${this.baseUrl}/dashboard`);
    return response.data!;
  }

  async getAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`${this.baseUrl}/analytics`, {
      params: { period }
    });
    return response.data;
  }

  // ==================== PRODUCTOS ====================

  async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get<PaginatedResponse<Product>>(`${this.baseUrl}/products`, {
      params
    });
    return response;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(`${this.baseUrl}/products/${id}`);
    return response.data!;
  }

  async createProduct(data: Partial<Product> & { variants: Partial<ProductVariant>[] }): Promise<Product> {
    const response = await apiClient.post<ApiResponse<Product>>(`${this.baseUrl}/products`, data);
    return response.data!;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const response = await apiClient.put<ApiResponse<Product>>(`${this.baseUrl}/products/${id}`, data);
    return response.data!;
  }

  async deleteProduct(id: string, permanent: boolean = false): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/products/${id}`, {
      params: { permanent }
    });
  }

  async createVariant(productId: string, data: Partial<ProductVariant>): Promise<ProductVariant> {
    const response = await apiClient.post<ApiResponse<ProductVariant>>(
      `${this.baseUrl}/products/${productId}/variants`,
      data
    );
    return response.data!;
  }

  async updateVariant(productId: string, variantId: string, data: Partial<ProductVariant>): Promise<ProductVariant> {
    const response = await apiClient.put<ApiResponse<ProductVariant>>(
      `${this.baseUrl}/products/${productId}/variants/${variantId}`,
      data
    );
    return response.data!;
  }

  async deleteVariant(productId: string, variantId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/products/${productId}/variants/${variantId}`);
  }

  // ==================== ÓRDENES ====================

  async getOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<Order>> {
    const response = await apiClient.get<PaginatedResponse<Order>>(`${this.baseUrl}/orders`, {
      params
    });
    return response;
  }

  async getOrder(id: string): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(`${this.baseUrl}/orders/${id}`);
    return response.data!;
  }

  async updateOrderStatus(id: string, status: string, message?: string): Promise<Order> {
    const response = await apiClient.put<ApiResponse<Order>>(`${this.baseUrl}/orders/${id}/status`, {
      status,
      message,
      notifyUser: true
    });
    return response.data!;
  }

  async updateOrderPayment(
    id: string,
    paymentStatus: string,
    paymentMethod?: string,
    transactionId?: string
  ): Promise<Order> {
    const response = await apiClient.put<ApiResponse<Order>>(`${this.baseUrl}/orders/${id}/payment`, {
      paymentStatus,
      paymentMethod,
      transactionId
    });
    return response.data!;
  }

  async cancelOrder(id: string, reason?: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/orders/${id}`, {
      data: { reason }
    });
  }

  // ==================== USUARIOS ====================

  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<PaginatedResponse<User>>(`${this.baseUrl}/users`, {
      params
    });
    return response;
  }

  async getUser(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`${this.baseUrl}/users/${id}`);
    return response.data!;
  }

  async createUser(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(`${this.baseUrl}/users`, data);
    return response.data!;
  }

  async updateUser(id: string, data: Partial<User> & { password?: string }): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(`${this.baseUrl}/users/${id}`, data);
    return response.data!;
  }

  async deleteUser(id: string, permanent: boolean = false): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/users/${id}`, {
      params: { permanent }
    });
  }

  // ==================== CATEGORÍAS ====================

  async getCategories(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(`${this.baseUrl}/categories`);
    return response.data!;
  }

  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    parentId?: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`${this.baseUrl}/categories`, data);
    return response.data!;
  }

  async updateCategory(id: string, data: Partial<any>): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>(`${this.baseUrl}/categories/${id}`, data);
    return response.data!;
  }

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/categories/${id}`);
  }
}

export const adminService = new AdminService();
export default adminService;
