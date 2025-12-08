'use client';

import { useState, useEffect } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import wishlistService from '@/services/wishlistService';

interface WishlistButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  onToggle?: (inWishlist: boolean) => void;
  className?: string;
}

export default function WishlistButton({
  productId,
  size = 'md',
  showTooltip = true,
  onToggle,
  className = ''
}: WishlistButtonProps) {
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Tamaños del icono
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  // Verificar si está en wishlist al montar
  useEffect(() => {
    checkWishlistStatus();
  }, [productId]);

  const checkWishlistStatus = async () => {
    try {
      const response = await wishlistService.checkInWishlist(productId);
      if (response.success) {
        setInWishlist(response.data.inWishlist);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    setLoading(true);

    try {
      const response = await wishlistService.toggleWishlist(productId);

      if (response.success) {
        const newStatus = response.data.inWishlist;
        setInWishlist(newStatus);

        // Mostrar notificación visual
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 2000);

        // Callback opcional
        if (onToggle) {
          onToggle(newStatus);
        }
      }
    } catch (error: any) {
      console.error('Error toggling wishlist:', error);
      
      // Si no está autenticado, redirigir al login
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`
          group relative
          p-2 rounded-full
          transition-all duration-200
          hover:bg-gray-100 dark:hover:bg-gray-800
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        aria-label={inWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        {inWishlist ? (
          <HeartSolidIcon
            className={`${sizeClasses[size]} text-red-500 transition-transform group-hover:scale-110`}
          />
        ) : (
          <HeartIcon
            className={`${sizeClasses[size]} text-gray-600 dark:text-gray-400 transition-all group-hover:text-red-500 group-hover:scale-110`}
          />
        )}

        {/* Efecto de carga */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Tooltip */}
        {showTooltip && (
          <div className="
            absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
            px-2 py-1 bg-gray-900 text-white text-xs rounded
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            pointer-events-none whitespace-nowrap
            z-10
          ">
            {inWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          </div>
        )}
      </button>

      {/* Notificación flotante */}
      {showNotification && (
        <div className="
          fixed top-4 right-4 z-50
          bg-white dark:bg-gray-800 
          border border-gray-200 dark:border-gray-700
          shadow-lg rounded-lg px-4 py-3
          flex items-center gap-3
          animate-in slide-in-from-top duration-300
        ">
          {inWishlist ? (
            <>
              <HeartSolidIcon className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Agregado a favoritos
              </span>
            </>
          ) : (
            <>
              <HeartIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Quitado de favoritos
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Componente compacto para usar en cards
export function WishlistButtonCompact({ productId, className = '' }: { productId: string; className?: string }) {
  return (
    <WishlistButton
      productId={productId}
      size="sm"
      showTooltip={false}
      className={className}
    />
  );
}

// Componente con badge de contador
export function WishlistBadge({ count, className = '' }: { count: number; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <HeartIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      {count > 0 && (
        <span className="
          absolute -top-1 -right-1
          bg-red-500 text-white
          text-xs font-bold
          w-5 h-5 rounded-full
          flex items-center justify-center
        ">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
}
