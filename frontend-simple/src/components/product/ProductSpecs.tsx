'use client';

import React from 'react';
import { Product } from '@/types';
import { Package, MapPin, Award, Star as StarIcon } from 'lucide-react';

interface ProductSpecsProps {
  product: Product;
}

export default function ProductSpecs({ product }: ProductSpecsProps) {
  const specs = [
    {
      icon: MapPin,
      label: 'Origen',
      value: product.origin || 'No especificado',
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      icon: Package,
      label: 'Corte',
      value: product.cut || 'No especificado',
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      icon: Award,
      label: 'Grado',
      value: product.grade || 'No especificado',
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      icon: StarIcon,
      label: 'Marmoleado',
      value: product.marbling || 'No especificado',
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
  ];

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Award className="w-6 h-6 text-[#B9975B]" />
        Especificaciones Técnicas
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        {specs.map((spec, index) => (
          <div
            key={index}
            className={`${spec.bg} rounded-lg p-4 border border-gray-200`}
          >
            <div className="flex items-start gap-3">
              <div className={`${spec.bg} p-2 rounded-lg`}>
                <spec.icon className={`w-5 h-5 ${spec.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-medium mb-1">
                  {spec.label}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {spec.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Maduración */}
      {product.aging && (
        <div className="mt-6 bg-gradient-to-r from-[#8B1E3F]/10 to-[#B9975B]/10 rounded-lg p-4 border-2 border-[#B9975B]/30">
          <div className="flex items-start gap-3">
            <div className="bg-[#B9975B] p-2 rounded-lg">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 font-medium mb-1">
                Maduración
              </p>
              <p className="text-lg font-bold text-[#8B1E3F]">
                {product.aging}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                La maduración desarrolla sabores más profundos y mejora la textura de la carne.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Peso */}
      {product.weight && (
        <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Peso Aproximado</span>
          <span className="text-lg font-bold text-gray-900">
            {product.weight} {product.unit}
          </span>
        </div>
      )}
    </div>
  );
}
