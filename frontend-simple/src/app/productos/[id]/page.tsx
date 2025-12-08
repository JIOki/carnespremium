'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product } from '@/types';
import ImageGallery from '@/components/product/ImageGallery';
import ProductInfo from '@/components/product/ProductInfo';
import ProductSpecs from '@/components/product/ProductSpecs';
import NutritionalInfo from '@/components/product/NutritionalInfo';
import PreparationTips from '@/components/product/PreparationTips';
import ReviewsSection from '@/components/product/ReviewsSection';
import RelatedProducts from '@/components/product/RelatedProducts';
import { ChevronLeft, Package } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${API_URL}/products/${productId}`);

      if (!response.ok) {
        throw new Error('Producto no encontrado');
      }

      const data = await response.json();
      setProduct(data.data);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('No se pudo cargar el producto. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Breadcrumb Skeleton */}
          <div className="h-6 bg-gray-200 rounded w-64 mb-8 animate-pulse" />

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Image Skeleton */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>

            {/* Info Skeleton */}
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-12 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="h-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Producto no encontrado
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#8B1E3F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#6D1830] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 max-w-7xl py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-[#8B1E3F] transition-colors">
              Inicio
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/" className="text-gray-600 hover:text-[#8B1E3F] transition-colors">
              Productos
            </Link>
            {product.category && (
              <>
                <span className="text-gray-400">/</span>
                <Link
                  href={`/?category=${product.categoryId}`}
                  className="text-gray-600 hover:text-[#8B1E3F] transition-colors"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-8">
        {/* Sección Principal: Imagen e Información */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Galería de Imágenes */}
          <div>
            <ImageGallery
              images={product.images || []}
              productName={product.name}
            />
          </div>

          {/* Información del Producto */}
          <div>
            <ProductInfo product={product} />
          </div>
        </div>

        {/* Tabs de Información Detallada */}
        <div className="space-y-6">
          {/* Descripción Completa */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Descripción
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="whitespace-pre-line leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>

          {/* Grid de 2 Columnas */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Especificaciones Técnicas */}
            <ProductSpecs product={product} />

            {/* Información Nutricional */}
            <NutritionalInfo nutritionalInfo={product.nutritionalInfo} />
          </div>

          {/* Tips de Preparación */}
          <PreparationTips
            preparationTips={product.preparationTips}
            storageInfo={product.storageInfo}
          />

          {/* Reseñas */}
          <ReviewsSection
            reviews={product.reviews}
            averageRating={product.averageRating}
            reviewCount={product.reviewCount}
          />

          {/* Productos Relacionados */}
          <RelatedProducts
            currentProductId={product.id}
            categoryId={product.categoryId}
          />
        </div>
      </div>
    </div>
  );
}
