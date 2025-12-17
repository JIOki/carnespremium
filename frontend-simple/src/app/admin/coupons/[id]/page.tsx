'use client';

import { useState, useEffect } from 'react';
import { couponService } from '@/services/couponService';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING',
    value: '',
    minPurchase: '',
    maxDiscount: '',
    maxUsage: '',
    maxUsagePerUser: '1',
    validFrom: '',
    validUntil: '',
    isActive: true,
    isPublic: false
  });

  useEffect(() => {
    loadCoupon();
  }, [couponId]);

  const loadCoupon = async () => {
    try {
      const res = await couponService.getCouponById(couponId);
      const coupon = res.data;
      
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        type: coupon.type,
        value: coupon.value.toString(),
        minPurchase: coupon.minPurchase?.toString() || '',
        maxDiscount: coupon.maxDiscount?.toString() || '',
        maxUsage: coupon.maxUsage?.toString() || '',
        maxUsagePerUser: coupon.maxUsagePerUser.toString(),
        validFrom: coupon.validFrom.split('T')[0],
        validUntil: coupon.validUntil ? coupon.validUntil.split('T')[0] : '',
        isActive: coupon.isActive,
        isPublic: coupon.isPublic
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar cupón');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!formData.value || parseFloat(formData.value) <= 0) {
        throw new Error('El valor del descuento debe ser mayor a 0');
      }

      if (formData.type === 'PERCENTAGE' && parseFloat(formData.value) > 100) {
        throw new Error('El porcentaje no puede ser mayor a 100');
      }

      const data = {
        description: formData.description || undefined,
        value: parseFloat(formData.value),
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : undefined,
        maxUsagePerUser: parseInt(formData.maxUsagePerUser),
        validFrom: formData.validFrom,
        validUntil: formData.validUntil || undefined,
        isActive: formData.isActive,
        isPublic: formData.isPublic
      };

      await couponService.updateCoupon(couponId, data);
      alert('Cupón actualizado exitosamente');
      router.push('/admin/coupons');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar cupón');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/admin/coupons"
          className="text-red-600 hover:text-red-700 mb-4 inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Cupones
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Editar Cupón</h1>
        <p className="mt-2 text-gray-600">Código: <span className="font-mono font-bold">{formData.code}</span></p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código del Cupón
                </label>
                <input
                  type="text"
                  value={formData.code}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">El código no puede modificarse</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Descuento
                </label>
                <input
                  type="text"
                  value={formData.type === 'PERCENTAGE' ? 'Porcentaje' : formData.type === 'FIXED_AMOUNT' ? 'Monto Fijo' : 'Envío Gratis'}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Valor y Condiciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.type !== 'FREE_SHIPPING' && (
                <div>
                  <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                    Valor del Descuento *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="value"
                      name="value"
                      value={formData.value}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">
                      {formData.type === 'PERCENTAGE' ? '%' : '$'}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="minPurchase" className="block text-sm font-medium text-gray-700 mb-2">
                  Compra Mínima
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="minPurchase"
                    name="minPurchase"
                    value={formData.minPurchase}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {formData.type === 'PERCENTAGE' && (
                <div>
                  <label htmlFor="maxDiscount" className="block text-sm font-medium text-gray-700 mb-2">
                    Descuento Máximo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="maxDiscount"
                      name="maxDiscount"
                      value={formData.maxDiscount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="maxUsage" className="block text-sm font-medium text-gray-700 mb-2">
                  Usos Totales Máximos
                </label>
                <input
                  type="number"
                  id="maxUsage"
                  name="maxUsage"
                  value={formData.maxUsage}
                  onChange={handleChange}
                  min="0"
                  placeholder="Ilimitado"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="maxUsagePerUser" className="block text-sm font-medium text-gray-700 mb-2">
                  Usos por Usuario *
                </label>
                <input
                  type="number"
                  id="maxUsagePerUser"
                  name="maxUsagePerUser"
                  value={formData.maxUsagePerUser}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vigencia</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700 mb-2">
                  Válido Desde *
                </label>
                <input
                  type="date"
                  id="validFrom"
                  name="validFrom"
                  value={formData.validFrom}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 mb-2">
                  Válido Hasta
                </label>
                <input
                  type="date"
                  id="validUntil"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleChange}
                  min={formData.validFrom}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Opciones</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="isActive" className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">Cupón Activo</span>
                  <span className="block text-xs text-gray-500">El cupón está disponible para uso</span>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="isPublic" className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">Cupón Público</span>
                  <span className="block text-xs text-gray-500">Visible en la lista de cupones disponibles</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <Link
            href="/admin/coupons"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
