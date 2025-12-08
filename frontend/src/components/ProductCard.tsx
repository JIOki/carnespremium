'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, Heart, Star } from 'lucide-react'
import { Product } from '@/types'

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
  const [isAdding, setIsAdding] = useState(false)

  // Usar el primer variant si existe, sino usar datos del producto principal
  const variant = product.variants && product.variants.length > 0 ? product.variants[0] : null
  const price = variant?.price ?? product.price
  const stock = variant?.stock ?? product.stock

  const handleAddToCart = async () => {
    setIsAdding(true)
    
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Aquí iría la lógica real de agregar al carrito
    console.log('Agregando al carrito:', {
      productId: product.id,
      variantId: variant?.id,
      quantity: 1
    })
    
    setIsAdding(false)
  }

  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    // Aquí iría la lógica real de wishlist
  }

  // Imagen placeholder si no hay imagen
  const imageUrl = product.imageUrl || 
                   (product.images && product.images.length > 0 ? product.images[0].url : null) ||
                   `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjEwMCIgeT0iNzUiIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiByeD0iMTAiIGZpbGw9IiNFNUU3RUIiLz4KPGNpcmNsZSBjeD0iMTUwIiBjeT0iMTI1IiByPSIyMCIgZmlsbD0iI0Q1RDlERCIvPgo8cGF0aCBkPSJNMjAwIDEzNUwyMzAgMTA1TDI3MCA0NUwyODUgMTY1SDIwMFYxMzVaIiBmaWxsPSIjRDVEOUREIi8+CjwvZz4KPC9zdmc+`

  return (
    <div className="group bg-white rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        
        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full 
                     hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100"
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'text-red-500 fill-red-500' : 'text-neutral-600'
            }`} 
          />
        </button>

        {/* Stock Badge */}
        {stock <= 10 && stock > 0 && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded">
            ¡Últimas {stock} unidades!
          </div>
        )}
        
        {stock === 0 && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
            Agotado
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Product Name */}
        <h3 className="font-serif text-xl font-semibold text-neutral-900 mb-2 line-clamp-1">
          {product.name}
        </h3>

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
          disabled={stock === 0 || isAdding}
          className="w-full flex items-center justify-center px-6 py-3 bg-primary-500 text-white 
                     font-medium rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 
                     focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500"
        >
          {isAdding ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <ShoppingCart className="w-5 h-5 mr-2" />
          )}
          {stock === 0 ? 'Agotado' : isAdding ? 'Agregando...' : 'Agregar al Carrito'}
        </button>
      </div>
    </div>
  )
}