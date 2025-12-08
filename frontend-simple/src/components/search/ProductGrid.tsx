'use client';

import React from 'react';
import { Product, Pagination } from '@/types';
import ProductCard from '@/components/ProductCard';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}

export default function ProductGrid({ products, pagination, onPageChange, loading = false }: ProductGridProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-lg h-96 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          No se encontraron productos
        </h3>
        <p className="text-gray-600 mb-6">
          Intenta ajustar tus filtros o búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Grid de Productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t">
          {/* Info */}
          <div className="text-sm text-gray-600">
            Mostrando{' '}
            <span className="font-semibold text-gray-900">
              {((pagination.currentPage - 1) * pagination.limit) + 1}
            </span>
            {' '}-{' '}
            <span className="font-semibold text-gray-900">
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalProducts || 0)}
            </span>
            {' '}de{' '}
            <span className="font-semibold text-gray-900">
              {pagination.totalProducts || 0}
            </span>
            {' '}productos
          </div>

          {/* Controles de Paginación */}
          <div className="flex items-center gap-2">
            {/* Botón Anterior */}
            <button
              onClick={() => onPageChange && onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="p-2 border-2 border-gray-300 rounded-lg hover:border-[#8B1E3F] hover:text-[#8B1E3F] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Números de Página */}
            <div className="flex items-center gap-1">
              {getPageNumbers(pagination.currentPage, pagination.totalPages).map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2 text-gray-400">...</span>
                  ) : (
                    <button
                      onClick={() => onPageChange && onPageChange(Number(page))}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        pagination.currentPage === page
                          ? 'bg-[#8B1E3F] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Botón Siguiente */}
            <button
              onClick={() => onPageChange && onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="p-2 border-2 border-gray-300 rounded-lg hover:border-[#8B1E3F] hover:text-[#8B1E3F] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Función auxiliar para generar números de página con elipsis
function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    // Mostrar todas las páginas si son pocas
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Siempre mostrar primera página
    pages.push(1);

    // Calcular rango alrededor de la página actual
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Agregar elipsis al inicio si es necesario
    if (startPage > 2) {
      pages.push('...');
    }

    // Agregar páginas del rango
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Agregar elipsis al final si es necesario
    if (endPage < totalPages - 1) {
      pages.push('...');
    }

    // Siempre mostrar última página
    pages.push(totalPages);
  }

  return pages;
}
