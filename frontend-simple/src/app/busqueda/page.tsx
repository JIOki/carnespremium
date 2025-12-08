'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product, ProductFilters, ProductSortBy, Category, PaginatedResponse } from '@/types';
import SearchBar from '@/components/search/SearchBar';
import FilterSidebar from '@/components/search/FilterSidebar';
import SortDropdown from '@/components/search/SortDropdown';
import ProductGrid from '@/components/search/ProductGrid';
import ActiveFilters from '@/components/search/ActiveFilters';
import { SlidersHorizontal, X } from 'lucide-react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Estado
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filtros desde URL
  const [filters, setFilters] = useState<ProductFilters>({
    q: searchParams.get('q') || undefined,
    category: searchParams.get('category') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    cut: searchParams.get('cut') || undefined,
    grade: searchParams.get('grade') || undefined,
    origin: searchParams.get('origin') || undefined,
    inStock: searchParams.get('inStock') === 'true' ? true : undefined,
    featured: searchParams.get('featured') === 'true' ? true : undefined,
    sortBy: (searchParams.get('sortBy') as ProductSortBy) || ProductSortBy.CREATED_DESC,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: 12,
  });

  // Cargar categorías
  useEffect(() => {
    fetchCategories();
  }, []);

  // Cargar productos cuando cambian los filtros
  useEffect(() => {
    fetchProducts();
    updateURL();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${API_URL}/categories`);
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Construir query params
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${API_URL}/products?${params}`);
      
      if (response.ok) {
        const data: PaginatedResponse<Product> = await response.json();
        setProducts(data.data?.products || []);
        setPagination(data.data?.pagination || null);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const newURL = params.toString() ? `/busqueda?${params}` : '/busqueda';
    router.push(newURL, { scroll: false });
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, q: query || undefined, page: 1 }));
  };

  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handleSortChange = (sortBy: ProductSortBy) => {
    setFilters(prev => ({ ...prev, sortBy, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setFilters({
      sortBy: ProductSortBy.CREATED_DESC,
      page: 1,
      limit: 12,
    });
  };

  const handleRemoveFilter = (key: keyof ProductFilters) => {
    setFilters(prev => {
      const updated = { ...prev };
      if (key === 'minPrice' || key === 'maxPrice') {
        delete updated.minPrice;
        delete updated.maxPrice;
      } else {
        delete updated[key];
      }
      return { ...updated, page: 1 };
    });
  };

  const activeFiltersCount = [
    filters.q,
    filters.category,
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.cut,
    filters.grade,
    filters.origin,
    filters.inStock,
    filters.featured,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 max-w-7xl py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {filters.q ? `Resultados para "${filters.q}"` : 'Todos los Productos'}
          </h1>
          
          {/* Barra de Búsqueda */}
          <div className="max-w-2xl">
            <SearchBar
              onSearch={handleSearch}
              initialQuery={filters.q}
              placeholder="Buscar por nombre, categoría, corte..."
            />
          </div>
        </div>

        {/* Layout Principal */}
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar de Filtros - Desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-4">
              <FilterSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                categories={categories}
              />
            </div>
          </aside>

          {/* Contenido Principal */}
          <main className="lg:col-span-3">
            {/* Filtros Activos */}
            <ActiveFilters
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearFilters}
            />

            {/* Barra de Herramientas */}
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg border-2 border-gray-200">
              {/* Botón Filtros Mobile */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-[#8B1E3F] transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-sm font-medium">Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-[#8B1E3F] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Contador de Resultados */}
              <div className="text-sm text-gray-600">
                {!loading && pagination && (
                  <span>
                    <strong className="text-gray-900">{pagination.totalProducts || 0}</strong> productos encontrados
                  </span>
                )}
              </div>

              {/* Ordenamiento */}
              <SortDropdown
                sortBy={filters.sortBy || ProductSortBy.CREATED_DESC}
                onSortChange={handleSortChange}
              />
            </div>

            {/* Grid de Productos */}
            <ProductGrid
              products={products}
              pagination={pagination}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </main>
        </div>
      </div>

      {/* Sidebar Mobile */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />

          {/* Sidebar */}
          <div className="absolute top-0 left-0 bottom-0 w-full max-w-sm bg-white overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="bg-[#8B1E3F] text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <FilterSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                categories={categories}
              />
            </div>

            {/* Botón Aplicar */}
            <div className="sticky bottom-0 bg-white border-t p-4">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-[#8B1E3F] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#6D1830] transition-colors"
              >
                Ver Resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
