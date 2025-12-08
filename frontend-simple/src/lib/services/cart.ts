import apiClient from '../api';
import { 
  ApiResponse, 
  Cart,
  CartItem,
  CartSummary,
  AddToCartRequest
} from '../../types';

export class CartService {
  /**
   * Obtener carrito del usuario
   */
  static async getCart(): Promise<Cart> {
    const response: ApiResponse<Cart> = await apiClient.get('/cart');
    
    if (response.success && response.data) {
      // Guardar en localStorage para persistencia
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart_data', JSON.stringify(response.data));
      }
      
      return response.data;
    }
    
    throw new Error(response.error || 'Error obteniendo carrito');
  }

  /**
   * Agregar producto al carrito
   */
  static async addToCart(request: AddToCartRequest): Promise<{
    cartItem: CartItem;
    cart: Cart;
  }> {
    const response: ApiResponse = await apiClient.post('/cart/add', request);
    
    if (response.success && response.data) {
      // Actualizar localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart_data', JSON.stringify(response.data.cart));
      }
      
      return response.data;
    }
    
    throw new Error(response.error || 'Error agregando producto al carrito');
  }

  /**
   * Actualizar cantidad de un item del carrito
   */
  static async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    const response: ApiResponse<Cart> = await apiClient.put(`/cart/items/${itemId}`, { quantity });
    
    if (response.success && response.data) {
      // Actualizar localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart_data', JSON.stringify(response.data));
      }
      
      return response.data;
    }
    
    throw new Error(response.error || 'Error actualizando item del carrito');
  }

  /**
   * Eliminar item del carrito
   */
  static async removeFromCart(itemId: string): Promise<Cart> {
    const response: ApiResponse<Cart> = await apiClient.delete(`/cart/items/${itemId}`);
    
    if (response.success && response.data) {
      // Actualizar localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart_data', JSON.stringify(response.data));
      }
      
      return response.data;
    }
    
    throw new Error(response.error || 'Error eliminando item del carrito');
  }

  /**
   * Vaciar carrito completo
   */
  static async clearCart(): Promise<Cart> {
    const response: ApiResponse<Cart> = await apiClient.delete('/cart/clear');
    
    if (response.success && response.data) {
      // Limpiar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart_data');
      }
      
      return response.data;
    }
    
    throw new Error(response.error || 'Error vaciando carrito');
  }

  /**
   * Sincronizar carrito
   */
  static async syncCart(): Promise<Cart> {
    const response: ApiResponse<Cart> = await apiClient.post('/cart/sync');
    
    if (response.success && response.data) {
      // Actualizar localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart_data', JSON.stringify(response.data));
      }
      
      return response.data;
    }
    
    throw new Error(response.error || 'Error sincronizando carrito');
  }

  /**
   * Obtener resumen del carrito (para header)
   */
  static async getCartSummary(): Promise<CartSummary> {
    const response: ApiResponse<CartSummary> = await apiClient.get('/cart/summary');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Error obteniendo resumen del carrito');
  }

  /**
   * Obtener carrito desde localStorage (para uso offline)
   */
  static getCartFromStorage(): Cart | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cartData = localStorage.getItem('cart_data');
      return cartData ? JSON.parse(cartData) : null;
    } catch (error) {
      console.error('Error parsing cart data:', error);
      return null;
    }
  }

  /**
   * Guardar carrito en localStorage
   */
  static saveCartToStorage(cart: Cart): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart_data', JSON.stringify(cart));
    }
  }

  /**
   * Limpiar carrito del localStorage
   */
  static clearCartFromStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart_data');
    }
  }

  /**
   * Calcular totales del carrito
   */
  static calculateCartTotals(items: CartItem[]): CartSummary {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Lógica de negocio para cálculos
    const taxRate = 0.16; // IVA 16%
    const freeShippingThreshold = 500;
    const defaultShippingCost = 50;
    
    const estimatedTax = subtotal * taxRate;
    const estimatedShipping = subtotal >= freeShippingThreshold ? 0 : defaultShippingCost;
    const estimatedTotal = subtotal + estimatedTax + estimatedShipping;
    
    return {
      itemCount,
      subtotal: parseFloat(subtotal.toFixed(2)),
      estimatedTax: parseFloat(estimatedTax.toFixed(2)),
      estimatedShipping: estimatedShipping,
      estimatedTotal: parseFloat(estimatedTotal.toFixed(2))
    };
  }

  /**
   * Verificar si un producto está en el carrito
   */
  static isProductInCart(
    cart: Cart, 
    productId: string, 
    variantId?: string
  ): { isInCart: boolean; item?: CartItem; quantity?: number } {
    const item = cart.items.find(item => 
      item.productId === productId && 
      (!variantId || item.variantId === variantId)
    );
    
    return {
      isInCart: !!item,
      item,
      quantity: item?.quantity || 0
    };
  }

  /**
   * Obtener cantidad total de items de un producto específico
   */
  static getProductQuantityInCart(
    cart: Cart, 
    productId: string, 
    variantId?: string
  ): number {
    const { quantity } = this.isProductInCart(cart, productId, variantId);
    return quantity || 0;
  }

  /**
   * Validar disponibilidad de stock antes de agregar al carrito
   */
  static validateStockAvailability(
    requestedQuantity: number,
    availableStock: number,
    currentCartQuantity: number = 0
  ): { isValid: boolean; maxQuantity: number; message?: string } {
    const totalRequestedQuantity = currentCartQuantity + requestedQuantity;
    
    if (totalRequestedQuantity > availableStock) {
      return {
        isValid: false,
        maxQuantity: availableStock - currentCartQuantity,
        message: `Solo hay ${availableStock} unidades disponibles. Ya tienes ${currentCartQuantity} en tu carrito.`
      };
    }
    
    return {
      isValid: true,
      maxQuantity: availableStock - currentCartQuantity
    };
  }
}

export default CartService;