'use client';

import React from 'react';
import { ProductFilters } from '@/types';
import { X } from 'lucide-react';

interface ActiveFiltersProps {
  filters: ProductFilters;
  onRemoveFilter: (key: keyof ProductFilters) => void;
  onClearAll: () => void;
}

export default function ActiveFilters({ filters, onRemoveFilter, onClearAll }: ActiveFiltersProps) {
  const filterTags = [];

  // Búsqueda
  if (filters.q) {
    filterTags.push({
      key: 'q' as keyof ProductFilters,
      label: `Búsqueda: "${filters.q}"`,
    });
  }

  // Precio
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const minPrice = filters.minPrice || 0;
    const maxPrice = filters.maxPrice;
    const label = maxPrice
      ? `Precio: $${minPrice} - $${maxPrice}`
      : `Precio: Más de $${minPrice}`;
    filterTags.push({
      key: 'minPrice' as keyof ProductFilters,
      label,
      removeKeys: ['minPrice', 'maxPrice'],
    });
  }

  // Corte
  if (filters.cut) {
    filterTags.push({
      key: 'cut' as keyof ProductFilters,
      label: `Corte: ${filters.cut}`,
    });
  }

  // Grado
  if (filters.grade) {
    filterTags.push({
      key: 'grade' as keyof ProductFilters,
      label: `Grado: ${filters.grade}`,
    });
  }

  // Origen
  if (filters.origin) {
    filterTags.push({
      key: 'origin' as keyof ProductFilters,
      label: `Origen: ${filters.origin}`,
    });
  }

  // En stock
  if (filters.inStock) {
    filterTags.push({
      key: 'inStock' as keyof ProductFilters,
      label: 'En stock',
    });
  }

  // Destacados
  if (filters.featured) {
    filterTags.push({
      key: 'featured' as keyof ProductFilters,
      label: 'Productos destacados',
    });
  }

  if (filterTags.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Filtros Activos ({filterTags.length})
        </h3>
        <button
          onClick={onClearAll}
          className="text-sm text-[#8B1E3F] hover:underline font-medium"
        >
          Limpiar todos
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {filterTags.map((tag, index) => (
          <button
            key={index}
            onClick={() => {
              if (tag.removeKeys) {
                tag.removeKeys.forEach(k => onRemoveFilter(k as keyof ProductFilters));
              } else {
                onRemoveFilter(tag.key);
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#8B1E3F]/10 text-[#8B1E3F] rounded-full text-sm font-medium hover:bg-[#8B1E3F]/20 transition-colors"
          >
            <span>{tag.label}</span>
            <X className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
