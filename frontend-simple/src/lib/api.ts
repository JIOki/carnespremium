import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios';
import { toast } from 'react-hot-toast';

// Configuración base de Axios
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Agregar token de autenticación si existe
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        // Agregar timestamp para evitar cache
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now(),
          };
        }

        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        this.handleResponseError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleResponseError(error: AxiosError) {
    const { response, request, message } = error;

    console.error('[API Response Error]', {
      status: response?.status,
      data: response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });

    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          this.handleUnauthorized();
          break;
        case 403:
          toast.error('No tienes permisos para realizar esta acción');
          break;
        case 404:
          toast.error('Recurso no encontrado');
          break;
        case 422:
          // Errores de validación - se manejan en componentes
          break;
        case 429:
          toast.error('Demasiadas solicitudes. Intenta más tarde');
          break;
        case 500:
          toast.error('Error interno del servidor');
          break;
        default:
          if (data && typeof data === 'object' && 'error' in data) {
            toast.error(data.error as string);
          } else {
            toast.error(`Error ${status}: Algo salió mal`);
          }
      }
    } else if (request) {
      // Error de red
      toast.error('Error de conexión. Verifica tu internet');
    } else {
      // Error de configuración
      toast.error('Error de configuración: ' + message);
    }
  }

  private handleUnauthorized() {
    this.clearToken();
    
    // Solo redirigir si no estamos ya en login
    if (typeof window !== 'undefined' && 
        !window.location.pathname.includes('/auth/login')) {
      toast.error('Sesión expirada. Por favor inicia sesión nuevamente');
      window.location.href = '/auth/login';
    }
  }

  // Métodos de autenticación
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }

  // Métodos HTTP genéricos
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // Método para subir archivos
  async uploadFile<T = any>(
    url: string, 
    file: File | FileList, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    const formData = new FormData();
    
    if (file instanceof FileList) {
      Array.from(file).forEach((f, index) => {
        formData.append(`files[${index}]`, f);
      });
    } else {
      formData.append('file', file);
    }

    const response = await this.client.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (config?.onUploadProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          config.onUploadProgress({ ...progressEvent, progress });
        }
      },
    });

    return response.data;
  }

  // Método para descargar archivos
  async downloadFile(url: string, filename?: string): Promise<void> {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // Método para cancelar solicitudes
  createCancelToken() {
    return axios.CancelToken.source();
  }

  // Verificar si un error es de cancelación
  isCancel(error: any): boolean {
    return axios.isCancel(error);
  }

  // Método para verificar el estado de la API
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health');
  }
}

// Crear instancia singleton
const apiClient = new ApiClient();

// Auto-configurar token al inicializar si existe
if (typeof window !== 'undefined') {
  const savedToken = localStorage.getItem('auth_token');
  if (savedToken) {
    apiClient.setToken(savedToken);
  }
}

export default apiClient;

// Exportar tipos útiles
export type { AxiosRequestConfig, AxiosResponse, AxiosError };

// Utilidades adicionales
export const createQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });
  
  return searchParams.toString();
};

export const buildUrl = (baseUrl: string, params?: Record<string, any>): string => {
  if (!params) return baseUrl;
  
  const queryString = createQueryString(params);
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

// Hook personalizado para manejar errores de API
export const useApiErrorHandler = () => {
  return {
    handleError: (error: AxiosError) => {
      if (error.response?.data && typeof error.response.data === 'object') {
        const errorData = error.response.data as any;
        
        if (errorData.error) {
          return errorData.error;
        }
        
        if (errorData.message) {
          return errorData.message;
        }
      }
      
      return 'Ha ocurrido un error inesperado';
    },
    
    getValidationErrors: (error: AxiosError): Record<string, string> => {
      const errors: Record<string, string> = {};
      
      if (error.response?.status === 422 && error.response.data) {
        const errorData = error.response.data as any;
        
        if (errorData.details && Array.isArray(errorData.details)) {
          errorData.details.forEach((detail: any) => {
            if (detail.path && detail.message) {
              errors[detail.path[0]] = detail.message;
            }
          });
        }
      }
      
      return errors;
    }
  };
};