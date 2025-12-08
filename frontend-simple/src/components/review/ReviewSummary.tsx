'use client';

import React from 'react';
import StarRating from './StarRating';
import { ReviewSummary as ReviewSummaryType } from '@/services/reviewService';

interface ReviewSummaryProps {
  summary: ReviewSummaryType;
  className?: string;
}

export default function ReviewSummary({ summary, className = '' }: ReviewSummaryProps) {
  const { averageRating, totalReviews, verifiedPurchases, distribution } = summary;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Calificaciones de Clientes
      </h3>

      {/* Resumen general */}
      <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
        <div className="flex flex-col items-center">
          <div className="text-5xl font-bold text-gray-900 mb-1">
            {averageRating.toFixed(1)}
          </div>
          <StarRating rating={averageRating} size="lg" />
          <div className="text-sm text-gray-600 mt-2">
            {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'}
          </div>
        </div>

        <div className="flex-1">
          <div className="space-y-2">
            {distribution
              .slice()
              .reverse()
              .map((item) => (
                <div key={item.rating} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 w-8">
                    {item.rating}
                    <svg
                      className="inline w-4 h-4 text-yellow-400 ml-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{
                        width: item.percentage
                          ? `${item.percentage}%`
                          : totalReviews > 0
                          ? `${(item.count / totalReviews) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {item.percentage
                      ? `${item.percentage}%`
                      : totalReviews > 0
                      ? `${((item.count / totalReviews) * 100).toFixed(0)}%`
                      : '0%'}
                  </span>
                  <span className="text-sm text-gray-500 w-8 text-right">
                    ({item.count})
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Compras verificadas */}
      {verifiedPurchases > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {verifiedPurchases} {verifiedPurchases === 1 ? 'compra verificada' : 'compras verificadas'}
          </span>
        </div>
      )}
    </div>
  );
}
