'use client';

import { useState } from 'react';
import { couponService } from '@/services/couponService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    isActive: true,
    isPublic: false
  });

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
    setLoading(true);

    try {
      // Validaciones
      if (!formData.code.trim()) {
        throw new Error('El código es requerido');
      }

      if (!formData.value || parseFloat(formData.value) <= 0) {
        throw new Error('El valor del descuento debe ser mayor a 0');
      }

      if (formData.type === 'PERCENTAGE' && parseFloat(formData.value) > 100) {
        throw new Error('El porcentaje no puede ser mayor a 100');
      }

      // Preparar datos
      const data = {
        code: formData.code.toUpperCase(),
        description: formData.description || undefined,
        type: formData.type,
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

      await couponService.createCoupon(data);
      alert('Cupón creado exitosamente');
      router.push('/admin/coupons');
    } catch (err: any) {
      setError(err.message || 'Error al crear cupón');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
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
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Crear Nuevo Cupón</h1>
        <p className="mt-2 text-gray-600">Completa los detalles del nuevo cupón de descuento</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          {/* Información Básica */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Código del Cupón *
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  placeholder="DESCUENTO2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent uppercase"
                />
                <p className="mt-1 text-xs text-gray-500">El código será convertido a mayúsculas automáticamente</p>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Descuento *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="PERCENTAGE">Porcentaje (%)</option>
                  <option value="FIXED_AMOUNT">Monto Fijo ($)</option>
                  <option value="FREE_SHIPPING">Envío Gratis</option>
                </select>
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
                  placeholder="Descripción opcional del cupón..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Valor y Condiciones */}
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
                      placeholder={formData.type === 'PERCENTAGE' ? '10' : '50.00'}
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
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Monto mínimo de compra requerido</p>
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
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Límite máximo del descuento en pesos</p>
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
                <p className="mt-1 text-xs text-gray-500">Límite global de usos (vacío = ilimitado)</p>
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
                <p className="mt-1 text-xs text-gray-500">Cuántas veces puede usar cada usuario</p>
              </div>
            </div>
          </div>

          {/* Vigencia */}
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
                <p className="mt-1 text-xs text-gray-500">Vacío = sin fecha de expiración</p>
              </div>
            </div>
          </div>

          {/* Opciones */}
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

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <Link
            href="/admin/coupons"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear Cupón'}
          </button>
        </div>
      </form>
    </div>
  );
}
