'use client'

import { useState, useEffect } from 'react'
import ProductCard from './ProductCard'

export default function ProductGrid() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('http://localhost:3001/api/products')
        
        if (!response.ok) {
          throw new Error('Error al cargar productos')
        }
        
        const data = await response.json()
        
        if (data.success && data.data?.products) {
          setProducts(data.data.products)
        } else {
          setError('No se pudieron cargar los productos')
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Error de conexión')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (error) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="font-serif text-3xl font-semibold text-neutral-900 mb-4">
              Error al cargar productos
            </h2>
            <p className="text-neutral-600 mb-6">
              {error}. Por favor intenta nuevamente.
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
        {products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* View More Button */}
            <div className="text-center">
              <a
                href="/productos"
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
        {!isLoading && products.length === 0 && !error && (
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