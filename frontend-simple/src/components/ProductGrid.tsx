'use client'

import { useQuery } from '@tanstack/react-query'
import ProductCard from './ProductCard'
import ProductService from '@/lib/services/products'
import { Product } from '@/types'

export default function ProductGrid() {
  const {
    data: productsData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['products', { page: 1, limit: 8 }],
    queryFn: () => ProductService.getProducts({ page: 1, limit: 8 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (error) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="font-serif text-3xl font-semibold text-neutral-900 mb-4">
              Error al cargar productos
            </h2>
            <p className="text-neutral-600 mb-6">
              No pudimos cargar los productos en este momento. Por favor intenta nuevamente.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-neutral-900 mb-4">
            Nuestros Cortes Selectos
          </h2>
          <p className="text-lg text-neutral-700 max-w-2xl mx-auto">
            Cada pieza es cuidadosamente seleccionada para garantizar la máxima calidad y sabor.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-neutral-200 rounded-lg aspect-[4/3] mb-4"></div>
                <div className="space-y-3">
                  <div className="h-6 bg-neutral-200 rounded w-3/4"></div>
                  <div className="h-4 bg-neutral-200 rounded w-full"></div>
                  <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
                  <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
                  <div className="h-12 bg-neutral-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {productsData?.products && productsData.products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {productsData.products.map((product: Product & { imageUrl?: string; shortDesc?: string; variants?: any[] }) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* View More Button */}
            <div className="text-center">
              <a
                href="/busqueda"
                className="inline-flex items-center px-8 py-4 bg-primary-500 text-white font-medium 
                         rounded-lg hover:bg-primary-600 transition-all duration-300 hover:transform 
                         hover:-translate-y-1 shadow-lg hover:shadow-xl"
              >
                Ver Todos los Productos
                <svg 
                  className="ml-2 w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </a>
            </div>
          </>
        )}

        {/* Empty State */}
        {productsData?.products && productsData.products.length === 0 && (
          <div className="text-center py-12">
            <h3 className="font-serif text-2xl font-semibold text-neutral-900 mb-4">
              No hay productos disponibles
            </h3>
            <p className="text-neutral-600 mb-6">
              Estamos trabajando para traerte los mejores cortes. Vuelve pronto.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}