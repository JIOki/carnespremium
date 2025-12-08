'use client';

import React from 'react';
import { ProductSortBy } from '@/types';
import { ArrowUpDown, Check } from 'lucide-react';

interface SortDropdownProps {
  sortBy: ProductSortBy;
  onSortChange: (sortBy: ProductSortBy) => void;
}

export default function SortDropdown({ sortBy, onSortChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const sortOptions = [
    { value: ProductSortBy.CREATED_DESC, label: 'Más recientes' },
    { value: ProductSortBy.PRICE_ASC, label: 'Precio: Menor a Mayor' },
    { value: ProductSortBy.PRICE_DESC, label: 'Precio: Mayor a Menor' },
    { value: ProductSortBy.NAME_ASC, label: 'Nombre: A-Z' },
    { value: ProductSortBy.NAME_DESC, label: 'Nombre: Z-A' },
    { value: ProductSortBy.RATING_DESC, label: 'Mejor valorados' },
  ];

  const currentOption = sortOptions.find(opt => opt.value === sortBy) || sortOptions[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-[#8B1E3F] transition-colors"
      >
        <ArrowUpDown className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentOption.label}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-56 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-20">
            <div className="py-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                    sortBy === option.value
                      ? 'bg-[#8B1E3F]/10 text-[#8B1E3F] font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {sortBy === option.value && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
