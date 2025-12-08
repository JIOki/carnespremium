import { apiClient } from './api';

// ==================== TIPOS ====================

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type VoteType = 'HELPFUL' | 'NOT_HELPFUL';

export interface ReviewImage {
  id: string;
  reviewId: string;
  imageUrl: string;
  caption?: string;
  sortOrder: number;
  createdAt: string;
}

export interface ReviewUser {
  id: string;
  name: string;
  email: string;
}

export interface ReviewProduct {
  id: string;
  name: string;
  imageUrl?: string;
  slug: string;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  rejectionReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  helpfulCount: number;
  notHelpfulCount: number;
  sellerResponse?: string;
  sellerRespondedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: ReviewUser;
  product?: ReviewProduct;
  images?: ReviewImage[];
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  orderId?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
}

export interface AddReviewImagesRequest {
  images: {
    imageUrl: string;
    caption?: string;
    sortOrder?: number;
  }[];
}

export interface RatingDistribution {
  rating: number;
  count: number;
  percentage?: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  verifiedPurchases: number;
  distribution: RatingDistribution[];
}

export interface ReviewListResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: ReviewSummary;
}

export interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
  hasReview: boolean;
  isVerifiedPurchase?: boolean;
  orderId?: string;
  review?: Review;
}

export interface VoteResponse {
  message: string;
  voted?: boolean;
  voteType?: VoteType;
}

export interface ReviewStats {
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  verifiedPurchases: number;
  averageRating: number;
  distribution: RatingDistribution[];
  recentReviews: number;
  topReviewedProducts: {
    product: ReviewProduct;
    reviewCount: number;
  }[];
}

// ==================== SERVICIO ====================

class ReviewService {
  // ==================== RUTAS PÚBLICAS ====================

  /**
   * Obtener todas las reseñas de un producto
   */
  async getProductReviews(
    productId: string,
    params?: {
      rating?: number;
      verified?: boolean;
      sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
      page?: number;
      limit?: number;
    }
  ): Promise<ReviewListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.rating) queryParams.append('rating', params.rating.toString());
    if (params?.verified !== undefined) queryParams.append('verified', params.verified.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<ReviewListResponse>(
      `/review/product/${productId}?${queryParams.toString()}`
    );
    return response.data;
  }

  /**
   * Obtener resumen de reseñas de un producto
   */
  async getProductReviewSummary(productId: string): Promise<ReviewSummary> {
    const response = await apiClient.get<ReviewSummary>(
      `/review/product/${productId}/summary`
    );
    return response.data;
  }

  // ==================== RUTAS PROTEGIDAS (USUARIO) ====================

  /**
   * Obtener todas mis reseñas
   */
  async getMyReviews(): Promise<Review[]> {
    const response = await apiClient.get<Review[]>('/review/my-reviews');
    return response.data;
  }

  /**
   * Verificar si puedo dejar una reseña para un producto
   */
  async canReview(productId: string): Promise<CanReviewResponse> {
    const response = await apiClient.get<CanReviewResponse>(
      `/review/can-review/${productId}`
    );
    return response.data;
  }

  /**
   * Crear una nueva reseña
   */
  async createReview(data: CreateReviewRequest): Promise<Review> {
    const response = await apiClient.post<Review>('/review', data);
    return response.data;
  }

  /**
   * Actualizar mi reseña
   */
  async updateReview(reviewId: string, data: UpdateReviewRequest): Promise<Review> {
    const response = await apiClient.put<Review>(`/review/${reviewId}`, data);
    return response.data;
  }

  /**
   * Eliminar mi reseña
   */
  async deleteReview(reviewId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/review/${reviewId}`
    );
    return response.data;
  }

  /**
   * Votar una reseña como útil o no útil
   */
  async voteReview(reviewId: string, voteType: VoteType): Promise<VoteResponse> {
    const response = await apiClient.post<VoteResponse>(
      `/review/${reviewId}/vote`,
      { voteType }
    );
    return response.data;
  }

  /**
   * Agregar imágenes a una reseña
   */
  async addReviewImages(
    reviewId: string,
    data: AddReviewImagesRequest
  ): Promise<ReviewImage[]> {
    const response = await apiClient.post<ReviewImage[]>(
      `/review/${reviewId}/images`,
      data
    );
    return response.data;
  }

  /**
   * Eliminar una imagen de una reseña
   */
  async deleteReviewImage(
    reviewId: string,
    imageId: string
  ): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/review/${reviewId}/images/${imageId}`
    );
    return response.data;
  }

  // ==================== RUTAS DE ADMINISTRADOR ====================

  /**
   * Obtener reseñas pendientes de moderación
   */
  async getPendingReviews(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReviewListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<ReviewListResponse>(
      `/review/admin/pending?${queryParams.toString()}`
    );
    return response.data;
  }

  /**
   * Obtener todas las reseñas (admin)
   */
  async getAllReviews(params?: {
    status?: ReviewStatus;
    productId?: string;
    rating?: number;
    page?: number;
    limit?: number;
  }): Promise<ReviewListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.rating) queryParams.append('rating', params.rating.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<ReviewListResponse>(
      `/review/admin/all?${queryParams.toString()}`
    );
    return response.data;
  }

  /**
   * Aprobar una reseña
   */
  async approveReview(reviewId: string): Promise<Review> {
    const response = await apiClient.put<Review>(
      `/review/admin/${reviewId}/approve`
    );
    return response.data;
  }

  /**
   * Rechazar una reseña
   */
  async rejectReview(reviewId: string, reason: string): Promise<Review> {
    const response = await apiClient.put<Review>(
      `/review/admin/${reviewId}/reject`,
      { reason }
    );
    return response.data;
  }

  /**
   * Responder a una reseña como vendedor
   */
  async respondToReview(reviewId: string, response: string): Promise<Review> {
    const apiResponse = await apiClient.post<Review>(
      `/review/admin/${reviewId}/respond`,
      { response }
    );
    return apiResponse.data;
  }

  /**
   * Obtener estadísticas generales de reseñas (admin)
   */
  async getReviewStats(): Promise<ReviewStats> {
    const response = await apiClient.get<ReviewStats>('/review/admin/stats');
    return response.data;
  }
}

export const reviewService = new ReviewService();
