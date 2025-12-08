'use client';

import { useState } from 'react';
import { couponService, CouponValidationResult, CartItem } from '@/services/couponService';

interface CouponInputProps {
  subtotal: number;
  items: CartItem[];
  onCouponApplied: (couponData: CouponValidationResult) => void;
  onCouponRemoved: () => void;
}

export default function CouponInput({ subtotal, items, onCouponApplied, onCouponRemoved }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Ingresa un código de cupón');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await couponService.validateCoupon(
        couponCode.trim(),
        subtotal,
        items
      );

      if (result.success && result.valid && result.data) {
        setAppliedCoupon(result.data);
        onCouponApplied(result.data);
        setError('');
      } else {
        setError(result.error || 'Cupón no válido');
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      setError(err.message || 'Error al validar cupón');
      setAppliedCoupon(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setError('');
    onCouponRemoved();
  };

  const getDiscountText = () => {
    if (!appliedCoupon) return '';

    if (appliedCoupon.type === 'FREE_SHIPPING') {
      return 'Envío Gratis';
    } else {
      return `-$${appliedCoupon.discountAmount.toFixed(2)}`;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">¿Tienes un cupón de descuento?</h3>
      
      {!appliedCoupon ? (
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Ingresa el código"
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent uppercase text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApplyCoupon();
                }
              }}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={loading || !couponCode.trim()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
            >
              {loading ? 'Validando...' : 'Aplicar'}
            </button>
          </div>

          {error && (
            <div className="mt-2 text-sm text-red-600 flex items-start">
              <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-green-900">
                  Cupón "{appliedCoupon.code}" aplicado
                </p>
                {appliedCoupon.description && (
                  <p className="text-xs text-green-700 mt-0.5">{appliedCoupon.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-green-600 hover:text-green-800 ml-4"
              title="Quitar cupón"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="mt-3 pt-3 border-t border-green-200 flex justify-between items-center">
            <span className="text-sm text-green-700">Descuento aplicado:</span>
            <span className="text-lg font-bold text-green-900">{getDiscountText()}</span>
          </div>
        </div>
      )}

      {/* Nota informativa */}
      {!appliedCoupon && !error && (
        <p className="mt-2 text-xs text-gray-500">
          Los cupones se validan al momento de aplicarlos
        </p>
      )}
    </div>
  );
}
