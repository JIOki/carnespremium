import api from './api';

export const reportsService = {
  /**
   * Obtener métricas del dashboard
   * @param {Object} params - Parámetros de consulta (startDate, endDate)
   * @returns {Promise} Métricas del dashboard
   */
  async getDashboardMetrics(params = {}) {
    try {
      const response = await api.get('/reports/dashboard', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener métricas del dashboard:', error);
      throw error;
    }
  },

  /**
   * Obtener reporte de ventas
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise} Reporte de ventas
   */
  async getSalesReport(params = {}) {
    try {
      const response = await api.get('/reports/sales', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener reporte de ventas:', error);
      throw error;
    }
  },

  /**
   * Exportar reporte de ventas a PDF
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise} Blob del PDF
   */
  async exportSalesPDF(params = {}) {
    try {
      const response = await api.get('/reports/sales/export/pdf', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error al exportar reporte a PDF:', error);
      throw error;
    }
  },

  /**
   * Exportar reporte de ventas a Excel
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise} Blob del Excel
   */
  async exportSalesExcel(params = {}) {
    try {
      const response = await api.get('/reports/sales/export/excel', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error al exportar reporte a Excel:', error);
      throw error;
    }
  },

  /**
   * Obtener analytics de clientes
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise} Analytics de clientes
   */
  async getCustomerAnalytics(params = {}) {
    try {
      const response = await api.get('/reports/customers', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener analytics de clientes:', error);
      throw error;
    }
  },

  /**
   * Exportar analytics de clientes a Excel
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise} Blob del Excel
   */
  async exportCustomerAnalyticsExcel(params = {}) {
    try {
      const response = await api.get('/reports/customers/export/excel', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error al exportar analytics de clientes:', error);
      throw error;
    }
  },

  /**
   * Obtener reporte de inventario
   * @returns {Promise} Reporte de inventario
   */
  async getInventoryReport() {
    try {
      const response = await api.get('/reports/inventory');
      return response.data;
    } catch (error) {
      console.error('Error al obtener reporte de inventario:', error);
      throw error;
    }
  },

  /**
   * Exportar reporte de inventario a Excel
   * @returns {Promise} Blob del Excel
   */
  async exportInventoryReportExcel() {
    try {
      const response = await api.get('/reports/inventory/export/excel', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error al exportar reporte de inventario:', error);
      throw error;
    }
  },

  /**
   * Obtener productos más vendidos
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise} Top productos
   */
  async getTopProducts(params = {}) {
    try {
      const response = await api.get('/reports/products/top', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener top productos:', error);
      throw error;
    }
  },

  /**
   * Obtener ingresos por período
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise} Ingresos por período
   */
  async getRevenue(params = {}) {
    try {
      const response = await api.get('/reports/revenue', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener ingresos:', error);
      throw error;
    }
  },

  /**
   * Obtener métricas de rendimiento
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise} Métricas de rendimiento
   */
  async getPerformanceMetrics(params = {}) {
    try {
      const response = await api.get('/reports/performance', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener métricas de rendimiento:', error);
      throw error;
    }
  },

  /**
   * Exportar dashboard a PDF
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise} Blob del PDF
   */
  async exportDashboardPDF(params = {}) {
    try {
      const response = await api.get('/reports/dashboard/export/pdf', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error al exportar dashboard a PDF:', error);
      throw error;
    }
  },

  /**
   * Obtener top clientes
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise} Top clientes
   */
  async getTopCustomers(params = {}) {
    try {
      const response = await api.get('/reports/customers/top', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener top clientes:', error);
      throw error;
    }
  },

  /**
   * Descargar archivo blob
   * @param {Blob} blob - Blob del archivo
   * @param {String} filename - Nombre del archivo
   */
  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

export default reportsService;
