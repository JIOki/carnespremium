'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Product } from '@/types'

// Tipos del carrito
export interface CartItem {
  id: string
  productId: string
  product: Product
  variantId?: string
  quantity: number
  price: number
  subtotal: number
}

interface CartContextType {
  items: CartItem[]
  itemsCount: number
  total: number
  isOpen: boolean
  isLoading: boolean
  addItem: (product: Product, quantity?: number, variantId?: string) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Hook personalizado para usar el carrito
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('carnes-premium-cart')
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart)
          setItems(parsedCart)
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    loadCart()
  }, [])

  // Guardar carrito en localStorage cada vez que cambie
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('carnes-premium-cart', JSON.stringify(items))
      } catch (error) {
        console.error('Error saving cart to localStorage:', error)
      }
    }
  }, [items, isInitialized])

  // Calcular totales
  const itemsCount = items.reduce((count, item) => count + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.subtotal, 0)

  // Abrir/cerrar carrito
  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)
  const toggleCart = () => setIsOpen(!isOpen)

  // Agregar producto al carrito
  const addItem = async (product: Product, quantity = 1, variantId?: string) => {
    setIsLoading(true)
    
    try {
      // Generar ID único para el item del carrito
      const itemId = variantId 
        ? `${product.id}-${variantId}` 
        : product.id

      // Buscar si el item ya existe en el carrito
      const existingItemIndex = items.findIndex(item => item.id === itemId)

      if (existingItemIndex > -1) {
        // Si existe, actualizar cantidad
        const newItems = [...items]
        const newQuantity = newItems[existingItemIndex].quantity + quantity
        const newSubtotal = newItems[existingItemIndex].price * newQuantity
        
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newQuantity,
          subtotal: newSubtotal
        }
        
        setItems(newItems)
      } else {
        // Si no existe, agregar nuevo item
        const price = product.price
        const newItem: CartItem = {
          id: itemId,
          productId: product.id,
          product,
          variantId,
          quantity,
          price,
          subtotal: price * quantity
        }
        
        setItems([...items, newItem])
      }

      // TODO: Sincronizar con el backend cuando el usuario esté autenticado
      // await syncCartWithBackend()

    } catch (error) {
      console.error('Error adding item to cart:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Eliminar producto del carrito
  const removeItem = async (itemId: string) => {
    setIsLoading(true)
    
    try {
      const newItems = items.filter(item => item.id !== itemId)
      setItems(newItems)

      // TODO: Sincronizar con el backend
      // await syncCartWithBackend()

    } catch (error) {
      console.error('Error removing item from cart:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Actualizar cantidad de un producto
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(itemId)
    }

    setIsLoading(true)
    
    try {
      const newItems = items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            subtotal: item.price * quantity
          }
        }
        return item
      })
      
      setItems(newItems)

      // TODO: Sincronizar con el backend
      // await syncCartWithBackend()

    } catch (error) {
      console.error('Error updating item quantity:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Limpiar carrito
  const clearCart = async () => {
    setIsLoading(true)
    
    try {
      setItems([])
      
      // TODO: Sincronizar con el backend
      // await syncCartWithBackend()

    } catch (error) {
      console.error('Error clearing cart:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // TODO: Función para sincronizar con el backend
  // const syncCartWithBackend = async () => {
  //   try {
  //     const token = localStorage.getItem('auth-token')
  //     if (token) {
  //       await fetch('http://localhost:3002/api/cart', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'Authorization': `Bearer ${token}`
  //         },
  //         body: JSON.stringify({ items })
  //       })
  //     }
  //   } catch (error) {
  //     console.error('Error syncing cart with backend:', error)
  //   }
  // }

  const value: CartContextType = {
    items,
    itemsCount,
    total,
    isOpen,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
