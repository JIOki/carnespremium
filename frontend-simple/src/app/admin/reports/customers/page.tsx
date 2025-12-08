'use client';

import React, { useState, useEffect } from 'react';
import { Users, Download, RefreshCw, TrendingUp, TrendingDown, UserCheck, UserX } from 'lucide-react';
import { StatCard } from '@/components/cards/StatCards';
import { DoughnutChart, BarChart, chartColors, generateColorPalette } from '@/components/charts/Charts';
import { reportsService } from '@/services/reportsService';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CustomerAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await reportsService.getCustomerAnalytics(dateRange);
      
      if (response.success) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      console.error('Error al cargar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const handleExportExcel = async () => {
    try {
      const blob = await reportsService.exportCustomerAnalyticsExcel(dateRange);
      reportsService.downloadFile(blob, `customer-analytics-${Date.now()}.xlsx`);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
    }
  };

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  const { overview, topCustomers, segmentation, retention } = analyticsData;

  const segmentationChartData = {
    labels: ['Nuevos', 'Ocasionales', 'Regulares', 'Leales', 'Inactivos'],
    datasets: [{
      data: [
        segmentation.new,
        segmentation.occasional,
        segmentation.regular,
        segmentation.loyal,
        segmentation.inactive
      ],
      backgroundColor: generateColorPalette(5),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const topCustomersChartData = {
    labels: topCustomers.slice(0, 10).map((c: any) => c.name),
    datasets: [{
      label: 'Gasto Total',
      data: topCustomers.slice(0, 10).map((c: any) => c.totalSpent),
      backgroundColor: chartColors.success,
      borderColor: chartColors.success,
      borderWidth: 1
    }]
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics de Clientes</h1>
            <p className="text-gray-600 mt-1">Análisis de comportamiento y segmentación de clientes</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={loadAnalytics} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
            
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Clientes"
          value={overview.totalCustomers}
          icon={Users}
          color="blue"
        />
        
        <StatCard
          title="Clientes Nuevos"
          value={overview.newCustomers}
          icon={UserCheck}
          color="green"
          change={parseFloat(overview.growthRate)}
          trend="up"
        />
        
        <StatCard
          title="Tasa de Retención"
          value={retention.retentionRate.toFixed(1)}
          icon={TrendingUp}
          color="purple"
          suffix="%"
        />
        
        <StatCard
          title="Tasa de Abandono"
          value={retention.churnRate.toFixed(1)}
          icon={TrendingDown}
          color="red"
          suffix="%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Segmentación de Clientes</h3>
          <DoughnutChart data={segmentationChartData} height={300} />
          
          <div className="mt-4 space-y-2">
            {[
              { label: 'Nuevos (0-1 orden)', value: segmentation.new, color: 'blue' },
              { label: 'Ocasionales (2-4)', value: segmentation.occasional, color: 'yellow' },
              { label: 'Regulares (5-9)', value: segmentation.regular, color: 'green' },
              { label: 'Leales (10+)', value: segmentation.loyal, color: 'purple' },
              { label: 'Inactivos', value: segmentation.inactive, color: 'red' }
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Clientes por Gasto</h3>
          <BarChart data={topCustomersChartData} height={300} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Retención</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1">Clientes Este Período</p>
            <p className="text-2xl font-bold text-blue-600">{retention.customersThisPeriod}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1">Período Anterior</p>
            <p className="text-2xl font-bold text-gray-600">{retention.customersPreviousPeriod}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1">Clientes Retenidos</p>
            <p className="text-2xl font-bold text-green-600">{retention.retainedCustomers}</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1">Clientes Nuevos</p>
            <p className="text-2xl font-bold text-purple-600">{retention.newCustomers}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clientes</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">#</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Órdenes</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Gasto Total</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Promedio</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Miembro Desde</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((customer: any, index: number) => (
                <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{index + 1}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{customer.email}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">{customer.totalOrders}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                    ${customer.totalSpent.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">
                    ${customer.averageOrderValue.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {format(new Date(customer.memberSince), 'dd MMM yyyy', { locale: es })}
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
