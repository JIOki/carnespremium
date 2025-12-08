// ==================== TIPOS DE USUARIO ====================

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export interface Customer {
  id: string;
  userId: string;
  dateOfBirth?: string;
  gender?: string;
  preferences?: any;
  loyaltyTier: LoyaltyTier;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  user?: User;
}

export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

// ==================== TIPOS DE AUTENTICACIÓN ====================

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

// ==================== TIPOS DE PRODUCTOS ====================

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  category?: Category;
  sku: string;
  price: number;
  comparePrice?: number;
  weight?: number;
  unit: string;
  minimumOrder: number;
  stock: number;
  lowStockAlert: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  nutritionalInfo?: any;
  storageInfo?: string;
  preparationTips?: string;
  origin?: string;
  grade?: string;
  cut?: string;
  aging?: string;
  marbling?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relaciones
  images: ProductImage[];
  variants: ProductVariant[];
  reviews?: Review[];
  
  // Campos calculados
  averageRating?: number;
  reviewCount?: number;
  primaryImage?: ProductImage;
  isInWishlist?: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  weight?: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

// ==================== TIPOS DE CARRITO ====================

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  total: number;
  product: Product;
  variant?: ProductVariant;
  addedAt: string;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  estimatedTax: number;
  estimatedShipping: number;
  estimatedTotal: number;
}

export interface Cart {
  items: CartItem[];
  summary: CartSummary;
}

export interface AddToCartRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

// ==================== TIPOS DE ÓRDENES ====================

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  notes?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relaciones
  items: OrderItem[];
  address: Address;
  delivery?: Delivery;
  reviews?: Review[];
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  PACKED = 'PACKED',
  ASSIGNED_TO_ROUTE = 'ASSIGNED_TO_ROUTE',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  total: number;
  product: Product;
  variant?: ProductVariant;
  createdAt: string;
}

// ==================== TIPOS DE DIRECCIONES ====================

export interface Address {
  id: string;
  userId: string;
  name: string;
  street: string;
  number: string;
  colony: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== TIPOS DE ENTREGAS ====================

export interface Delivery {
  id: string;
  orderId: string;
  routeId?: string;
  driverId: string;
  status: DeliveryStatus;
  sequence?: number;
  estimatedTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  latitude: number;
  longitude: number;
  deliveryNotes?: string;
  customerRating?: number;
  driverRating?: number;
  proofOfDelivery?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relaciones
  driver: Driver;
  route?: DeliveryRoute;
}

export enum DeliveryStatus {
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED'
}

export interface Driver {
  id: string;
  userId: string;
  licenseNumber: string;
  vehicleType: string;
  vehiclePlate: string;
  rating: number;
  totalDeliveries: number;
  isAvailable: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  maxCapacity: number;
  user: User;
}

export interface DeliveryRoute {
  id: string;
  name: string;
  driverId: string;
  date: string;
  status: RouteStatus;
  totalDistance?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  startTime?: string;
  endTime?: string;
  optimizedPath?: any;
  createdAt: string;
  updatedAt: string;
  
  // Relaciones
  driver: Driver;
  deliveries: Delivery[];
}

export enum RouteStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// ==================== TIPOS DE RESEÑAS ====================

export interface Review {
  id: string;
  userId: string;
  productId?: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerified: boolean;
  isVisible: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  
  // Relaciones
  user: User;
  product?: Product;
  order?: Order;
}

// ==================== TIPOS DE FIDELIZACIÓN ====================

export interface LoyaltyPoints {
  id: string;
  userId: string;
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  tierProgress: number;
  nextTierAt?: number;
  createdAt: string;
  updatedAt: string;
  
  // Relaciones
  transactions: PointsTransaction[];
}

export interface PointsTransaction {
  id: string;
  loyaltyId: string;
  type: PointType;
  points: number;
  description: string;
  orderId?: string;
  expiresAt?: string;
  createdAt: string;
}

export enum PointType {
  EARNED = 'EARNED',
  BONUS = 'BONUS',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED'
}

// ==================== TIPOS DE API ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  fromCache?: boolean;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    items?: T[];
    products?: T[];
    orders?: T[];
    [key: string]: any;
    pagination: Pagination;
  };
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalProducts?: number;
  totalOrders?: number;
  totalItems?: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

// ==================== TIPOS DE FILTROS Y BÚSQUEDA ====================

export interface ProductFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string;
  featured?: boolean;
  cut?: string;
  grade?: string;
  origin?: string;
  inStock?: boolean;
  sortBy?: ProductSortBy;
  page?: number;
  limit?: number;
}

export enum ProductSortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  CREATED_DESC = 'created_desc',
  RATING_DESC = 'rating_desc'
}

export interface SearchSuggestions {
  products: Product[];
  popularSearches: string[];
}

// ==================== TIPOS DE CONFIGURACIÓN ====================

export interface SystemConfig {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
}

// ==================== TIPOS DE FORMULARIOS ====================

export interface FormError {
  field: string;
  message: string;
}

export interface FormState<T = any> {
  data: T;
  errors: FormError[];
  isLoading: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

// ==================== TIPOS DE SOCKET.IO ====================

export interface SocketEvents {
  // Autenticación
  authenticate: (data: { token: string; role: UserRole; userId: string }) => void;
  authenticated: (data: { success: boolean; userId: string; role: UserRole }) => void;
  authentication_error: (data: { message: string }) => void;
  
  // Ubicación de repartidores
  driver_location_update: (data: { latitude: number; longitude: number; accuracy: number }) => void;
  driver_location_updated: (data: { driverId: string; latitude: number; longitude: number; accuracy: number; timestamp: string }) => void;
  
  // Seguimiento de pedidos
  track_order: (orderId: string) => void;
  order_status_updated: (data: { orderId: string; status: OrderStatus; timestamp: string; [key: string]: any }) => void;
  
  // Chat
  chat_message: (data: { message: string; orderId?: string; recipientId?: string }) => void;
  
  // Notificaciones
  driver_en_route: (data: { driver: Driver; estimatedArrival: string; timestamp: string }) => void;
  special_promotion: (promotion: any) => void;
}

// ==================== TIPOS UTILITARIOS ====================

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithLoading<T> = T & {
  isLoading?: boolean;
};

export type WithError<T> = T & {
  error?: string;
};

// ==================== TIPOS DE HOOKS ====================

export interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  retry?: number;
  staleTime?: number;
  cacheTime?: number;
}

export interface UseMutationOptions<TData = unknown, TError = unknown, TVariables = void> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  onMutate?: (variables: TVariables) => void;
  retry?: number | boolean;
}