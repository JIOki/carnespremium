'use client';

import React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  DollarSign,
  Users,
  Package,
  TrendingUp,
  FileText,
  Download,
  Calendar,
  ArrowRight
} from 'lucide-react';

const reportCards = [
  {
    title: 'Dashboard de Analytics',
    description: 'Vista general de métricas clave en tiempo real',
    icon: BarChart3,
    color: 'blue',
    href: '/admin/analytics',
    features: [
      'Ventas totales y órdenes',
      'Top productos más vendidos',
      'Alertas de inventario',
      'Órdenes recientes'
    ]
  },
  {
    title: 'Reporte de Ventas',
    description: 'Análisis detallado de ventas por período',
    icon: DollarSign,
    color: 'green',
    href: '/admin/reports/sales',
    features: [
      'Ingresos por día',
      'Distribución por estado',
      'Descuentos e impuestos',
      'Exportar PDF/Excel'
    ]
  },
  {
    title: 'Analytics de Clientes',
    description: 'Segmentación y comportamiento de clientes',
    icon: Users,
    color: 'purple',
    href: '/admin/reports/customers',
    features: [
      'Segmentación de clientes',
      'Top clientes por gasto',
      'Tasa de retención',
      'Análisis de abandono'
    ]
  },
  {
    title: 'Reporte de Inventario',
    description: 'Control y análisis del stock de productos',
    icon: Package,
    color: 'orange',
    href: '/admin/reports/inventory',
    features: [
      'Estado del stock',
      'Alertas de stock bajo',
      'Valor por categoría',
      'Movimientos recientes'
    ]
  }
];

const colorClasses: any = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-500',
    text: 'text-blue-600',
    hover: 'hover:border-blue-500'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-500',
    text: 'text-green-600',
    hover: 'hover:border-green-500'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-500',
    text: 'text-purple-600',
    hover: 'hover:border-purple-500'
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-500',
    text: 'text-orange-600',
    hover: 'hover:border-orange-500'
  }
};

export default function ReportsIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Reportes y Analytics</h1>
        <p className="text-lg text-gray-600">
          Sistema completo de análisis y reportería para tu negocio
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Dashboards</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reportes</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Métricas</p>
              <p className="text-2xl font-bold text-gray-900">20+</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-full">
              <Download className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Exportar</p>
              <p className="text-2xl font-bold text-gray-900">PDF/Excel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {reportCards.map((report) => {
          const Icon = report.icon;
          const colors = colorClasses[report.color];

          return (
            <Link
              key={report.href}
              href={report.href}
              className={`bg-white rounded-lg shadow-md p-6 border-2 border-transparent ${colors.hover} transition-all hover:shadow-lg group`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`${colors.icon} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-gray-700">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>

                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Características:</p>
                <ul className="grid grid-cols-2 gap-2">
                  {report.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.icon}`}></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Additional Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <Calendar className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-bold mb-2">Filtros Personalizados</h3>
          <p className="text-sm text-blue-100">
            Filtra datos por período, categoría, estado y más para obtener insights precisos.
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <Download className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-bold mb-2">Exportación Múltiple</h3>
          <p className="text-sm text-green-100">
            Descarga reportes en formato PDF o Excel para compartir con tu equipo.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <TrendingUp className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-bold mb-2">Análisis en Tiempo Real</h3>
          <p className="text-sm text-purple-100">
            Visualiza métricas actualizadas al instante con gráficos interactivos.
          </p>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
        <div className="flex items-start gap-4">
          <div className="bg-blue-500 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Necesitas ayuda?</h3>
            <p className="text-gray-700 mb-4">
              Cada reporte incluye opciones de filtrado, visualización de gráficos interactivos y 
              capacidades de exportación. Usa los filtros de fecha para analizar períodos específicos.
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Los datos se actualizan en tiempo real</li>
              <li>• Puedes exportar reportes en PDF o Excel</li>
              <li>• Los gráficos son interactivos - pasa el mouse para ver detalles</li>
              <li>• Usa los filtros de período para análisis personalizados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
