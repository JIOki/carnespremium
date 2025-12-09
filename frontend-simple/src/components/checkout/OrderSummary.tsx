'use client'

import Image from 'next/image'
import { CartItem } from '@/context/CartContext'
import { Package, Truck, Shield, Tag } from 'lucide-react'

interface OrderSummaryProps {
  items: CartItem[]
  total: number
  itemsCount: number
}

export default function OrderSummary({ items, total, itemsCount }: OrderSummaryProps) {
  // Cálculos
  const subtotal = total
  const shipping = total >= 500 ? 0 : 50 // Envío gratis por compras mayores a $500
  const tax = total * 0.16 // IVA 16%
  const finalTotal = subtotal + shipping + tax

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
      <h2 className="text-xl font-serif font-semibold text-neutral-900 mb-6">
        Resumen del Pedido
      </h2>

      {/* Products List */}
      <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            {/* Product Image */}
            <div className="relative w-16 h-16 flex-shrink-0 bg-neutral-100 rounded-lg overflow-hidden">
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
              <h3 className="text-sm font-medium text-neutral-900 truncate">
                {item.product.name}
              </h3>
              <p className="text-xs text-neutral-600 mt-1">
                Cantidad: {item.quantity}
              </p>
              <p className="text-sm font-semibold text-neutral-900 mt-1">
                ${(item.price ?? item.product?.price ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-200 mb-6"></div>

      {/* Totals */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Subtotal ({itemsCount} items)</span>
          <span className="font-medium text-neutral-900">${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Envío</span>
          {shipping === 0 ? (
            <span className="font-medium text-green-600">Gratis</span>
          ) : (
            <span className="font-medium text-neutral-900">${shipping.toFixed(2)}</span>
          )}
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">IVA (16%)</span>
          <span className="font-medium text-neutral-900">${tax.toFixed(2)}</span>
        </div>

        {/* Free Shipping Progress */}
        {shipping > 0 && total < 500 && (
          <div className="pt-3 border-t border-neutral-200">
            <div className="flex items-center justify-between text-xs text-neutral-600 mb-2">
              <span>Progreso para envío gratis</span>
              <span className="font-medium">${(500 - total).toFixed(2)} restantes</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(total / 500) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-200 mb-6"></div>

      {/* Total Final */}
      <div className="flex justify-between items-baseline mb-6">
        <span className="text-lg font-serif font-semibold text-neutral-900">
          Total
        </span>
        <span className="text-2xl font-serif font-bold text-primary-500">
          ${finalTotal.toFixed(2)}
        </span>
      </div>

      {/* Benefits */}
      <div className="space-y-3 pt-6 border-t border-neutral-200">
        <div className="flex items-start gap-3">
          <Truck className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Entrega Rápida
            </p>
            <p className="text-xs text-neutral-600">
              Recibe tu pedido en 24-48 horas
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Compra Segura
            </p>
            <p className="text-xs text-neutral-600">
              Tus datos están protegidos
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Calidad Garantizada
            </p>
            <p className="text-xs text-neutral-600">
              100% satisfacción o devolución
            </p>
          </div>
        </div>

        {total >= 500 && (
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <Tag className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">
                ¡Felicidades!
              </p>
              <p className="text-xs text-green-700">
                Tienes envío gratis en este pedido
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Trust Badges */}
      <div className="mt-6 pt-6 border-t border-neutral-200">
        <p className="text-xs text-neutral-600 text-center mb-3">
          Métodos de pago aceptados
        </p>
        <div className="flex justify-center items-center gap-3 flex-wrap">
          <div className="px-3 py-2 bg-neutral-100 rounded text-xs font-medium text-neutral-700">
            💳 Tarjetas
          </div>
          <div className="px-3 py-2 bg-neutral-100 rounded text-xs font-medium text-neutral-700">
            🏦 Transferencia
          </div>
          <div className="px-3 py-2 bg-neutral-100 rounded text-xs font-medium text-neutral-700">
            💵 Efectivo
          </div>
        </div>
      </div>
    </div>
  )
}
