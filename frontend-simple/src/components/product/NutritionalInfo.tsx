'use client';

import React from 'react';
import { Apple } from 'lucide-react';

interface NutritionalInfoProps {
  nutritionalInfo?: any;
}

export default function NutritionalInfo({ nutritionalInfo }: NutritionalInfoProps) {
  // Información nutricional por defecto si no está disponible
  const defaultNutrition = {
    servingSize: '100g',
    calories: 250,
    protein: 26,
    fat: 15,
    saturatedFat: 6,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    sodium: 60,
    cholesterol: 80,
  };

  const nutrition = nutritionalInfo || defaultNutrition;

  const nutrients = [
    { label: 'Calorías', value: `${nutrition.calories} kcal`, highlight: true },
    { label: 'Proteína', value: `${nutrition.protein}g`, highlight: true },
    { label: 'Grasas Totales', value: `${nutrition.fat}g` },
    { label: 'Grasas Saturadas', value: `${nutrition.saturatedFat}g` },
    { label: 'Carbohidratos', value: `${nutrition.carbs}g` },
    { label: 'Fibra', value: `${nutrition.fiber}g` },
    { label: 'Azúcares', value: `${nutrition.sugar}g` },
    { label: 'Sodio', value: `${nutrition.sodium}mg` },
    { label: 'Colesterol', value: `${nutrition.cholesterol}mg` },
  ];

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Apple className="w-6 h-6 text-[#B9975B]" />
        Información Nutricional
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Por porción de {nutrition.servingSize}
      </p>

      <div className="space-y-3">
        {nutrients.map((nutrient, index) => (
          <div
            key={index}
            className={`flex items-center justify-between py-3 border-b border-gray-200 last:border-0 ${
              nutrient.highlight ? 'bg-[#8B1E3F]/5 -mx-6 px-6' : ''
            }`}
          >
            <span className={`font-medium ${
              nutrient.highlight ? 'text-[#8B1E3F] text-lg' : 'text-gray-700'
            }`}>
              {nutrient.label}
            </span>
            <span className={`font-bold ${
              nutrient.highlight ? 'text-[#8B1E3F] text-lg' : 'text-gray-900'
            }`}>
              {nutrient.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-700">
          <strong className="text-[#8B1E3F]">Rico en proteínas:</strong> Excelente fuente de proteína de alta calidad, esencial para el desarrollo muscular y la recuperación.
        </p>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        * Los valores nutricionales son aproximados y pueden variar según el corte específico.
      </p>
    </div>
  );
}
