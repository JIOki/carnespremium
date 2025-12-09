'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingCart, Search } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import CartDrawer from './CartDrawer'
import UserMenu from './UserMenu'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { itemsCount, toggleCart } = useCart()

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl font-serif">C</span>
                </div>
                <div className="hidden sm:block">
                  <span className="font-serif font-semibold text-xl text-neutral-900 group-hover:text-primary-500 transition-colors">
                    Carnes Premium
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link 
                  href="/" 
                  className="text-neutral-700 hover:text-primary-500 px-3 py-2 text-base font-medium transition-colors"
                >
                  Inicio
                </Link>
                <Link 
                  href="/busqueda" 
                  className="text-neutral-700 hover:text-primary-500 px-3 py-2 text-base font-medium transition-colors"
                >
                  Productos
                </Link>
                <Link 
                  href="/busqueda" 
                  className="text-neutral-700 hover:text-primary-500 px-3 py-2 text-base font-medium transition-colors"
                >
                  Categorías
                </Link>
                <Link 
                  href="/gamification" 
                  className="text-neutral-700 hover:text-primary-500 px-3 py-2 text-base font-medium transition-colors"
                >
                  Nosotros
                </Link>
                
                <Link 
                  href="/notifications" 
                  className="text-neutral-700 hover:text-primary-500 px-3 py-2 text-base font-medium transition-colors"
                >
                  Contacto
                </Link>
              </div>
            </div>

            {/* Right Side - Search, Cart, User */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Search */}
              <Link href="/busqueda" className="p-2 text-neutral-600 hover:text-primary-500 transition-colors">
                <Search className="w-5 h-5" />
              </Link>
              
              {/* Cart */}
              <button 
                onClick={toggleCart}
                className="relative p-2 text-neutral-600 hover:text-primary-500 transition-colors group"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-medium group-hover:scale-110 transition-transform">
                    {itemsCount > 99 ? '99+' : itemsCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <UserMenu />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Cart */}
              <button 
                onClick={toggleCart}
                className="relative p-2 text-neutral-600"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-medium text-[10px]">
                    {itemsCount > 99 ? '99+' : itemsCount}
                  </span>
                )}
              </button>
              
              <button
                type="button"
                className="p-2 text-neutral-600 hover:text-neutral-900"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-neutral-200">
                <Link
                  href="/"
                  className="block px-3 py-2 text-base font-medium text-neutral-700 hover:text-primary-500 hover:bg-neutral-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Inicio
                </Link>
                <Link
                  	href="/busqueda"
                  className="block px-3 py-2 text-base font-medium text-neutral-700 hover:text-primary-500 hover:bg-neutral-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Productos
                </Link>
                <Link
                 	href="/busqueda"
                  className="block px-3 py-2 text-base font-medium text-neutral-700 hover:text-primary-500 hover:bg-neutral-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Categorías
                </Link>
                <Link
                  href="/gamification"
                  className="block px-3 py-2 text-base font-medium text-neutral-700 hover:text-primary-500 hover:bg-neutral-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Nosotros
                </Link>
                <Link
                  	href="/notifications"
                  className="block px-3 py-2 text-base font-medium text-neutral-700 hover:text-primary-500 hover:bg-neutral-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contacto
                </Link>
                <div className="border-t border-neutral-200 pt-4">
                  <div onClick={() => setIsMobileMenuOpen(false)}>
                    <UserMenu />
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  )
}
