'use client';

import { useState, useEffect } from 'react';
import paymentService, { Payment, Refund, PaymentStats } from '@/services/paymentService';

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<'payments' | 'refunds' | 'stats'>('stats');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    provider: '',
    search: ''
  });
  const [refundFilters, setRefundFilters] = useState({
    status: ''
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    } else if (activeTab === 'refunds') {
      fetchRefunds();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab, page, filters, refundFilters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getAllPayments(page, 50, filters);
      setPayments(response.payments);
      setPagination(response.pagination);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getAllRefunds(page, 50, refundFilters.status);
      setRefunds(response.refunds);
      setPagination(response.pagination);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar reembolsos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentStats();
      setStats(response.stats);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRefund = async (refundId: string) => {
    if (!confirm('¿Estás seguro de aprobar este reembolso? Esta acción procesará el reembolso inmediatamente.')) {
      return;
    }

    try {
      await paymentService.approveRefund(refundId);
      alert('Reembolso aprobado y procesado exitosamente');
      fetchRefunds();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al aprobar reembolso');
    }
  };

  const handleRejectRefund = async (refundId: string) => {
    const reason = prompt('Ingresa el motivo del rechazo:');
    if (!reason) return;

    try {
      await paymentService.rejectRefund(refundId, reason);
      alert('Reembolso rechazado');
      fetchRefunds();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al rechazar reembolso');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Pagos
          </h1>
          <p className="text-gray-600">
            Administra pagos, reembolsos y visualiza estadísticas
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => {
                  setActiveTab('stats');
                  setPage(1);
                }}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'stats'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Estadísticas
              </button>
              <button
                onClick={() => {
                  setActiveTab('payments');
                  setPage(1);
                }}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'payments'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pagos
              </button>
              <button
                onClick={() => {
                  setActiveTab('refunds');
                  setPage(1);
                }}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'refunds'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reembolsos
              </button>
            </nav>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {/* Stats Tab */}
            {activeTab === 'stats' && stats && (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Total Pagos</h3>
                      <span className="text-2xl">💳</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalPayments}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Ingresos Totales</h3>
                      <span className="text-2xl">💰</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      {paymentService.formatCurrency(stats.totalRevenue, 'USD')}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Reembolsos</h3>
                      <span className="text-2xl">↩️</span>
                    </div>
                    <p className="text-3xl font-bold text-red-600">
                      {stats.totalRefunds.count}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {paymentService.formatCurrency(stats.totalRefunds.amount, 'USD')}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Tasa de Éxito</h3>
                      <span className="text-2xl">✅</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">
                      {stats.totalPayments > 0
                        ? Math.round(
                            ((stats.byStatus.find((s) => s.status === 'CAPTURED' || s.status === 'COMPLETED')?._count || 0) /
                              stats.totalPayments) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>

                {/* By Provider */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Pagos por Proveedor
                  </h3>
                  <div className="space-y-4">
                    {stats.byProvider.map((provider) => (
                      <div key={provider.provider} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {provider.provider === 'STRIPE' ? '💳' : '🔵'}
                          </span>
                          <span className="font-medium text-gray-900">{provider.provider}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {paymentService.formatCurrency(provider._sum.amount, 'USD')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {provider._count} pagos
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Status */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Distribución por Estado
                  </h3>
                  <div className="space-y-4">
                    {stats.byStatus.map((status) => (
                      <div key={status.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-3 py-1 text-sm font-semibold rounded-full ${paymentService.getStatusBadgeColor(
                              status.status
                            )}`}
                          >
                            {paymentService.getStatusText(status.status)}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {paymentService.formatCurrency(status._sum.amount, 'USD')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {status._count} pagos
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Payment Methods */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Métodos de Pago Más Usados
                  </h3>
                  <div className="space-y-3">
                    {stats.topPaymentMethods.map((method, index) => (
                      <div key={method.paymentMethod} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-500 font-medium">#{index + 1}</span>
                          <span className="font-medium text-gray-900">{method.paymentMethod}</span>
                        </div>
                        <span className="text-gray-600">{method._count} usos</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div>
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Buscar por orden o ID..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Todos los estados</option>
                      <option value="PENDING">Pendiente</option>
                      <option value="CAPTURED">Capturado</option>
                      <option value="COMPLETED">Completado</option>
                      <option value="FAILED">Fallido</option>
                      <option value="REFUNDED">Reembolsado</option>
                    </select>
                    <select
                      value={filters.provider}
                      onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Todos los proveedores</option>
                      <option value="STRIPE">Stripe</option>
                      <option value="MERCADOPAGO">MercadoPago</option>
                    </select>
                    <button
                      onClick={() => setFilters({ status: '', provider: '', search: '' })}
                      className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Orden
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Monto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Proveedor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment: any) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.order?.orderNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.user?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {paymentService.formatCurrency(payment.amount, payment.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.provider}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${paymentService.getStatusBadgeColor(
                                payment.status
                              )}`}
                            >
                              {paymentService.getStatusText(payment.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Refunds Tab */}
            {activeTab === 'refunds' && (
              <div>
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      value={refundFilters.status}
                      onChange={(e) => setRefundFilters({ status: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Todos los estados</option>
                      <option value="PENDING">Pendiente</option>
                      <option value="PROCESSING">Procesando</option>
                      <option value="COMPLETED">Completado</option>
                      <option value="FAILED">Fallido</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                    <button
                      onClick={() => setRefundFilters({ status: '' })}
                      className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* Refunds List */}
                <div className="space-y-4">
                  {refunds.map((refund: any) => (
                    <div key={refund.id} className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Orden: {refund.payment?.order?.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Solicitado por: {refund.user?.name} ({refund.user?.email})
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded-full ${paymentService.getStatusBadgeColor(
                            refund.status
                          )}`}
                        >
                          {paymentService.getStatusText(refund.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Monto</p>
                          <p className="font-semibold text-gray-900">
                            {paymentService.formatCurrency(refund.amount, refund.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Tipo</p>
                          <p className="font-medium text-gray-900">{refund.type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Motivo</p>
                          <p className="font-medium text-gray-900">{refund.reason}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Fecha</p>
                          <p className="font-medium text-gray-900">
                            {new Date(refund.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {refund.reasonDetails && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-700">
                            <strong>Detalles:</strong> {refund.reasonDetails}
                          </p>
                        </div>
                      )}

                      {refund.rejectionReason && (
                        <div className="bg-red-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-red-700">
                            <strong>Motivo de rechazo:</strong> {refund.rejectionReason}
                          </p>
                        </div>
                      )}

                      {refund.status === 'PENDING' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleApproveRefund(refund.id)}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                          >
                            Aprobar Reembolso
                          </button>
                          <button
                            onClick={() => handleRejectRefund(refund.id)}
                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {refunds.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                      <div className="text-gray-400 text-5xl mb-4">↩️</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No hay reembolsos
                      </h3>
                      <p className="text-gray-600">
                        Las solicitudes de reembolso aparecerán aquí
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && activeTab !== 'stats' && (
              <div className="mt-8 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Página {page} de {pagination.pages}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
