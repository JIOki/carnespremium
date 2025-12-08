import apiClient, { buildUrl } from '../api';
import { 
  ApiResponse, 
  PaginatedResponse,
  Product, 
  Category,
  ProductFilters,
  SearchSuggestions,
  Review
} from '../../types';

export class ProductService {
  /**
   * Obtener productos con filtros
   */
  static async getProducts(filters?: ProductFilters): Promise<{
    products: Product[];
    pagination: any;
    filters: ProductFilters;
  }> {
    const url = buildUrl('/products', filters);
    const response: ApiResponse = await apiClient.get(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Error obteniendo productos');
  }

  /**
   * Obtener productos destacados
   */
  static async getFeaturedProducts(): Promise<Product[]> {
    const response: ApiResponse<Product[]> = await apiClient.get('/products/featured');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Error obteniendo productos destacados');
  }

  /**
   * Obtener productos más vendidos
   */
  static async getTopSellingProducts(): Promise<Product[]> {
    const response: ApiResponse<Product[]> = await apiClient.get('/products/top-selling');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Error obteniendo productos más vendidos');
  }

  /**
   * Obtener producto por ID
   */
  static async getProductById(id: string): Promise<Product> {
    const response: ApiResponse<Product> = await apiClient.get(`/products/${id}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Producto no encontrado');
  }

  /**
   * Obtener productos recomendados
   */
  static async getRecommendations(
    productId: string, 
    type: 'SIMILAR_PRODUCTS' | 'FREQUENTLY_BOUGHT_TOGETHER' = 'SIMILAR_PRODUCTS',
    limit: number = 4
  ): Promise<{ recommendations: Product[]; type: string }> {
    const url = buildUrl(`/products/${productId}/recommendations`, { type, limit });
    const response: ApiResponse = await apiClient.get(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Error obteniendo recomendaciones');
  }

  /**
   * Obtener reseñas de un producto
   */
  static async getProductReviews(
    productId: string, 
    page: number = 1, 
    limit: number = 10,
    rating?: number
  ): Promise<{
    reviews: Review[];
    pagination: any;
  }> {
    const url = buildUrl(`/products/${productId}/reviews`, { page, limit, rating });
    const response: ApiResponse = await apiClient.get(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Error obteniendo reseñas');
  }

  /**
   * Buscar productos
   */
  static async searchProducts(
    query: string, 
    filters?: Omit<ProductFilters, 'q'>
  ): Promise<{
    products: Product[];
    pagination: any;
    filters: ProductFilters;
  }> {
    const searchFilters = { ...filters, q: query };
    return this.getProducts(searchFilters);
  }

  /**
   * Obtener sugerencias de búsqueda
   */
  static async getSearchSuggestions(query: string): Promise<SearchSuggestions> {
    const url = buildUrl('/products/search/suggestions', { q: query });
    const response: ApiResponse<SearchSuggestions> = await apiClient.get(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Error obteniendo sugerencias');
  }

  /**
   * Obtener categorías
   */
  static async getCategories(): Promise<Category[]> {
    const response: ApiResponse<Category[]> = await apiClient.get('/categories');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Error obteniendo categorías');
  }

  /**
   * Obtener categoría con productos
   */
  static async getCategoryWithProducts(
    categoryId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{
    category: Category;
    products: Product[];
    pagination: any;
  }> {
    const url = buildUrl(`/categories/${categoryId}`, { page, limit });
    const response: ApiResponse = await apiClient.get(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Error obteniendo categoría');
  }

  /**
   * Obtener filtros disponibles para una categoría
   */
  static async getCategoryFilters(categoryId: string): Promise<{
    priceRange: { min: number; max: number };
    weightRange: { min: number; max: number };
    cuts: string[];
    grades: string[];
    origins: string[];
    tags: string[];
  }> {
    const response: ApiResponse = await apiClient.get(`/categories/${categoryId}/filters`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Error obteniendo filtros');
  }
}

export default ProductService;