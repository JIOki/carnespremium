'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import paymentService, { Payment } from '@/services/paymentService';

export default function PaymentsHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    provider: ''
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    fetchPayments();
  }, [page, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentHistory(page, 20, filters);
      setPayments(response.payments);
      setPagination(response.pagination);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const getProviderIcon = (provider: string) => {
    if (provider === 'STRIPE') return '💳';
    if (provider === 'MERCADOPAGO') return '🔵';
    return '💰';
  };

  if (loading && payments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando pagos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Historial de Pagos</h1>
          <p className="text-gray-600">
            Consulta todos tus pagos y transacciones
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Todos</option>
                <option value="PENDING">Pendiente</option>
                <option value="CAPTURED">Capturado</option>
                <option value="COMPLETED">Completado</option>
                <option value="FAILED">Fallido</option>
                <option value="REFUNDED">Reembolsado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor
              </label>
              <select
                value={filters.provider}
                onChange={(e) => handleFilterChange('provider', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Todos</option>
                <option value="STRIPE">Stripe</option>
                <option value="MERCADOPAGO">MercadoPago</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ status: '', provider: '' });
                  setPage(1);
                }}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Payments List */}
        {payments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay pagos registrados
            </h3>
            <p className="text-gray-600 mb-6">
              Tus pagos aparecerán aquí una vez que realices compras
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir a Comprar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getProviderIcon(payment.provider)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {payment.order?.orderNumber || 'N/A'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Monto</p>
                        <p className="font-semibold text-gray-900">
                          {paymentService.formatCurrency(payment.amount, payment.currency)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Método</p>
                        <p className="font-medium text-gray-900">
                          {payment.paymentMethod}
                          {payment.cardLast4 && ` •••• ${payment.cardLast4}`}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Proveedor</p>
                        <p className="font-medium text-gray-900">{payment.provider}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Estado</p>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${paymentService.getStatusBadgeColor(
                            payment.status
                          )}`}
                        >
                          {paymentService.getStatusText(payment.status)}
                        </span>
                      </div>
                    </div>

                    {payment.errorMessage && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">
                          <strong>Error:</strong> {payment.errorMessage}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() => router.push(`/payments/${payment.id}`)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Ver Detalles →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {(page - 1) * pagination.limit + 1} -{' '}
              {Math.min(page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} pagos
            </p>

            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              
              <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                {page} de {pagination.pages}
              </span>
              
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
