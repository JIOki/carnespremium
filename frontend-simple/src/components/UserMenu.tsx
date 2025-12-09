'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { User, LogOut, Package, Heart, Settings, ChevronDown } from 'lucide-react'

export default function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    router.push('/')
  }

  // Si no está autenticado, mostrar botón de login
  if (!isAuthenticated || !user) {
    return (
      <Link 
        href="/auth/login" 
        className="flex items-center space-x-2 px-4 py-2 text-base font-medium text-neutral-700 hover:text-primary-500 transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="hidden lg:inline">Ingresar</span>
      </Link>
    )
  }

  // Si está autenticado, mostrar menú dropdown
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 text-base font-medium text-neutral-700 hover:text-primary-500 transition-colors group"
      >
        <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden lg:inline max-w-32 truncate">{user.name.split(' ')[0]}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-neutral-200">
            <p className="text-sm font-semibold text-neutral-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-neutral-600 truncate">
              {user.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/account/membership"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-500 transition-colors"
            >
              <User className="w-4 h-4 mr-3" />
              Mi Perfil
            </Link>

            <Link
              href="/my-orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-500 transition-colors"
            >
              <Package className="w-4 h-4 mr-3" />
              Mis Pedidos
            </Link>

            <Link
              href="/wishlist"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-500 transition-colors"
            >
              <Heart className="w-4 h-4 mr-3" />
              Favoritos
            </Link>

            <Link
              href="/notifications/preferences"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-500 transition-colors"
            >
              <Settings className="w-4 h-4 mr-3" />
              Configuración
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-neutral-200 pt-2">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
