'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as recommendationService from '../../services/recommendationService';
import RecommendationCarousel from '../../components/recommendations/RecommendationCarousel';
import { useTracking } from '../../hooks/useTracking';

export default function RecommendationsPage() {
  const router = useRouter();
  const { trackProductView } = useTracking();
  
  const [loading, setLoading] = useState(true);
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [abandonedCart, setAbandonedCart] = useState([]);
  const [userSegment, setUserSegment] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchRecommendations();
  }, [router]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      
      const [
        personalizedRes,
        trendingRes,
        recentlyViewedRes,
        newProductsRes,
        abandonedCartRes,
        segmentRes
      ] = await Promise.all([
        recommendationService.getPersonalizedRecommendations({ limit: 12 }),
        recommendationService.getTrendingProducts(12),
        recommendationService.getRecentlyViewedProducts(12),
        recommendationService.getNewProducts(12),
        recommendationService.getAbandonedCartProducts(),
        recommendationService.getUserSegment()
      ]);

      if (personalizedRes.success) {
        setPersonalizedRecs(personalizedRes.recommendations);
      }

      if (trendingRes.success) {
        setTrendingProducts(trendingRes.products);
      }

      if (recentlyViewedRes.success) {
        setRecentlyViewed(recentlyViewedRes.products);
      }

      if (newProductsRes.success) {
        setNewProducts(newProductsRes.products);
      }

      if (abandonedCartRes.success) {
        setAbandonedCart(abandonedCartRes.products);
      }

      if (segmentRes.success) {
        setUserSegment(segmentRes.segment);
      }

    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      setError('Error al cargar recomendaciones');
    } finally {
      setLoading(false);
    }
  };

  const getSegmentBadge = (primarySegment: string) => {
    const badges: any = {
      PREMIUM: { bg: 'bg-purple-100', text: 'text-purple-800', label: '👑 Premium' },
      HIGH_VALUE: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⭐ Alto Valor' },
      FREQUENT_BUYER: { bg: 'bg-blue-100', text: 'text-blue-800', label: '🔥 Comprador Frecuente' },
      AT_RISK: { bg: 'bg-red-100', text: 'text-red-800', label: '⚠️ Te extrañamos' },
      NEW_USER: { bg: 'bg-green-100', text: 'text-green-800', label: '🎉 Nuevo Usuario' },
      LOYAL: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: '💎 Cliente Leal' },
    };

    return badges[primarySegment] || { bg: 'bg-gray-100', text: 'text-gray-800', label: '👤 Usuario' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Recomendaciones Personalizadas
              </h1>
              <p className="text-gray-600">
                Descubre productos seleccionados especialmente para ti
              </p>
            </div>

            {userSegment && (
              <div className="text-right">
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    getSegmentBadge(userSegment.primarySegment).bg
                  } ${getSegmentBadge(userSegment.primarySegment).text}`}
                >
                  {getSegmentBadge(userSegment.primarySegment).label}
                </div>
                <div className="mt-2 flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Engagement:</span>{' '}
                    <span className="font-medium">{userSegment.engagementScore}/100</span>
                  </div>
                  <div>
                    <span className="text-gray-500">LTV:</span>{' '}
                    <span className="font-medium">${userSegment.lifetimeValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Carrito Abandonado */}
        {abandonedCart.length > 0 && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900">
                ¡Dejaste estos productos en tu carrito!
              </h2>
            </div>
            <RecommendationCarousel
              title=""
              products={abandonedCart}
              loading={loading}
            />
          </div>
        )}

        {/* Recomendaciones Personalizadas */}
        {personalizedRecs.length > 0 && (
          <RecommendationCarousel
            title="Recomendado para ti"
            products={personalizedRecs}
            recommendationType="PERSONALIZED"
            showReason={true}
            loading={loading}
          />
        )}

        {/* Recientemente Vistos */}
        {recentlyViewed.length > 0 && (
          <RecommendationCarousel
            title="Vistos recientemente"
            products={recentlyViewed}
            recommendationType="RECENTLY_VIEWED"
            loading={loading}
          />
        )}

        {/* Productos Trending */}
        {trendingProducts.length > 0 && (
          <RecommendationCarousel
            title="Productos populares"
            products={trendingProducts}
            recommendationType="TRENDING"
            loading={loading}
          />
        )}

        {/* Nuevos Productos */}
        {newProducts.length > 0 && (
          <RecommendationCarousel
            title="Recién llegados"
            products={newProducts}
            recommendationType="NEW"
            loading={loading}
          />
        )}

        {/* Sin recomendaciones */}
        {!loading &&
          personalizedRecs.length === 0 &&
          recentlyViewed.length === 0 &&
          trendingProducts.length === 0 &&
          newProducts.length === 0 && (
            <div className="text-center py-12">
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
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Aún no tenemos recomendaciones para ti
              </h3>
              <p className="text-gray-600 mb-6">
                Explora nuestro catálogo para que podamos conocer tus preferencias
              </p>
              <button
                onClick={() => router.push('/products')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Ver Catálogo
              </button>
            </div>
          )}
      </div>

      {/* Insights del Usuario */}
      {userSegment && userSegment.recommendedActions?.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              💡 Ofertas especiales para ti
            </h3>
            <div className="space-y-3">
              {userSegment.recommendedActions.map((action: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-2xl">{action.priority === 'HIGH' ? '🔥' : '✨'}</span>
                  <div>
                    <p className="text-gray-800 font-medium">{action.message}</p>
                    <p className="text-sm text-gray-600">{action.action.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
