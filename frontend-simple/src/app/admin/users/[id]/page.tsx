'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, MapPin, ShoppingBag, Star, Calendar, Shield } from 'lucide-react'

interface UserOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
}

interface UserData {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  createdAt: string
  addresses?: any[]
  orders?: UserOrder[]
  _count?: {
    orders: number
    reviews: number
  }
}

const roleLabels: Record<string, string> = {
  CUSTOMER: 'Cliente',
  ADMIN: 'Administrador',
  SUPER_ADMIN: 'Super Admin',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/admin/users/${params.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (!response.ok) {
          throw new Error('No se pudo cargar el usuario')
        }

        const data = await response.json()
        setUser(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el usuario')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) fetchUser()
  }, [params.id, router])

  const updateUser = async (data: { role?: string; isActive?: boolean }) => {
    const token = localStorage.getItem('token')
    if (!token || !user) return

    setUpdating(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/admin/users/${user.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(data)
        }
      )

      if (response.ok) {
        setUser({ ...user, ...data })
      } else {
        const err = await response.json()
        alert(err.message || 'Error al actualizar')
      }
    } catch (err) {
      console.error('Error updating user:', err)
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

  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error || 'Usuario no encontrado'}</p>
        <Link href="/admin/users" className="text-primary-500 hover:underline">
          Volver a usuarios
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/users" className="inline-flex items-center text-neutral-600 hover:text-primary-500 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a usuarios
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {roleLabels[user.role] || user.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos de contacto */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Información de contacto</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-neutral-400" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-neutral-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-neutral-400" />
                  <span>Registrado el {new Date(user.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Ordenes recientes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary-500" />
                Órdenes recientes
              </h2>
              {user.orders && user.orders.length > 0 ? (
                <div className="divide-y">
                  {user.orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">#{order.orderNumber}</p>
                        <p className="text-sm text-neutral-500">
                          {new Date(order.createdAt).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.total.toFixed(2)}</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${statusColors[order.status] || 'bg-gray-100'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500">Sin órdenes</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estadísticas */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Estadísticas</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-primary-500" />
                    <span>Órdenes</span>
                  </div>
                  <span className="font-bold">{user._count?.orders || user.orders?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span>Reseñas</span>
                  </div>
                  <span className="font-bold">{user._count?.reviews || 0}</span>
                </div>
              </div>
            </div>

            {/* Rol */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-500" />
                Cambiar Rol
              </h2>
              <select
                value={user.role}
                onChange={(e) => updateUser({ role: e.target.value })}
                disabled={updating}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="CUSTOMER">Cliente</option>
                <option value="ADMIN">Administrador</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            {/* Bloquear usuario */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Estado de cuenta</h2>
              <button
                onClick={() => updateUser({ isActive: !user.isActive })}
                disabled={updating}
                className={`w-full px-4 py-2 rounded-lg font-medium transition ${
                  user.isActive
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                } disabled:opacity-50`}
              >
                {updating ? 'Actualizando...' : user.isActive ? 'Bloquear usuario' : 'Activar usuario'}
              </button>
              <p className="text-xs text-neutral-500 mt-2">
                {user.isActive ? 'El usuario puede acceder a su cuenta' : 'El usuario no puede iniciar sesión'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}