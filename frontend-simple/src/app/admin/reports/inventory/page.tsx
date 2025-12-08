'use client';

import React, { useState, useEffect } from 'react';
import { Package, Download, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { StatCard } from '@/components/cards/StatCards';
import { BarChart, DoughnutChart, chartColors, generateColorPalette } from '@/components/charts/Charts';
import { reportsService } from '@/services/reportsService';

export default function InventoryReportPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await reportsService.getInventoryReport();
      
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
  }, []);

  const handleExportExcel = async () => {
    try {
      const blob = await reportsService.exportInventoryReportExcel();
      reportsService.downloadFile(blob, `inventory-report-${Date.now()}.xlsx`);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
    }
  };

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  const { overview, inventory, categoryStats } = reportData;

  const filteredInventory = inventory.filter((item: any) => {
    if (filter === 'low') return item.status === 'low_stock';
    if (filter === 'out') return item.status === 'out_of_stock';
    return true;
  });

  const categoryChartData = {
    labels: categoryStats.map((cat: any) => cat.categoryName),
    datasets: [{
      label: 'Valor Total por Categoría',
      data: categoryStats.map((cat: any) => cat.totalValue),
      backgroundColor: generateColorPalette(categoryStats.length),
      borderWidth: 1
    }]
  };

  const stockStatusChartData = {
    labels: ['En Stock', 'Stock Bajo', 'Sin Stock'],
    datasets: [{
      data: [
        inventory.filter((i: any) => i.status === 'in_stock').length,
        inventory.filter((i: any) => i.status === 'low_stock').length,
        inventory.filter((i: any) => i.status === 'out_of_stock').length
      ],
      backgroundColor: [chartColors.success, chartColors.warning, chartColors.danger],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reporte de Inventario</h1>
            <p className="text-gray-600 mt-1">Control y análisis del stock de productos</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={loadReport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
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
          title="Total Productos"
          value={overview.totalProducts}
          icon={Package}
          color="blue"
        />
        
        <StatCard
          title="Stock Bajo"
          value={overview.lowStockProducts}
          icon={AlertTriangle}
          color="yellow"
        />
        
        <StatCard
          title="Sin Stock"
          value={overview.outOfStockProducts}
          icon={XCircle}
          color="red"
        />
        
        <StatCard
          title="Valor Total"
          value={parseFloat(overview.totalValue).toFixed(2)}
          icon={CheckCircle}
          color="green"
          prefix="$"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Valor por Categoría</h3>
          <BarChart data={categoryChartData} height={300} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Stock</h3>
          <DoughnutChart data={stockStatusChartData} height={300} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas por Categoría</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Categoría</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Productos</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Cantidad Total</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Valor Total</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Promedio/Prod</th>
              </tr>
            </thead>
            <tbody>
              {categoryStats.map((cat: any) => (
                <tr key={cat.categoryId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{cat.categoryName}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">{cat.totalProducts}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">{cat.totalQuantity}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                    ${cat.totalValue.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">{cat.averageQuantityPerProduct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Inventario Detallado</h3>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Todos ({inventory.length})
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-3 py-1 text-sm rounded-lg ${filter === 'low' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Stock Bajo ({overview.lowStockProducts})
            </button>
            <button
              onClick={() => setFilter('out')}
              className={`px-3 py-1 text-sm rounded-lg ${filter === 'out' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Sin Stock ({overview.outOfStockProducts})
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">SKU</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Producto</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Categoría</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Cantidad</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Mín</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Máx</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Precio</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Valor</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{item.sku}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.productName}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.category}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">{item.quantity}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">{item.minStock}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">{item.maxStock}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">${parseFloat(item.price).toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                    ${item.totalValue.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      item.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                      item.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.status === 'in_stock' ? 'En Stock' :
                       item.status === 'low_stock' ? 'Stock Bajo' : 'Sin Stock'}
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
