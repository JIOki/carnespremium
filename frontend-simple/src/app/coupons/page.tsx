'use client';

import { useState, useEffect } from 'react';
import { couponService, Coupon } from '@/services/couponService';
import Link from 'next/link';

export default function PublicCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const response = await couponService.getPublicCoupons();
      setCoupons(response.data);
    } catch (err) {
      console.error('Error al cargar cupones:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PERCENTAGE': return 'Porcentaje';
      case 'FIXED_AMOUNT': return 'Monto Fijo';
      case 'FREE_SHIPPING': return 'Envío Gratis';
      default: return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'PERCENTAGE': return 'bg-blue-100 text-blue-800';
      case 'FIXED_AMOUNT': return 'bg-green-100 text-green-800';
      case 'FREE_SHIPPING': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (coupon: Coupon) => {
    if (coupon.type === 'PERCENTAGE') {
      return `${coupon.value}% OFF`;
    } else if (coupon.type === 'FIXED_AMOUNT') {
      return `$${coupon.value.toFixed(2)} OFF`;
    } else {
      return 'ENVÍO GRATIS';
    }
  };

  const getDaysRemaining = (validUntil?: string) => {
    if (!validUntil) return null;
    
    const now = new Date();
    const until = new Date(validUntil);
    const diffTime = until.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Cargando cupones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Cupones y Promociones</h1>
            <p className="text-xl text-red-100">
              Ahorra en tus compras con nuestros cupones exclusivos
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {coupons.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
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
              No hay cupones disponibles
            </h2>
            <p className="text-gray-600 mb-6">
              Por el momento no tenemos cupones públicos activos
            </p>
            <Link
              href="/busqueda"
              className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => {
              const daysRemaining = getDaysRemaining(coupon.validUntil);
              
              return (
                <div
                  key={coupon.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Header del cupón */}
                  <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                    <div className="flex items-start justify-between mb-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(coupon.type)} bg-white`}>
                        {getTypeLabel(coupon.type)}
                      </span>
                      {daysRemaining !== null && daysRemaining <= 7 && (
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-400 text-yellow-900 rounded-full">
                          {daysRemaining === 0 ? '¡Último día!' : `${daysRemaining} días`}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="text-4xl font-bold mb-2">{formatValue(coupon)}</p>
                      {coupon.description && (
                        <p className="text-sm text-red-100">{coupon.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Body del cupón */}
                  <div className="p-6">
                    {/* Código del cupón */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-2 font-medium">CÓDIGO:</p>
                      <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                        <code className="text-lg font-bold text-gray-900">{coupon.code}</code>
                        <button
                          onClick={() => copyToClipboard(coupon.code)}
                          className="ml-2 text-red-600 hover:text-red-700 transition"
                          title="Copiar código"
                        >
                          {copiedCode === coupon.code ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Condiciones */}
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      {coupon.minPurchase && coupon.minPurchase > 0 && (
                        <div className="flex items-start">
                          <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Compra mínima: ${coupon.minPurchase.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {coupon.maxDiscount && coupon.type === 'PERCENTAGE' && (
                        <div className="flex items-start">
                          <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Descuento máximo: ${coupon.maxDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      {coupon.maxUsagePerUser && coupon.maxUsagePerUser > 0 && (
                        <div className="flex items-start">
                          <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Máximo {coupon.maxUsagePerUser} {coupon.maxUsagePerUser === 1 ? 'uso' : 'usos'} por usuario</span>
                        </div>
                      )}

                      {coupon.validUntil && (
                        <div className="flex items-start">
                          <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <span>Válido hasta: {new Date(coupon.validUntil).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <Link
                      href="/checkout"
                      className="block w-full text-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      Usar Cupón
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Instrucciones */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">¿Cómo usar tus cupones?</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Copia el código del cupón que deseas usar</li>
            <li>Agrega productos a tu carrito de compras</li>
            <li>En el checkout, pega el código en el campo de cupones</li>
            <li>Haz clic en "Aplicar" para ver tu descuento</li>
            <li>¡Completa tu compra y disfruta del ahorro!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
