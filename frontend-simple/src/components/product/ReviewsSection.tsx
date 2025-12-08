'use client';

import React, { useState } from 'react';
import { Review } from '@/types';
import { Star, ThumbsUp, MessageSquare, ChevronDown } from 'lucide-react';

interface ReviewsSectionProps {
  reviews?: Review[];
  averageRating?: number;
  reviewCount?: number;
}

export default function ReviewsSection({
  reviews = [],
  averageRating = 4.5,
  reviewCount = 0,
}: ReviewsSectionProps) {
  const [showAll, setShowAll] = useState(false);

  // Reseñas de ejemplo si no hay disponibles
  const defaultReviews: Review[] = [
    {
      id: '1',
      userId: 'user1',
      rating: 5,
      title: 'Excelente calidad',
      comment: 'La carne llegó en perfectas condiciones, muy fresca y con un marmoleado espectacular. El sabor es increíble.',
      isVerified: true,
      isVisible: true,
      helpfulCount: 12,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 'user1',
        name: 'Carlos Rodríguez',
        email: 'carlos@example.com',
        role: 'CUSTOMER' as any,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    },
    {
      id: '2',
      userId: 'user2',
      rating: 4,
      title: 'Muy buena',
      comment: 'Producto de calidad premium. El empaque es excelente y la entrega fue rápida. Definitivamente volveré a comprar.',
      isVerified: true,
      isVisible: true,
      helpfulCount: 8,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 'user2',
        name: 'María González',
        email: 'maria@example.com',
        role: 'CUSTOMER' as any,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    },
    {
      id: '3',
      userId: 'user3',
      rating: 5,
      title: 'Perfecta para asados',
      comment: 'La usé para un asado familiar y todos quedaron impresionados. La textura y el sabor son superiores.',
      isVerified: true,
      isVisible: true,
      helpfulCount: 15,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 'user3',
        name: 'José Martínez',
        email: 'jose@example.com',
        role: 'CUSTOMER' as any,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews : defaultReviews;
  const visibleReviews = showAll ? displayReviews : displayReviews.slice(0, 3);
  const totalReviews = reviewCount || displayReviews.length;

  // Calcular distribución de estrellas
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = displayReviews.filter((r) => r.rating === stars).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { stars, count, percentage };
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-[#B9975B]" />
        Reseñas de Clientes
      </h2>

      {/* Resumen de Calificaciones */}
      <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b">
        {/* Rating Promedio */}
        <div className="text-center">
          <div className="text-5xl font-bold text-[#8B1E3F] mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${
                  i < Math.floor(averageRating)
                    ? 'text-[#B9975B] fill-[#B9975B]'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-gray-600">Basado en {totalReviews} reseñas</p>
        </div>

        {/* Distribución de Estrellas */}
        <div className="space-y-2">
          {ratingDistribution.map(({ stars, count, percentage }) => (
            <div key={stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-20">
                <span className="text-sm font-medium text-gray-700">{stars}</span>
                <Star className="w-4 h-4 text-[#B9975B] fill-[#B9975B]" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#B9975B] h-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Reseñas */}
      <div className="space-y-6">
        {visibleReviews.map((review) => (
          <div key={review.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
            {/* Header de la Reseña */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {review.user.name}
                  </span>
                  {review.isVerified && (
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                      Compra verificada
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'text-[#B9975B] fill-[#B9975B]'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Contenido de la Reseña */}
            {review.title && (
              <h4 className="font-semibold text-gray-900 mb-2">
                {review.title}
              </h4>
            )}
            {review.comment && (
              <p className="text-gray-700 leading-relaxed mb-3">
                {review.comment}
              </p>
            )}

            {/* Footer de la Reseña */}
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#8B1E3F] transition-colors">
              <ThumbsUp className="w-4 h-4" />
              Útil ({review.helpfulCount})
            </button>
          </div>
        ))}
      </div>

      {/* Botón Ver Más */}
      {displayReviews.length > 3 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-[#8B1E3F] hover:text-[#8B1E3F] transition-colors flex items-center justify-center gap-2"
        >
          Ver todas las reseñas ({displayReviews.length})
          <ChevronDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
