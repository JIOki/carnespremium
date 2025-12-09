'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  Download,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { StatCard, MiniStatCard, ComparisonCard } from '@/components/cards/StatCards';
import { LineChart, BarChart, DoughnutChart, generateColorPalette, chartColors } from '@/components/charts/Charts';
import { reportsService } from '@/services/reportsService';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  // Cargar datos del dashboard
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await reportsService.getDashboardMetrics(dateRange);
      
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [dateRange]);

  // Cambiar período
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const today = new Date();
    
    switch (period) {
      case 'today':
        setDateRange({
          startDate: format(today, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        });
        break;
      case '7days':
        setDateRange({
          startDate: format(subDays(today, 7), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        });
        break;
      case '30days':
        setDateRange({
          startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        });
        break;
      case 'thisMonth':
        setDateRange({
          startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(today), 'yyyy-MM-dd')
        });
        break;
    }
  };

  // Exportar dashboard a PDF
  const handleExportPDF = async () => {
    try {
      const blob = await reportsService.exportDashboardPDF(dateRange);
      reportsService.downloadFile(blob, `dashboard-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const { overview, orderStats, topProducts, recentOrders, lowStockProducts, revenueByDay } = dashboardData;

  // Preparar datos para gráfico de ingresos
  const revenueChartData = {
    labels: revenueByDay.map((item: any) => format(new Date(item.date), 'dd MMM', { locale: es })),
    datasets: [
      {
        label: 'Ingresos',
        data: revenueByDay.map((item: any) => item.revenue),
        borderColor: chartColors.primary,
        backgroundColor: chartColors.primaryLight,
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Preparar datos para gráfico de órdenes por estado
  const orderStatusChartData = {
    labels: ['Pendientes', 'Completadas', 'Canceladas'],
    datasets: [
      {
        label: 'Órdenes',
        data: [orderStats.pending, orderStats.completed, orderStats.cancelled],
        backgroundColor: [
          chartColors.warning,
          chartColors.success,
          chartColors.danger
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  // Preparar datos para top productos
  const topProductsChartData = {
    labels: topProducts.slice(0, 5).map((item: any) => item.product.name),
    datasets: [
      {
        label: 'Cantidad Vendida',
        data: topProducts.slice(0, 5).map((item: any) => item.totalQuantitySold),
        backgroundColor: generateColorPalette(5),
        borderWidth: 1,
        borderColor: '#fff'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Analytics</h1>
            <p className="text-gray-600 mt-1">
              Período: {format(new Date(dateRange.startDate), 'dd MMM yyyy', { locale: es })} - {format(new Date(dateRange.endDate), 'dd MMM yyyy', { locale: es })}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboard}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
            
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Filtros de período */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2">
            {[
              { value: 'today', label: 'Hoy' },
              { value: '7days', label: '7 días' },
              { value: '30days', label: '30 días' },
              { value: 'thisMonth', label: 'Este mes' }
            ].map(period => (
              <button
                key={period.value}
                onClick={() => handlePeriodChange(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedPeriod === period.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Ventas Totales"
          value={overview.totalSales.toFixed(2)}
          icon={DollarSign}
          color="green"
          prefix="$"
        />
        
        <StatCard
          title="Total Órdenes"
          value={overview.totalOrders}
          icon={ShoppingCart}
          color="blue"
        />
        
        <StatCard
          title="Total Clientes"
          value={overview.totalCustomers}
          icon={Users}
          color="purple"
        />
        
        <StatCard
          title="Productos Activos"
          value={overview.totalProducts}
          icon={Package}
          color="indigo"
        />
      </div>

      {/* Estadísticas secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MiniStatCard
          label="Valor Promedio del Pedido"
          value={overview.averageOrderValue.toFixed(2)}
          color="green"
          prefix="$"
        />
        
        <MiniStatCard
          label="Órdenes Pendientes"
          value={orderStats.pending}
          color="yellow"
        />
        
        <MiniStatCard
          label="Tasa de Éxito"
          value={orderStats.total > 0 ? ((orderStats.completed / orderStats.total) * 100).toFixed(1) : 0}
          color="green"
          suffix="%"
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de ingresos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresos por Día</h3>
          <LineChart data={revenueChartData} height={300} />
        </div>

        {/* Gráfico de órdenes por estado */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Órdenes</h3>
          <DoughnutChart data={orderStatusChartData} height={300} />
        </div>
      </div>

      {/* Top productos y alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top 5 productos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Productos Más Vendidos</h3>
          <BarChart data={topProductsChartData} height={300} />
          
          <div className="mt-4 space-y-2">
            {topProducts.slice(0, 5).map((item: any, index: number) => (
              <div key={item.productId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{item.product.category.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{item.totalQuantitySold} und.</p>
                  <p className="text-xs text-green-600">${item.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Productos con stock bajo */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Alertas de Inventario
          </h3>
          
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No hay alertas de inventario</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{item.quantity}</p>
                    <p className="text-xs text-gray-500">unidades</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Órdenes recientes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Órdenes Recientes</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Fecha</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Total</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order: any) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">#{order.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{order.user.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {format(new Date(order.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                    ${parseFloat(order.total).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
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
      </div>
    </div>
  );
}
