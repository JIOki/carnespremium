'use client'

import { useCart } from '@/context/CartContext'
import { X, ShoppingCart, Minus, Plus, Trash2, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'

export default function CartDrawer() {
  const { 
    items, 
    itemsCount, 
    total, 
    isOpen, 
    isLoading,
    closeCart, 
    updateQuantity, 
    removeItem 
  } = useCart()

  // Bloquear scroll cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-6 h-6 text-primary-500" />
            <div>
              <h2 className="text-xl font-serif font-semibold text-neutral-900">
                Carrito de Compras
              </h2>
              <p className="text-sm text-neutral-600">
                {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
              </p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-12 h-12 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Tu carrito está vacío
              </h3>
              <p className="text-neutral-600 mb-6 max-w-sm">
                Agrega productos para comenzar tu compra
              </p>
              <button
                onClick={closeCart}
                className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
              >
                Explorar Productos
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className="flex gap-4 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  {/* Product Image */}
                  <div className="relative w-20 h-20 flex-shrink-0 bg-white rounded-lg overflow-hidden">
                    <Image
                      src={
                        item.product.images?.[0]?.url ||
                        `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+PC9zdmc+`
                      }
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 text-sm mb-1 truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-2">
                      ${(item.price ?? item.product?.price ?? 0).toFixed(2)} {item.product.unit && `/ ${item.product.unit}`}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isLoading || item.quantity <= 1}
                        className="p-1 text-neutral-600 hover:text-primary-500 hover:bg-white rounded 
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      
                      <span className="w-8 text-center font-medium text-neutral-900">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isLoading}
                        className="p-1 text-neutral-600 hover:text-primary-500 hover:bg-white rounded 
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={isLoading}
                        className="ml-auto p-1 text-neutral-500 hover:text-red-500 hover:bg-white rounded 
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">
                      ${(item.price ?? item.product?.price ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Totals and Checkout */}
        {items.length > 0 && (
          <div className="border-t border-neutral-200 px-6 py-4 space-y-4">
            {/* Subtotal */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-medium text-neutral-900">
                  ${total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Envío</span>
                <span className="font-medium text-neutral-900">
                  Calculado en el checkout
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-baseline pt-4 border-t border-neutral-200">
              <span className="text-lg font-serif font-semibold text-neutral-900">
                Total
              </span>
              <span className="text-2xl font-serif font-bold text-primary-500">
                ${total.toFixed(2)}
              </span>
            </div>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex items-center justify-center w-full px-6 py-4 bg-primary-500 text-white 
                       font-medium rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 
                       focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 
                       group shadow-lg hover:shadow-xl"
            >
              <span>Proceder al Pago</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Continue Shopping */}
            <button
              onClick={closeCart}
              className="w-full px-6 py-3 text-neutral-700 font-medium hover:text-primary-500 
                       transition-colors text-center"
            >
              Continuar Comprando
            </button>
          </div>
        )}
      </div>
    </>
  )
}
