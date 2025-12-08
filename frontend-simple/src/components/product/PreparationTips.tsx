'use client';

import React from 'react';
import { ChefHat, Refrigerator, Clock, Flame, Thermometer } from 'lucide-react';

interface PreparationTipsProps {
  preparationTips?: string;
  storageInfo?: string;
}

export default function PreparationTips({ preparationTips, storageInfo }: PreparationTipsProps) {
  // Tips por defecto si no están disponibles
  const defaultPreparationTips = `
    • Saca la carne del refrigerador 30 minutos antes de cocinar para que alcance temperatura ambiente
    • Seca bien la superficie con papel absorbente antes de cocinar
    • Sazona generosamente con sal gruesa antes de cocinar
    • Utiliza fuego alto para sellar ambos lados (2-3 minutos por lado)
    • Deja reposar 5-10 minutos antes de cortar para redistribuir los jugos
  `;

  const defaultStorageInfo = `
    • Refrigeración: 2-3 días en su empaque original a 0-4°C
    • Congelación: Hasta 6 meses a -18°C o menos
    • Descongelación: En refrigerador durante 12-24 horas
    • Nunca recongeles carne previamente descongelada
  `;

  const cookingTips = [
    {
      icon: ChefHat,
      title: 'Técnica de Cocción',
      description: 'Para un término medio, cocina 4-5 minutos por lado a fuego alto.',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      icon: Thermometer,
      title: 'Temperatura Ideal',
      description: 'Término medio: 55-60°C en el centro. Usa un termómetro de cocina.',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      icon: Clock,
      title: 'Tiempo de Reposo',
      description: 'Deja reposar 5-10 minutos cubierta con papel aluminio.',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Flame,
      title: 'Fuego Alto',
      description: 'Sella a fuego alto para crear una costra dorada y mantener los jugos.',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tips de Cocción Rápidos */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-[#B9975B]" />
          Consejos de Cocción
        </h2>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {cookingTips.map((tip, index) => (
            <div
              key={index}
              className={`${tip.bg} rounded-lg p-4 border border-gray-200`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${tip.bg}`}>
                  <tip.icon className={`w-5 h-5 ${tip.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${tip.color}`}>
                    {tip.title}
                  </h3>
                  <p className="text-sm text-gray-700">
                    {tip.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Preparación Detallada */}
        <div className="bg-gradient-to-r from-[#8B1E3F]/5 to-[#B9975B]/5 rounded-lg p-6 border-2 border-[#B9975B]/20">
          <h3 className="font-bold text-[#8B1E3F] mb-3 flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Pasos de Preparación
          </h3>
          <div className="prose prose-sm text-gray-700">
            {preparationTips ? (
              <p className="whitespace-pre-line">{preparationTips}</p>
            ) : (
              <div className="space-y-2">
                {defaultPreparationTips.trim().split('\n').map((line, i) => (
                  <p key={i} className="mb-2">{line.trim()}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información de Almacenamiento */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Refrigerator className="w-6 h-6 text-[#B9975B]" />
          Almacenamiento y Conservación
        </h2>

        <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Refrigerator className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 mb-3">
                Guía de Almacenamiento
              </h3>
              <div className="prose prose-sm text-gray-700">
                {storageInfo ? (
                  <p className="whitespace-pre-line">{storageInfo}</p>
                ) : (
                  <div className="space-y-2">
                    {defaultStorageInfo.trim().split('\n').map((line, i) => (
                      <p key={i} className="mb-2">{line.trim()}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-200 mt-4">
            <p className="text-sm text-gray-700">
              <strong className="text-[#8B1E3F]">Importante:</strong> Mantén la cadena de frío intacta. 
              Si la carne llega congelada, transfiérela inmediatamente al congelador.
            </p>
          </div>
        </div>

        {/* Términos de Cocción */}
        <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-[#8B1E3F]" />
            Guía de Términos de Cocción
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: 'Término Rojo', temp: '45-50°C', time: '2-3 min/lado' },
              { name: 'Término Medio', temp: '55-60°C', time: '4-5 min/lado' },
              { name: 'Bien Cocido', temp: '65-70°C', time: '6-7 min/lado' },
            ].map((term, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="font-semibold text-[#8B1E3F] text-sm mb-1">
                  {term.name}
                </p>
                <p className="text-xs text-gray-600">Temp: {term.temp}</p>
                <p className="text-xs text-gray-600">Tiempo: {term.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
