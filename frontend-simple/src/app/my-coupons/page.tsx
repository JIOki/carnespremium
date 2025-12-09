'use client';

import { useState, useEffect } from 'react';
import { couponService, CouponUsage } from '@/services/couponService';
import Link from 'next/link';

export default function MyCouponsHistoryPage() {
  const [usages, setUsages] = useState<CouponUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await couponService.getMyUsage();
      setUsages(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const getTotalSavings = () => {
    return usages.reduce((total, usage) => total + usage.discountAmount, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Historial de Cupones</h1>
          <p className="mt-2 text-gray-600">
            Consulta todos los cupones que has utilizado
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Card */}
        {usages.length > 0 && (
          <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg shadow-lg p-8 mb-8 text-white">
            <div className="text-center">
              <p className="text-sm uppercase tracking-wide text-red-100 mb-2">Total Ahorrado</p>
              <p className="text-5xl font-bold">${getTotalSavings().toFixed(2)}</p>
              <p className="mt-3 text-red-100">
                Has utilizado {usages.length} {usages.length === 1 ? 'cupón' : 'cupones'}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Lista de Cupones Usados */}
        {usages.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="w-24 h-24 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No has usado ningún cupón
            </h2>
            <p className="text-gray-600 mb-6">
              Explora nuestros cupones disponibles y comienza a ahorrar
            </p>
            <div className="space-x-4">
              <Link
                href="/coupons"
                className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Ver Cupones
              </Link>
              <Link
                href="/busqueda"
                className="inline-block px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Ver Productos
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {usages.map((usage) => (
              <div
                key={usage.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="bg-red-100 rounded-lg p-3 mr-4">
                        <svg
                          className="w-6 h-6 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {usage.coupon?.code || 'Cupón'}
                          </h3>
                          {usage.coupon?.type && (
                            <span className="ml-3 px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                              {usage.coupon.type === 'PERCENTAGE' && 'Porcentaje'}
                              {usage.coupon.type === 'FIXED_AMOUNT' && 'Monto Fijo'}
                              {usage.coupon.type === 'FREE_SHIPPING' && 'Envío Gratis'}
                            </span>
                          )}
                        </div>
                        
                        {usage.coupon?.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {usage.coupon.description}
                          </p>
                        )}
                        
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {new Date(usage.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        {usage.orderId && (
                          <div className="mt-2">
                            <Link
                              href={`/my-orders`}
                              className="text-sm text-red-600 hover:text-red-700 flex items-center"
                            >
                              Ver pedido asociado
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 text-right">
                    <p className="text-sm text-gray-600 mb-1">Ahorraste</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${usage.discountAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Banner promocional */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">¿Buscas más descuentos?</h2>
            <p className="text-blue-100 mb-6">
              Consulta nuestros cupones públicos disponibles y sigue ahorrando
            </p>
            <Link
              href="/coupons"
              className="inline-block px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Ver Cupones Disponibles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
