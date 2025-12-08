'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  RefreshCw,
  Filter,
  Calendar,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { StatCard, ComparisonCard } from '@/components/cards/StatCards';
import { BarChart, LineChart, chartColors } from '@/components/charts/Charts';
import { reportsService } from '@/services/reportsService';
import { format, subDays, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SalesReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    categoryId: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Cargar reporte
  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await reportsService.getSalesReport(filters);
      
      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Error al cargar reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [filters]);

  // Exportar a PDF
  const handleExportPDF = async () => {
    try {
      const blob = await reportsService.exportSalesPDF(filters);
      reportsService.downloadFile(blob, `sales-report-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
    }
  };

  // Exportar a Excel
  const handleExportExcel = async () => {
    try {
      const blob = await reportsService.exportSalesExcel(filters);
      reportsService.downloadFile(blob, `sales-report-${Date.now()}.xlsx`);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
    }
  };

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Cargando reporte de ventas...</p>
        </div>
      </div>
    );
  }

  const { stats, orders } = reportData;

  // Agrupar órdenes por fecha para gráfico
  const ordersByDate: { [key: string]: { count: number; revenue: number } } = {};
  orders.forEach((order: any) => {
    const date = format(new Date(order.createdAt), 'yyyy-MM-dd');
    if (!ordersByDate[date]) {
      ordersByDate[date] = { count: 0, revenue: 0 };
    }
    ordersByDate[date].count++;
    ordersByDate[date].revenue += parseFloat(order.total);
  });

  const salesChartData = {
    labels: Object.keys(ordersByDate).map(date => 
      format(new Date(date), 'dd MMM', { locale: es })
    ),
    datasets: [
      {
        label: 'Ingresos Diarios',
        data: Object.values(ordersByDate).map(d => d.revenue),
        backgroundColor: chartColors.primaryLight,
        borderColor: chartColors.primary,
        borderWidth: 2
      }
    ]
  };

  const ordersCountChartData = {
    labels: Object.keys(ordersByDate).map(date => 
      format(new Date(date), 'dd MMM', { locale: es })
    ),
    datasets: [
      {
        label: 'Cantidad de Órdenes',
        data: Object.values(ordersByDate).map(d => d.count),
        backgroundColor: chartColors.successLight,
        borderColor: chartColors.success,
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reporte de Ventas</h1>
            <p className="text-gray-600 mt-1">
              Análisis detallado de ventas del período seleccionado
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            
            <button
              onClick={loadReport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
            
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros de Búsqueda</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="preparing">Preparando</option>
                  <option value="shipped">Enviada</option>
                  <option value="delivered">Entregada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({
                    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                    endDate: format(new Date(), 'yyyy-MM-dd'),
                    categoryId: '',
                    status: ''
                  })}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Ingreso Total"
          value={stats.totalRevenue.toFixed(2)}
          icon={DollarSign}
          color="green"
          prefix="$"
        />
        
        <StatCard
          title="Total Órdenes"
          value={stats.totalOrders}
          icon={FileText}
          color="blue"
        />
        
        <StatCard
          title="Valor Promedio"
          value={stats.averageOrderValue.toFixed(2)}
          icon={TrendingUp}
          color="purple"
          prefix="$"
        />
        
        <StatCard
          title="Descuentos"
          value={stats.totalDiscount.toFixed(2)}
          icon={DollarSign}
          color="yellow"
          prefix="$"
        />
      </div>

      {/* Desglose detallado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Subtotal</h3>
          <p className="text-2xl font-bold text-gray-900">${stats.totalSubtotal.toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Envío</h3>
          <p className="text-2xl font-bold text-gray-900">${stats.totalShipping.toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Impuestos</h3>
          <p className="text-2xl font-bold text-gray-900">${stats.totalTax.toFixed(2)}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresos por Día</h3>
          <BarChart data={salesChartData} height={300} />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Órdenes por Día</h3>
          <LineChart data={ordersCountChartData} height={300} />
        </div>
      </div>

      {/* Estado de órdenes */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Estado</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(stats.ordersByStatus).map(([status, count]: [string, any]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1 capitalize">{status}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500">
                {stats.totalOrders > 0 ? ((count / stats.totalOrders) * 100).toFixed(1) : 0}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de órdenes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Detalle de Órdenes ({orders.length})
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Fecha</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Subtotal</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Envío</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Descuento</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Total</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 50).map((order: any) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">#{order.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{order.user.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">
                    ${parseFloat(order.subtotal).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">
                    ${parseFloat(order.shippingCost || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-red-600">
                    -${parseFloat(order.discount || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                    ${parseFloat(order.total).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {orders.length > 50 && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Mostrando primeras 50 órdenes de {orders.length} totales. Exporta para ver todas.
          </p>
        )}
      </div>
    </div>
  );
}
