'use client';

import React, { useState } from 'react';
import StarRating from './StarRating';
import { Review, VoteType, reviewService } from '@/services/reviewService';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface ReviewListProps {
  reviews: Review[];
  onVoteUpdate?: () => void;
  showProduct?: boolean;
  className?: string;
}

export default function ReviewList({
  reviews,
  onVoteUpdate,
  showProduct = false,
  className = ''
}: ReviewListProps) {
  const [votingReviewId, setVotingReviewId] = useState<string | null>(null);
  const [expandedImages, setExpandedImages] = useState<{ [key: string]: boolean }>({});

  const handleVote = async (reviewId: string, voteType: VoteType) => {
    setVotingReviewId(reviewId);
    try {
      await reviewService.voteReview(reviewId, voteType);
      toast.success('Voto registrado');
      onVoteUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al votar');
    } finally {
      setVotingReviewId(null);
    }
  };

  const toggleImageExpand = (reviewId: string) => {
    setExpandedImages((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (reviews.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-8 text-center ${className}`}>
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sin reseñas aún
        </h3>
        <p className="text-gray-600">
          Sé el primero en compartir tu opinión sobre este producto
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold">
                  {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {review.user?.name || 'Usuario'}
                    </span>
                    {review.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Compra verificada
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </div>
                </div>
              </div>

              {/* Producto (si se muestra) */}
              {showProduct && review.product && (
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <span>Producto:</span>
                  <span className="font-medium">{review.product.name}</span>
                </div>
              )}

              <StarRating rating={review.rating} size="md" />
            </div>

            {/* Estado (para admin) */}
            {review.status !== 'APPROVED' && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  review.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {review.status === 'PENDING' ? 'Pendiente' : 'Rechazada'}
              </span>
            )}
          </div>

          {/* Título */}
          {review.title && (
            <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
          )}

          {/* Comentario */}
          {review.comment && (
            <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
          )}

          {/* Imágenes */}
          {review.images && review.images.length > 0 && (
            <div className="mb-4">
              <div
                className={`grid gap-2 ${
                  expandedImages[review.id]
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                    : 'grid-cols-4'
                }`}
              >
                {(expandedImages[review.id]
                  ? review.images
                  : review.images.slice(0, 4)
                ).map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <Image
                      src={image.imageUrl}
                      alt={image.caption || 'Imagen de reseña'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              {review.images.length > 4 && (
                <button
                  onClick={() => toggleImageExpand(review.id)}
                  className="text-sm text-red-600 hover:text-red-700 mt-2 font-medium"
                >
                  {expandedImages[review.id]
                    ? 'Ver menos'
                    : `Ver todas (${review.images.length})`}
                </button>
              )}
            </div>
          )}

          {/* Respuesta del vendedor */}
          {review.sellerResponse && (
            <div className="bg-gray-50 border-l-4 border-red-600 p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="font-medium text-gray-900">
                  Respuesta del vendedor
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(review.sellerRespondedAt!)}
                </span>
              </div>
              <p className="text-gray-700">{review.sellerResponse}</p>
            </div>
          )}

          {/* Motivo de rechazo (solo para usuario si está rechazada) */}
          {review.status === 'REJECTED' && review.rejectionReason && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="font-medium text-red-900">Motivo de rechazo:</span>
              </div>
              <p className="text-red-700">{review.rejectionReason}</p>
            </div>
          )}

          {/* Botones de útil/no útil */}
          {review.status === 'APPROVED' && (
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">¿Te resultó útil?</span>
              <button
                onClick={() => handleVote(review.id, 'HELPFUL')}
                disabled={votingReviewId === review.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  Sí ({review.helpfulCount})
                </span>
              </button>
              <button
                onClick={() => handleVote(review.id, 'NOT_HELPFUL')}
                disabled={votingReviewId === review.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 text-gray-600 transform rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  No ({review.notHelpfulCount})
                </span>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
