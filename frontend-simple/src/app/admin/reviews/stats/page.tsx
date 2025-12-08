'use client';

import React, { useEffect, useState } from 'react';
import { ReviewStats, reviewService } from '@/services/reviewService';
import StarRating from '@/components/review/StarRating';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminReviewStatsPage() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await reviewService.getReviewStats();
      setStats(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 mx-auto text-red-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-gray-600">Cargando estadísticas...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <svg
              className="w-20 h-20 mx-auto text-red-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Error al cargar estadísticas
            </h3>
            <button
              onClick={loadStats}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Estadísticas de Reseñas
            </h1>
            <p className="text-gray-600">
              Análisis completo de las reseñas de clientes
            </p>
          </div>
          <Link
            href="/admin/reviews"
            className="px-6 py-3 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver a Moderación
          </Link>
        </div>

        {/* Tarjetas de estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.totalReviews}
            </div>
            <div className="text-sm text-gray-600">Total de Reseñas</div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {stats.pendingReviews}
            </div>
            <div className="text-sm text-gray-600">Pendientes</div>
            {stats.pendingReviews > 0 && (
              <Link
                href="/admin/reviews"
                className="text-xs text-yellow-600 hover:text-yellow-700 mt-2 inline-block"
              >
                Revisar ahora →
              </Link>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
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
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats.approvedReviews}
            </div>
            <div className="text-sm text-gray-600">Aprobadas</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalReviews > 0
                ? ((stats.approvedReviews / stats.totalReviews) * 100).toFixed(1)
                : 0}
              % del total
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {stats.verifiedPurchases}
            </div>
            <div className="text-sm text-gray-600">Compras Verificadas</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalReviews > 0
                ? ((stats.verifiedPurchases / stats.totalReviews) * 100).toFixed(1)
                : 0}
              % del total
            </div>
          </div>
        </div>

        {/* Calificación promedio y distribución */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Calificación promedio */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Calificación Promedio
            </h3>
            <div className="flex flex-col items-center">
              <div className="text-6xl font-bold text-gray-900 mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <StarRating rating={stats.averageRating} size="xl" />
              <div className="text-sm text-gray-600 mt-3">
                De {stats.approvedReviews} reseñas aprobadas
              </div>
            </div>
          </div>

          {/* Distribución de calificaciones */}
          <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Distribución de Calificaciones
            </h3>
            <div className="space-y-3">
              {stats.distribution
                .slice()
                .reverse()
                .map((item) => (
                  <div key={item.rating} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-12">
                      {item.rating}
                      <svg
                        className="inline w-4 h-4 text-yellow-400 ml-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </span>
                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all duration-300"
                        style={{
                          width:
                            stats.approvedReviews > 0
                              ? `${(item.count / stats.approvedReviews) * 100}%`
                              : '0%'
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">
                      {stats.approvedReviews > 0
                        ? ((item.count / stats.approvedReviews) * 100).toFixed(0)
                        : 0}
                      %
                    </span>
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Estadísticas adicionales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Reseñas recientes */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Actividad Reciente</h3>
              <span className="text-sm text-gray-500">Últimos 30 días</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.recentReviews}
                </div>
                <div className="text-sm text-gray-600">Reseñas nuevas</div>
              </div>
            </div>
          </div>

          {/* Estado de moderación */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Estado de Moderación
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Aprobadas</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width:
                          stats.totalReviews > 0
                            ? `${(stats.approvedReviews / stats.totalReviews) * 100}%`
                            : '0%'
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-16 text-right">
                    {stats.totalReviews > 0
                      ? ((stats.approvedReviews / stats.totalReviews) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pendientes</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 transition-all"
                      style={{
                        width:
                          stats.totalReviews > 0
                            ? `${(stats.pendingReviews / stats.totalReviews) * 100}%`
                            : '0%'
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-16 text-right">
                    {stats.totalReviews > 0
                      ? ((stats.pendingReviews / stats.totalReviews) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rechazadas</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{
                        width:
                          stats.totalReviews > 0
                            ? `${(stats.rejectedReviews / stats.totalReviews) * 100}%`
                            : '0%'
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-16 text-right">
                    {stats.totalReviews > 0
                      ? ((stats.rejectedReviews / stats.totalReviews) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Productos más reseñados */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Productos Más Reseñados
          </h3>
          {stats.topReviewedProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay datos disponibles
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {stats.topReviewedProducts.map((item, index) => (
                <Link
                  key={item.product.id}
                  href={`/products/${item.product.id}`}
                  className="group"
                >
                  <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold flex-shrink-0">
                        #{index + 1}
                      </div>
                      {item.product.imageUrl && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0">
                          <Image
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1 line-clamp-2 group-hover:text-red-600 transition-colors">
                      {item.product.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        {item.reviewCount} {item.reviewCount === 1 ? 'reseña' : 'reseñas'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
