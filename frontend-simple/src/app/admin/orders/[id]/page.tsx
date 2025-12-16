'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle, Truck, XCircle, User, Mail } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  price: number
  total: number
  product: {
    name: string
    imageUrl?: string
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string
  subtotal: number
  deliveryFee: number
  total: number
  shippingAddress: string
  billingAddress: string
  notes?: string
  createdAt: string
  items: OrderItem[]
  user?: {
    name: string
    email: string
    phone?: string
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONFIRMED: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  PROCESSING: { label: 'Procesando', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  READY: { label: 'Listo', color: 'bg-purple-100 text-purple-800', icon: Package },
  OUT_FOR_DELIVERY: { label: 'En camino', color: 'bg-orange-100 text-orange-800', icon: Truck },
  DELIVERED: { label: 'Entregado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
}

const statusOptions = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  CAPTURED: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Fallido', color: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'Reembolsado', color: 'bg-purple-100 text-purple-800' },
  COD_PENDING: { label: 'Contra entrega - Pendiente', color: 'bg-orange-100 text-orange-800' },
  COD_COLLECTED: { label: 'Contra entrega - Cobrado', color: 'bg-green-100 text-green-800' },
}

const paymentStatusOptions = ['PENDING', 'CAPTURED', 'FAILED', 'REFUNDED', 'COD_PENDING', 'COD_COLLECTED']

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/admin/orders/${params.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (!response.ok) {
          throw new Error('No se pudo cargar la orden')
        }

        const data = await response.json()
        setOrder(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la orden')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) fetchOrder()
  }, [params.id, router])

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return
    
    const token = localStorage.getItem('token')
    if (!token) return

    setUpdating(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/admin/orders/${order.id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      )

      if (response.ok) {
        setOrder({ ...order, status: newStatus })
      }
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setUpdating(false)
    }
  }

  const handlePaymentStatusChange = async (newPaymentStatus: string) => {
    if (!order) return
    
    const token = localStorage.getItem('token')
    if (!token) return

    setUpdating(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/orders/${order.id}/payment`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ paymentStatus: newPaymentStatus })
        }
      )

      if (response.ok) {
        setOrder({ ...order, paymentStatus: newPaymentStatus })
      }
    } catch (err) {
      console.error('Error updating payment status:', err)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error || 'Orden no encontrada'}</p>
        <Link href="/admin/orders" className="text-primary-500 hover:underline">
          Volver a órdenes
        </Link>
      </div>
    )
  }

  const status = statusConfig[order.status] || statusConfig.PENDING
  const StatusIcon = status.icon
  
  let shippingAddr = { address: '', city: '', state: '', zipCode: '' }
  try {
    shippingAddr = JSON.parse(order.shippingAddress)
  } catch {}

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/orders" className="inline-flex items-center text-neutral-600 hover:text-primary-500 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a órdenes
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Orden #{order.orderNumber}</h1>
              <p className="text-neutral-500">
                {new Date(order.createdAt).toLocaleDateString('es-MX', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {statusConfig[s]?.label || s}
                  </option>
                ))}
              </select>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${status.color}`}>
                <StatusIcon className="w-4 h-4" />
                {status.label}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Productos */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-500" />
              Productos
            </h2>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex gap-4">
                  <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center">
                    {item.product.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Package className="w-6 h-6 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900">{item.product.name}</h3>
                    <p className="text-sm text-neutral-500">Cantidad: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.total.toFixed(2)}</p>
                    <p className="text-sm text-neutral-500">${item.price.toFixed(2)} c/u</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Envío</span>
                <span>{order.deliveryFee === 0 ? 'Gratis' : `$${order.deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Info lateral */}
          <div className="space-y-6">
            {/* Cliente */}
            {order.user && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-500" />
                  Cliente
                </h2>
                <p className="font-medium text-neutral-900">{order.user.name}</p>
                <p className="text-neutral-600 flex items-center gap-1 mt-1">
                  <Mail className="w-4 h-4" /> {order.user.email}
                </p>
                {order.user.phone && (
                  <p className="text-neutral-600 mt-1">{order.user.phone}</p>
                )}
              </div>
            )}

            {/* Dirección */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                Dirección de envío
              </h2>
              <p className="text-neutral-700">{shippingAddr.address}</p>
              <p className="text-neutral-600">{shippingAddr.city}, {shippingAddr.state}</p>
              <p className="text-neutral-600">CP: {shippingAddr.zipCode}</p>
              {order.notes && (
                <p className="mt-2 text-sm text-neutral-500 italic">Notas: {order.notes}</p>
              )}
            </div>

            {/* Pago */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-500" />
                Método de pago
              </h2>
              <p className="text-neutral-700 capitalize mb-3">
                {order.paymentMethod === 'CASH' ? 'Contra entrega (Efectivo)' : 
                 order.paymentMethod === 'CARD' ? 'Tarjeta en línea' : 
                 order.paymentMethod === 'TRANSFER' ? 'Transferencia' : order.paymentMethod}
              </p>
              
              <label className="block text-sm font-medium text-neutral-600 mb-2">Estado del pago:</label>
              <select
                value={order.paymentStatus}
                onChange={(e) => handlePaymentStatusChange(e.target.value)}
                disabled={updating}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                {paymentStatusOptions.map((ps) => (
                  <option key={ps} value={ps}>
                    {paymentStatusConfig[ps]?.label || ps}
                  </option>
                ))}
              </select>
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${paymentStatusConfig[order.paymentStatus]?.color || 'bg-gray-100'}`}>
                  {paymentStatusConfig[order.paymentStatus]?.label || order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}