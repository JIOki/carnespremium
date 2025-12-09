'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import OrderSummary from '@/components/checkout/OrderSummary'
import { CheckCircle } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, itemsCount } = useCart()
  const [isCompleted, setIsCompleted] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  // Redirigir si el carrito está vacío
  useEffect(() => {
    if (items.length === 0 && !isCompleted) {
      router.push('/')
    }
  }, [items, isCompleted, router])

  const handleOrderComplete = (orderId: string) => {
    setOrderNumber(orderId)
    setIsCompleted(true)
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-4">
              ¡Pedido Realizado con Éxito!
            </h1>
            
            <p className="text-lg text-neutral-700 mb-2">
              Gracias por tu compra en Carnes Premium
            </p>
            
            <p className="text-neutral-600 mb-8">
              Número de orden: <span className="font-semibold text-primary-500">#{orderNumber}</span>
            </p>

            {/* Order Details */}
            <div className="bg-neutral-50 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold text-lg mb-4">Detalles de tu pedido</h2>
              <div className="space-y-2 text-neutral-700">
                <p>📧 Hemos enviado un correo de confirmación</p>
                <p>📦 Prepararemos tu pedido en las próximas 24 horas</p>
                <p>🚚 Recibirás un mensaje cuando esté en camino</p>
                <p>📱 Puedes seguir tu pedido en tiempo real</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/my-orders')}
                className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg 
                         hover:bg-primary-600 transition-colors"
              >
                Ver Mis Pedidos
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-white border border-neutral-300 text-neutral-700 
                         font-medium rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return null // Se redirigirá automáticamente
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 mb-2">
            Finalizar Compra
          </h1>
          <p className="text-neutral-600">
            Completa tu información para recibir tu pedido
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-neutral-900 hidden sm:inline">
                Carrito
              </span>
            </div>
            <div className="w-12 h-0.5 bg-primary-500"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-neutral-900 hidden sm:inline">
                Checkout
              </span>
            </div>
            <div className="w-12 h-0.5 bg-neutral-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-neutral-300 text-neutral-600 rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-neutral-600 hidden sm:inline">
                Confirmación
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form - 2/3 */}
          <div className="lg:col-span-2">
            <CheckoutForm onComplete={handleOrderComplete} />
          </div>

          {/* Order Summary - 1/3 */}
          <div className="lg:col-span-1">
            <OrderSummary 
              items={items} 
              total={total} 
              itemsCount={itemsCount} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}
