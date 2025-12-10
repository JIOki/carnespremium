'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Heart, Star, Check } from 'lucide-react'
import { Product } from '@/types'
import { useCart } from '@/context/CartContext'
import wishlistService from '@/services/wishlistService'

interface ProductCardProps {
  product: Product & {
    imageUrl?: string
    shortDesc?: string
    variants?: Array<{
      id: string
      name: string
      price: number
      stock: number
    }>
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { addItem, openCart, isLoading } = useCart()

  // Usar el primer variant si existe, sino usar datos del producto principal
  const variant = product.variants && product.variants.length > 0 ? product.variants[0] : null
  const price = variant?.price ?? product.price
  const stock = variant?.stock ?? product.stock

  const handleAddToCart = async () => {
    try {
      await addItem(product, 1, variant?.id)
      
      // Mostrar feedback de éxito
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        // Abrir el carrito automáticamente
        openCart()
      }, 800)
      
    } catch (error) {
      console.error('Error al agregar al carrito:', error)
      // TODO: Mostrar mensaje de error al usuario
    }
  }

  const handleToggleWishlist = async () => {
    try {
      if (isWishlisted) {
        // Remover de wishlist - necesitamos el wishlistItemId
        // Por ahora solo cambiamos el estado visual
        setIsWishlisted(false)
      } else {
        await wishlistService.addToWishlist({ productId: product.id })
        setIsWishlisted(true)
      }
    } catch (error: any) {
      console.error('Error al actualizar wishlist:', error)
      if (error.response?.status === 401) {
        // Redirigir al login si no está autenticado
        window.location.href = '/auth/login'
      }
    }
  }

  // Imagen placeholder si no hay imagen
  const imageUrl = product.imageUrl || 
                   (product.images && product.images.length > 0 ? product.images[0].url : null) ||
                   `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjEwMCIgeT0iNzUiIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiByeD0iMTAiIGZpbGw9IiNFNUU3RUIiLz4KPGNpcmNsZSBjeD0iMTUwIiBjeT0iMTI1IiByPSIyMCIgZmlsbD0iI0Q1RDlERCIvPgo8cGF0aCBkPSJNMjAwIDEzNUwyMzAgMTA1TDI3MCA0NUwyODUgMTY1SDIwMFYxMzVaIiBmaWxsPSIjRDVEOUREIi8+CjwvZz4KPC9zdmc+`

  return (
    <div className="group bg-white rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden hover:-translate-y-1">
      {/* Image Container */}
      <Link href={`/productos/${product.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 cursor-pointer">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </div>
      </Link>
        
      {/* Wishlist Button */}
      <button
        onClick={handleToggleWishlist}
        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full 
                   hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
      >
        <Heart 
          className={`w-4 h-4 transition-colors ${
            isWishlisted ? 'text-red-500 fill-red-500' : 'text-neutral-600'
          }`} 
        />
      </button>

      {/* Stock Badge */}
      {stock <= 10 && stock > 0 && (
        <div className="absolute top-3 left-3 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded z-10">
          ¡Últimas {stock} unidades!
        </div>
      )}
      
      {stock === 0 && (
        <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded z-10">
          Agotado
        </div>
      )}

      {/* Success Badge */}
      {showSuccess && (
        <div className="absolute inset-0 bg-primary-500/90 flex items-center justify-center animate-in fade-in zoom-in duration-300 z-20">
          <div className="text-center text-white">
            <div className="w-16 h-16 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10" />
            </div>
            <p className="font-semibold">¡Agregado!</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Product Name */}
        <Link href={`/productos/${product.id}`}>
          <h3 className="font-serif text-xl font-semibold text-neutral-900 mb-2 line-clamp-1 hover:text-primary-600 transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-neutral-700 text-base mb-4 line-clamp-2 leading-relaxed">
          {product.shortDesc || product.description || 'Corte premium seleccionado especialmente para los amantes de la carne.'}
        </p>

        {/* Variant Info */}
        {variant && (
          <div className="flex items-center justify-between mb-4 text-sm">
            <span className="text-neutral-600">{variant.name}</span>
            <span className="text-neutral-600">Stock: {variant.stock}</span>
          </div>
        )}

        {/* Rating (Placeholder) */}
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'
                }`}
              />
            ))}
          </div>
          <span className="ml-2 text-neutral-600 text-sm">(4.5)</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-semibold text-neutral-900">
              ${price.toFixed(2)}
            </span>
            {product.unit && (
              <span className="text-neutral-600 text-base">/ {product.unit}</span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={stock === 0 || isLoading}
          className="w-full flex items-center justify-center px-6 py-3 bg-primary-500 text-white 
                     font-medium rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 
                     focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500
                     active:scale-95"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : showSuccess ? (
            <Check className="w-5 h-5 mr-2" />
          ) : (
            <ShoppingCart className="w-5 h-5 mr-2" />
          )}
          {stock === 0 ? 'Agotado' : showSuccess ? '¡Agregado!' : 'Agregar al Carrito'}
        </button>
      </div>
    </div>
  )
}
