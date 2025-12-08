'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  HeartIcon,
  ShoppingCartIcon,
  UserIcon,
  EyeIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import wishlistService from '@/services/wishlistService';
import Image from 'next/image';

export default function SharedWishlistViewPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [wishlist, setWishlist] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      loadSharedWishlist();
    }
  }, [token]);

  const loadSharedWishlist = async () => {
    try {
      setLoading(true);
      const response = await wishlistService.getSharedWishlist(token);

      if (response.success) {
        setWishlist(response.data.sharedWishlist);
        setItems(response.data.items);
      }
    } catch (error: any) {
      console.error('Error loading shared wishlist:', error);
      
      if (error.response?.status === 404) {
        setError('Esta lista de deseos no existe o fue eliminada');
      } else if (error.response?.status === 410) {
        setError('Este enlace ha expirado');
      } else {
        setError('Error al cargar la lista de deseos');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyItem = async (productId: string) => {
    try {
      await wishlistService.toggleWishlist(productId);
      alert('Producto agregado a tu lista de deseos');
    } catch (error: any) {
      if (error.response?.status === 401) {
        if (confirm('Debes iniciar sesión para agregar productos. ¿Ir al login?')) {
          router.push('/login');
        }
      } else {
        alert('Error al agregar producto');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md text-center border border-gray-200 dark:border-gray-700">
          <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error}
          </h2>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {wishlist?.title || 'Lista de Deseos'}
              </h1>
              {wishlist?.description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {wishlist.description}
                </p>
              )}
            </div>

            {wishlist?.isPublic && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold">
                Lista Pública
              </span>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              <span>Compartida por {wishlist?.owner?.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <EyeIcon className="w-5 h-5" />
              <span>{wishlist?.viewCount} vistas</span>
            </div>

            <div className="flex items-center gap-2">
              <HeartIcon className="w-5 h-5" />
              <span>{items.length} productos</span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {items.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Esta lista está vacía
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100 dark:bg-gray-700 cursor-pointer"
                  onClick={() => router.push(`/products/${item.product?.slug}`)}
                >
                  {item.product?.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCartIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}

                  {/* Priority Badge */}
                  {item.priority === 'HIGH' && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      Alta prioridad
                    </div>
                  )}

                  {/* Stock Status */}
                  {!item.product?.variants?.[0]?.stock && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold">
                        Agotado
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 
                    className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 cursor-pointer hover:text-red-600"
                    onClick={() => router.push(`/products/${item.product?.slug}`)}
                  >
                    {item.product?.name}
                  </h3>

                  {/* Category */}
                  {item.product?.category && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {item.product.category.name}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    {item.product?.variants?.[0] && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          ${item.product.variants[0].price.toFixed(2)}
                        </span>
                        {item.product.variants[0].comparePrice && item.product.variants[0].comparePrice > item.product.variants[0].price && (
                          <span className="text-sm text-gray-500 line-through">
                            ${item.product.variants[0].comparePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      💭 {item.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/products/${item.product?.slug}`)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCartIcon className="w-5 h-5" />
                      Ver producto
                    </button>

                    {wishlist?.allowCopy && (
                      <button
                        onClick={() => handleCopyItem(item.productId)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Agregar a mi wishlist"
                      >
                        <ClipboardDocumentCheckIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Ir a la tienda
          </button>
        </div>
      </div>
    </div>
  );
}
