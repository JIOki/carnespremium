'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Star, Minus, Plus, ShoppingCart, Heart, Share2, Check } from 'lucide-react';

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFavorite, setIsFavorite] = useState(product.isInWishlist || false);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= product.minimumOrder && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    
    // Simular delay de la API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    addItem(product, quantity);
    setIsAddingToCart(false);
    setShowSuccess(true);
    
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription || product.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copiar al clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const averageRating = product.averageRating || 4.5;
  const reviewCount = product.reviewCount || 0;
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* SKU y Disponibilidad */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-500">SKU: {product.sku}</span>
        {product.stock > 0 ? (
          <span className="flex items-center gap-1 text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            Disponible ({product.stock} {product.unit})
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-600">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            Agotado
          </span>
        )}
      </div>

      {/* Nombre */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
        {product.name}
      </h1>

      {/* Rating */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < Math.floor(averageRating)
                  ? 'text-[#B9975B] fill-[#B9975B]'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-gray-600">
          {averageRating.toFixed(1)} ({reviewCount} reseñas)
        </span>
      </div>

      {/* Precio */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-[#8B1E3F]">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-lg text-gray-500">
            / {product.unit}
          </span>
          {product.comparePrice && (
            <span className="text-xl text-gray-400 line-through">
              ${product.comparePrice.toFixed(2)}
            </span>
          )}
        </div>
        {discount > 0 && (
          <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
            Ahorra {discount}%
          </span>
        )}
      </div>

      {/* Descripción Corta */}
      <p className="text-gray-600 leading-relaxed">
        {product.shortDescription || product.description}
      </p>

      {/* Selector de Cantidad */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Cantidad
        </label>
        <div className="flex items-center gap-4">
          <div className="flex items-center border-2 border-gray-300 rounded-lg">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= product.minimumOrder}
              className="p-3 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= product.minimumOrder && val <= product.stock) {
                  setQuantity(val);
                }
              }}
              className="w-16 text-center font-semibold text-lg border-none focus:outline-none"
              min={product.minimumOrder}
              max={product.stock}
            />
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= product.stock}
              className="p-3 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm text-gray-500">
            {product.minimumOrder > 1 && `Mínimo: ${product.minimumOrder} ${product.unit}`}
          </span>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="space-y-3">
        <button
          onClick={handleAddToCart}
          disabled={!product.isActive || product.stock === 0 || isAddingToCart}
          className="w-full bg-[#8B1E3F] text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-[#6D1830] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
        >
          {showSuccess ? (
            <>
              <Check className="w-5 h-5" />
              Agregado al Carrito
            </>
          ) : isAddingToCart ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Agregando...
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              Agregar al Carrito
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`py-3 px-6 rounded-lg font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
              isFavorite
                ? 'border-[#8B1E3F] text-[#8B1E3F] bg-[#8B1E3F]/5'
                : 'border-gray-300 text-gray-700 hover:border-[#8B1E3F] hover:text-[#8B1E3F]'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-[#8B1E3F]' : ''}`} />
            {isFavorite ? 'Guardado' : 'Guardar'}
          </button>

          <button
            onClick={handleShare}
            className="py-3 px-6 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:border-[#8B1E3F] hover:text-[#8B1E3F] transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Compartir
          </button>
        </div>
      </div>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
