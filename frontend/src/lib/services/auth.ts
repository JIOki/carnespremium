import apiClient from '../api';
import { 
  ApiResponse, 
  AuthResponse, 
  LoginCredentials, 
  RegisterData,
  User 
} from '../../types';

export class AuthService {
  /**
   * Iniciar sesión
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: ApiResponse<AuthResponse> = await apiClient.post('/auth/login', credentials);
    
    if (response.success && response.data) {
      // Guardar token automáticamente
      apiClient.setToken(response.data.token);
      
      // Guardar datos del usuario
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      return response.data;
    }
    
    throw new Error(response.error || 'Error en inicio de sesión');
  }

  /**
   * Registrar nuevo usuario
   */
  static async register(userData: RegisterData): Promise<AuthResponse> {
    const response: ApiResponse<AuthResponse> = await apiClient.post('/auth/register', userData);
    
    if (response.success && response.data) {
      // Guardar token automáticamente
      apiClient.setToken(response.data.token);
      
      // Guardar datos del usuario
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      return response.data;
    }
    
    throw new Error(response.error || 'Error en registro');
  }

  /**
   * Cerrar sesión
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Limpiar datos locales
      apiClient.clearToken();
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_data');
        localStorage.removeItem('cart_data');
      }
    }
  }

  /**
   * Verificar token
   */
  static async verifyToken(): Promise<{ user: User; tokenValid: boolean }> {
    const response: ApiResponse<{ user: User; tokenValid: boolean }> = 
      await apiClient.get('/auth/verify-token');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Token inválido');
  }

  /**
   * Refrescar token
   */
  static async refreshToken(): Promise<AuthResponse> {
    const response: ApiResponse<AuthResponse> = await apiClient.post('/auth/refresh-token');
    
    if (response.success && response.data) {
      // Actualizar token
      apiClient.setToken(response.data.token);
      
      // Actualizar datos del usuario
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      return response.data;
    }
    
    throw new Error(response.error || 'Error refrescando token');
  }

  /**
   * Solicitar restablecimiento de contraseña
   */
  static async forgotPassword(email: string): Promise<void> {
    const response: ApiResponse = await apiClient.post('/auth/forgot-password', { email });
    
    if (!response.success) {
      throw new Error(response.error || 'Error enviando email de recuperación');
    }
  }

  /**
   * Restablecer contraseña
   */
  static async resetPassword(token: string, password: string): Promise<void> {
    const response: ApiResponse = await apiClient.post('/auth/reset-password', { 
      token, 
      password 
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Error restableciendo contraseña');
    }
  }

  /**
   * Obtener usuario actual del localStorage
   */
  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  static isAuthenticated(): boolean {
    const token = apiClient.getToken();
    const user = this.getCurrentUser();
    
    return !!(token && user);
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  static hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Verificar si el usuario es administrador
   */
  static isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  }

  /**
   * Verificar si el usuario es repartidor
   */
  static isDriver(): boolean {
    return this.hasRole('DRIVER');
  }

  /**
   * Verificar si el usuario es cliente
   */
  static isCustomer(): boolean {
    return this.hasRole('CUSTOMER');
  }
}

export default AuthService;