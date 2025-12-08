'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTracking } from '../../hooks/useTracking';

interface Product {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  averageRating: number;
  totalReviews: number;
  reason?: string;
  type?: string;
  variants?: Array<{
    id: string;
    price: number;
    comparePrice?: number;
  }>;
}

interface RecommendationCarouselProps {
  title: string;
  products: Product[];
  sourceProductId?: string;
  recommendationType?: string;
  showReason?: boolean;
  loading?: boolean;
}

export default function RecommendationCarousel({
  title,
  products,
  sourceProductId,
  recommendationType,
  showReason = false,
  loading = false,
}: RecommendationCarouselProps) {
  const { trackRecommendationClick, trackProductView } = useTracking();
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 4;

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex + itemsPerView < products.length;

  const scrollLeft = () => {
    if (canScrollLeft) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleProductClick = (product: Product, position: number) => {
    if (sourceProductId && recommendationType) {
      trackRecommendationClick(
        sourceProductId,
        product.id,
        recommendationType,
        position
      );
    }
    trackProductView(product.id, {
      fromRecommendation: !!sourceProductId,
      recommendationType,
      position,
    });
  };

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        
        {products.length > itemsPerView && (
          <div className="flex gap-2">
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full border-2 transition-colors ${
                canScrollLeft
                  ? 'border-red-600 text-red-600 hover:bg-red-50'
                  : 'border-gray-300 text-gray-300 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`p-2 rounded-full border-2 transition-colors ${
                canScrollRight
                  ? 'border-red-600 text-red-600 hover:bg-red-50'
                  : 'border-gray-300 text-gray-300 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleProducts.map((product, index) => {
          const defaultVariant = product.variants?.[0];
          const price = defaultVariant?.price || 0;
          const comparePrice = defaultVariant?.comparePrice;
          const discount = comparePrice
            ? Math.round(((comparePrice - price) / comparePrice) * 100)
            : 0;

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
              onClick={() => handleProductClick(product, currentIndex + index)}
            >
              <div className="relative aspect-square bg-gray-100">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                
                {discount > 0 && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                    -{discount}%
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                  {product.name}
                </h3>

                {showReason && product.reason && (
                  <p className="text-xs text-gray-500 mb-2 italic">
                    {product.reason}
                  </p>
                )}

                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.averageRating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs text-gray-600 ml-1">
                    ({product.totalReviews})
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    ${price.toFixed(2)}
                  </span>
                  {comparePrice && (
                    <span className="text-sm text-gray-500 line-through">
                      ${comparePrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {products.length > itemsPerView && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: Math.ceil(products.length / itemsPerView) }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i * itemsPerView)}
              className={`w-2 h-2 rounded-full transition-colors ${
                Math.floor(currentIndex / itemsPerView) === i
                  ? 'bg-red-600'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
