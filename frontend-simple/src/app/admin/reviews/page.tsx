'use client';

import React, { useEffect, useState } from 'react';
import {
  Review,
  ReviewStatus,
  reviewService
} from '@/services/reviewService';
import StarRating from '@/components/review/StarRating';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'ALL'>('PENDING');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{
    show: boolean;
    reviewId: string | null;
    reason: string;
  }>({
    show: false,
    reviewId: null,
    reason: ''
  });
  const [respondModal, setRespondModal] = useState<{
    show: boolean;
    reviewId: string | null;
    response: string;
  }>({
    show: false,
    reviewId: null,
    response: ''
  });

  useEffect(() => {
    loadReviews();
  }, [statusFilter, page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      let data;

      if (statusFilter === 'PENDING') {
        data = await reviewService.getPendingReviews({ page, limit: 20 });
      } else {
        data = await reviewService.getAllReviews({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          page,
          limit: 20
        });
      }

      setReviews(data.reviews);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error al cargar reseñas:', error);
      toast.error('Error al cargar reseñas');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    setActioningId(reviewId);
    try {
      await reviewService.approveReview(reviewId);
      toast.success('Reseña aprobada');
      loadReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al aprobar reseña');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reviewId || !rejectModal.reason.trim()) {
      toast.error('Por favor ingresa un motivo de rechazo');
      return;
    }

    setActioningId(rejectModal.reviewId);
    try {
      await reviewService.rejectReview(rejectModal.reviewId, rejectModal.reason);
      toast.success('Reseña rechazada');
      setRejectModal({ show: false, reviewId: null, reason: '' });
      loadReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al rechazar reseña');
    } finally {
      setActioningId(null);
    }
  };

  const handleRespond = async () => {
    if (!respondModal.reviewId || !respondModal.response.trim()) {
      toast.error('Por favor ingresa una respuesta');
      return;
    }

    setActioningId(respondModal.reviewId);
    try {
      await reviewService.respondToReview(respondModal.reviewId, respondModal.response);
      toast.success('Respuesta publicada');
      setRespondModal({ show: false, reviewId: null, response: '' });
      loadReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al responder');
    } finally {
      setActioningId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: ReviewStatus) => {
    const badges = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobada' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazada' }
    };

    const badge = badges[status];
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Moderación de Reseñas
            </h1>
            <p className="text-gray-600">
              Revisa y modera las reseñas de los clientes
            </p>
          </div>
          <Link
            href="/admin/reviews/stats"
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Ver Estadísticas
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status as ReviewStatus | 'ALL');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'ALL' && 'Todas'}
                {status === 'PENDING' && 'Pendientes'}
                {status === 'APPROVED' && 'Aprobadas'}
                {status === 'REJECTED' && 'Rechazadas'}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
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
            <p className="text-gray-600">Cargando reseñas...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <svg
              className="w-20 h-20 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No hay reseñas
            </h3>
            <p className="text-gray-600">
              No se encontraron reseñas con el filtro seleccionado
            </p>
          </div>
        ) : (
          <>
            {/* Lista de reseñas */}
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex-1">
                      {/* Producto */}
                      <div className="flex items-start gap-4 mb-3">
                        {review.product?.imageUrl && (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={review.product.imageUrl}
                              alt={review.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/products/${review.product?.slug}`}
                            className="font-semibold text-gray-900 hover:text-red-600 transition-colors block mb-1"
                          >
                            {review.product?.name || 'Producto'}
                          </Link>
                          <div className="text-sm text-gray-600">
                            Por: <span className="font-medium">{review.user?.name}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Rating y badges */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <StarRating rating={review.rating} size="md" showNumber />
                        {getStatusBadge(review.status)}
                        {review.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
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
                    </div>
                  </div>

                  {/* Contenido */}
                  {review.title && (
                    <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                  )}
                  {review.comment && (
                    <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
                  )}

                  {/* Imágenes */}
                  {review.images && review.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {review.images.map((image) => (
                        <div
                          key={image.id}
                          className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
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
                      </div>
                      <p className="text-gray-700">{review.sellerResponse}</p>
                    </div>
                  )}

                  {/* Motivo de rechazo */}
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

                  {/* Estadísticas */}
                  {review.status === 'APPROVED' && (
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-green-600"
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
                        {review.helpfulCount} útil
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-gray-400 transform rotate-180"
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
                        {review.notHelpfulCount} no útil
                      </span>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    {review.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(review.id)}
                          disabled={actioningId === review.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Aprobar
                        </button>
                        <button
                          onClick={() =>
                            setRejectModal({ show: true, reviewId: review.id, reason: '' })
                          }
                          disabled={actioningId === review.id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Rechazar
                        </button>
                      </>
                    )}
                    {review.status === 'APPROVED' && !review.sellerResponse && (
                      <button
                        onClick={() =>
                          setRespondModal({ show: true, reviewId: review.id, response: '' })
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                          />
                        </svg>
                        Responder
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Rechazo */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Rechazar Reseña
            </h3>
            <p className="text-gray-600 mb-4">
              Por favor ingresa el motivo del rechazo:
            </p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal((prev) => ({ ...prev, reason: e.target.value }))
              }
              rows={4}
              placeholder="Ej: Contenido inapropiado, spam, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setRejectModal({ show: false, reviewId: null, reason: '' })
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectModal.reason.trim() || !!actioningId}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Respuesta */}
      {respondModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Responder a la Reseña
            </h3>
            <p className="text-gray-600 mb-4">
              Tu respuesta será visible para todos los clientes:
            </p>
            <textarea
              value={respondModal.response}
              onChange={(e) =>
                setRespondModal((prev) => ({ ...prev, response: e.target.value }))
              }
              rows={4}
              placeholder="Escribe tu respuesta..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setRespondModal({ show: false, reviewId: null, response: '' })
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRespond}
                disabled={!respondModal.response.trim() || !!actioningId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
