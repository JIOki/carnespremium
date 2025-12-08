'use client';

import React, { useState } from 'react';
import StarRating from './StarRating';
import { reviewService, CreateReviewRequest, UpdateReviewRequest } from '@/services/reviewService';
import { toast } from 'react-hot-toast';

interface ReviewFormProps {
  productId: string;
  productName: string;
  orderId?: string;
  existingReview?: {
    id: string;
    rating: number;
    title?: string;
    comment?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  productId,
  productName,
  orderId,
  existingReview,
  onSuccess,
  onCancel
}: ReviewFormProps) {
  const isEditing = !!existingReview;

  const [formData, setFormData] = useState({
    rating: existingReview?.rating || 0,
    title: existingReview?.title || '',
    comment: existingReview?.comment || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors((prev) => ({ ...prev, rating: '' }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (formData.rating === 0) {
      newErrors.rating = 'Por favor selecciona una calificación';
    }

    if (formData.comment.trim().length < 10) {
      newErrors.comment = 'El comentario debe tener al menos 10 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        const updateData: UpdateReviewRequest = {
          rating: formData.rating,
          title: formData.title || undefined,
          comment: formData.comment || undefined
        };
        await reviewService.updateReview(existingReview.id, updateData);
        toast.success('Reseña actualizada exitosamente');
      } else {
        const createData: CreateReviewRequest = {
          productId,
          rating: formData.rating,
          title: formData.title || undefined,
          comment: formData.comment || undefined,
          orderId
        };
        await reviewService.createReview(createData);
        toast.success('Reseña enviada exitosamente. Será visible una vez aprobada.');
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Error al enviar reseña:', error);
      toast.error(
        error.response?.data?.error || 'Error al enviar la reseña'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        {isEditing ? 'Editar Reseña' : 'Escribir una Reseña'}
      </h3>

      <div className="mb-4 pb-4 border-b border-gray-200">
        <p className="text-sm text-gray-600 mb-1">Producto:</p>
        <p className="font-medium text-gray-900">{productName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Calificación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calificación <span className="text-red-600">*</span>
          </label>
          <div className="flex items-center gap-4">
            <StarRating
              rating={formData.rating}
              size="xl"
              interactive
              onChange={handleRatingChange}
            />
            {formData.rating > 0 && (
              <span className="text-lg font-medium text-gray-900">
                {formData.rating} de 5 estrellas
              </span>
            )}
          </div>
          {errors.rating && (
            <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
          )}
        </div>

        {/* Título */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Título de la reseña (opcional)
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Resumen de tu experiencia"
            maxLength={100}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.title.length}/100 caracteres
          </p>
        </div>

        {/* Comentario */}
        <div>
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Tu opinión <span className="text-red-600">*</span>
          </label>
          <textarea
            id="comment"
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            rows={6}
            placeholder="¿Qué te pareció el producto? Comparte tu experiencia..."
            maxLength={1000}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${
              errors.comment ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              {formData.comment.length}/1000 caracteres
            </p>
            {errors.comment && (
              <p className="text-sm text-red-600">{errors.comment}</p>
            )}
          </div>
        </div>

        {/* Nota sobre moderación */}
        {!isEditing && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Tu reseña será revisada</p>
                <p>
                  Todas las reseñas pasan por un proceso de moderación antes de
                  ser publicadas. Esto ayuda a mantener la calidad y
                  autenticidad de las opiniones.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || formData.rating === 0}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
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
                Enviando...
              </>
            ) : (
              <>{isEditing ? 'Actualizar Reseña' : 'Enviar Reseña'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
