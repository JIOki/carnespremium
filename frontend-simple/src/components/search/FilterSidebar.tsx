'use client';

import React, { useState } from 'react';
import { ProductFilters } from '@/types';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterSidebarProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onClearFilters: () => void;
  categories: Array<{ id: string; name: string; productCount?: number }>;
}

export default function FilterSidebar({ filters, onFiltersChange, onClearFilters, categories }: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    price: true,
    specs: true,
    stock: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({
      ...filters,
      category: filters.category === categoryId ? undefined : categoryId,
    });
  };

  const handlePriceChange = (min?: number, max?: number) => {
    onFiltersChange({
      ...filters,
      minPrice: min,
      maxPrice: max,
    });
  };

  const handleSpecChange = (field: 'cut' | 'grade' | 'origin', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: filters[field] === value ? undefined : value,
    });
  };

  const handleStockChange = (inStock: boolean) => {
    onFiltersChange({
      ...filters,
      inStock: filters.inStock === inStock ? undefined : inStock,
    });
  };

  const handleFeaturedChange = (featured: boolean) => {
    onFiltersChange({
      ...filters,
      featured: filters.featured === featured ? undefined : featured,
    });
  };

  // Opciones de filtros
  const priceRanges = [
    { label: 'Menos de $200', min: 0, max: 200 },
    { label: '$200 - $500', min: 200, max: 500 },
    { label: '$500 - $1000', min: 500, max: 1000 },
    { label: 'Más de $1000', min: 1000, max: undefined },
  ];

  const cuts = ['Ribeye', 'New York', 'T-Bone', 'Filete', 'Sirloin', 'Cowboy'];
  const grades = ['Prime', 'Choice', 'Select', 'Wagyu', 'Angus'];
  const origins = ['Estados Unidos', 'Argentina', 'México', 'Australia', 'Japón'];

  const activeFiltersCount = [
    filters.category,
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.cut,
    filters.grade,
    filters.origin,
    filters.inStock,
    filters.featured,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#B9975B]" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="bg-[#8B1E3F] text-white text-xs font-semibold px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </h2>
        {activeFiltersCount > 0 && (
          <button
            onClick={onClearFilters}
            className="text-sm text-[#8B1E3F] hover:underline font-medium"
          >
            Limpiar todo
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Categorías */}
        <div className="border-b pb-6">
          <button
            onClick={() => toggleSection('category')}
            className="w-full flex items-center justify-between mb-3"
          >
            <h3 className="font-semibold text-gray-900">Categorías</h3>
            {expandedSections.category ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {expandedSections.category && (
            <div className="space-y-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.category === category.id}
                    onChange={() => handleCategoryChange(category.id)}
                    className="w-4 h-4 text-[#8B1E3F] border-gray-300 rounded focus:ring-[#8B1E3F]"
                  />
                  <span className="text-gray-700 flex-1">{category.name}</span>
                  {category.productCount !== undefined && (
                    <span className="text-sm text-gray-500">({category.productCount})</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Rango de Precio */}
        <div className="border-b pb-6">
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between mb-3"
          >
            <h3 className="font-semibold text-gray-900">Precio</h3>
            {expandedSections.price ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {expandedSections.price && (
            <div className="space-y-2">
              {priceRanges.map((range, index) => {
                const isActive = 
                  filters.minPrice === range.min && 
                  filters.maxPrice === range.max;
                
                return (
                  <label
                    key={index}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => handlePriceChange(range.min, range.max)}
                      className="w-4 h-4 text-[#8B1E3F] border-gray-300 rounded focus:ring-[#8B1E3F]"
                    />
                    <span className="text-gray-700">{range.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Especificaciones */}
        <div className="border-b pb-6">
          <button
            onClick={() => toggleSection('specs')}
            className="w-full flex items-center justify-between mb-3"
          >
            <h3 className="font-semibold text-gray-900">Especificaciones</h3>
            {expandedSections.specs ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {expandedSections.specs && (
            <div className="space-y-4">
              {/* Cortes */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Corte</p>
                <div className="flex flex-wrap gap-2">
                  {cuts.map((cut) => (
                    <button
                      key={cut}
                      onClick={() => handleSpecChange('cut', cut)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filters.cut === cut
                          ? 'bg-[#8B1E3F] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cut}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grados */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Grado</p>
                <div className="flex flex-wrap gap-2">
                  {grades.map((grade) => (
                    <button
                      key={grade}
                      onClick={() => handleSpecChange('grade', grade)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filters.grade === grade
                          ? 'bg-[#8B1E3F] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* Origen */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Origen</p>
                <div className="flex flex-wrap gap-2">
                  {origins.map((origin) => (
                    <button
                      key={origin}
                      onClick={() => handleSpecChange('origin', origin)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filters.origin === origin
                          ? 'bg-[#8B1E3F] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {origin}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Disponibilidad */}
        <div>
          <button
            onClick={() => toggleSection('stock')}
            className="w-full flex items-center justify-between mb-3"
          >
            <h3 className="font-semibold text-gray-900">Disponibilidad</h3>
            {expandedSections.stock ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {expandedSections.stock && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={filters.inStock === true}
                  onChange={() => handleStockChange(true)}
                  className="w-4 h-4 text-[#8B1E3F] border-gray-300 rounded focus:ring-[#8B1E3F]"
                />
                <span className="text-gray-700">En stock</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={filters.featured === true}
                  onChange={() => handleFeaturedChange(true)}
                  className="w-4 h-4 text-[#8B1E3F] border-gray-300 rounded focus:ring-[#8B1E3F]"
                />
                <span className="text-gray-700">Productos destacados</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
