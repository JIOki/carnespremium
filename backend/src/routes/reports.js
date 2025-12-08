const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const reportExportService = require('../services/reportExportService');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const path = require('path');

// Todas las rutas requieren autenticación de admin
router.use(authMiddleware);
router.use(requireAdmin);

/**
 * GET /api/reports/dashboard
 * Obtener métricas del dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const metrics = await analyticsService.getDashboardMetrics({
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error al obtener métricas del dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener métricas del dashboard'
    });
  }
});

/**
 * GET /api/reports/sales
 * Obtener reporte de ventas
 */
router.get('/sales', async (req, res) => {
  try {
    const { startDate, endDate, categoryId, status } = req.query;
    
    const report = await analyticsService.getSalesReport({
      startDate,
      endDate,
      categoryId,
      status
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error al obtener reporte de ventas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reporte de ventas'
    });
  }
});

/**
 * GET /api/reports/sales/export/pdf
 * Exportar reporte de ventas a PDF
 */
router.get('/sales/export/pdf', async (req, res) => {
  try {
    const { startDate, endDate, categoryId, status } = req.query;
    
    // Obtener datos del reporte
    const report = await analyticsService.getSalesReport({
      startDate,
      endDate,
      categoryId,
      status
    });

    // Generar PDF
    const filename = `sales-report-${Date.now()}.pdf`;
    const filepath = await reportExportService.exportSalesReportToPDF(report, filename);

    // Enviar archivo
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error al enviar PDF:', err);
        res.status(500).json({
          success: false,
          error: 'Error al generar PDF'
        });
      }
    });
  } catch (error) {
    console.error('Error al exportar reporte de ventas a PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Error al exportar reporte a PDF'
    });
  }
});

/**
 * GET /api/reports/sales/export/excel
 * Exportar reporte de ventas a Excel
 */
router.get('/sales/export/excel', async (req, res) => {
  try {
    const { startDate, endDate, categoryId, status } = req.query;
    
    // Obtener datos del reporte
    const report = await analyticsService.getSalesReport({
      startDate,
      endDate,
      categoryId,
      status
    });

    // Generar Excel
    const filename = `sales-report-${Date.now()}.xlsx`;
    const filepath = await reportExportService.exportSalesReportToExcel(report, filename);

    // Enviar archivo
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error al enviar Excel:', err);
        res.status(500).json({
          success: false,
          error: 'Error al generar Excel'
        });
      }
    });
  } catch (error) {
    console.error('Error al exportar reporte de ventas a Excel:', error);
    res.status(500).json({
      success: false,
      error: 'Error al exportar reporte a Excel'
    });
  }
});

/**
 * GET /api/reports/customers
 * Obtener analytics de clientes
 */
router.get('/customers', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const analytics = await analyticsService.getCustomerAnalytics({
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error al obtener analytics de clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener analytics de clientes'
    });
  }
});

/**
 * GET /api/reports/customers/export/excel
 * Exportar analytics de clientes a Excel
 */
router.get('/customers/export/excel', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const analytics = await analyticsService.getCustomerAnalytics({
      startDate,
      endDate
    });

    const filename = `customer-analytics-${Date.now()}.xlsx`;
    const filepath = await reportExportService.exportCustomerAnalyticsToExcel(analytics, filename);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error al enviar Excel:', err);
        res.status(500).json({
          success: false,
          error: 'Error al generar Excel'
        });
      }
    });
  } catch (error) {
    console.error('Error al exportar analytics de clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al exportar analytics a Excel'
    });
  }
});

/**
 * GET /api/reports/inventory
 * Obtener reporte de inventario
 */
router.get('/inventory', async (req, res) => {
  try {
    const report = await analyticsService.getInventoryReport();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error al obtener reporte de inventario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reporte de inventario'
    });
  }
});

/**
 * GET /api/reports/inventory/export/excel
 * Exportar reporte de inventario a Excel
 */
router.get('/inventory/export/excel', async (req, res) => {
  try {
    const report = await analyticsService.getInventoryReport();

    const filename = `inventory-report-${Date.now()}.xlsx`;
    const filepath = await reportExportService.exportInventoryReportToExcel(report, filename);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error al enviar Excel:', err);
        res.status(500).json({
          success: false,
          error: 'Error al generar Excel'
        });
      }
    });
  } catch (error) {
    console.error('Error al exportar reporte de inventario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al exportar reporte a Excel'
    });
  }
});

/**
 * GET /api/reports/products/top
 * Obtener productos más vendidos
 */
router.get('/products/top', async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    const { startDate: start, endDate: end } = analyticsService.parseDateFilters({
      startDate,
      endDate
    });

    const dateFilter = {
      createdAt: {
        gte: start,
        lte: end
      }
    };

    const topProducts = await analyticsService.getTopProducts(
      parseInt(limit),
      dateFilter
    );

    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    console.error('Error al obtener top productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener top productos'
    });
  }
});

/**
 * GET /api/reports/revenue
 * Obtener ingresos por período
 */
router.get('/revenue', async (req, res) => {
  try {
    const { period = 'day', limit = 30 } = req.query;
    
    const revenue = await analyticsService.getRevenueByPeriod(
      period,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: revenue
    });
  } catch (error) {
    console.error('Error al obtener ingresos por período:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ingresos'
    });
  }
});

/**
 * GET /api/reports/performance
 * Obtener métricas de rendimiento
 */
router.get('/performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const metrics = await analyticsService.getPerformanceMetrics({
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error al obtener métricas de rendimiento:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener métricas de rendimiento'
    });
  }
});

/**
 * GET /api/reports/dashboard/export/pdf
 * Exportar dashboard a PDF
 */
router.get('/dashboard/export/pdf', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const metrics = await analyticsService.getDashboardMetrics({
      startDate,
      endDate
    });

    const filename = `dashboard-report-${Date.now()}.pdf`;
    const filepath = await reportExportService.exportDashboardToPDF(metrics, filename);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error al enviar PDF:', err);
        res.status(500).json({
          success: false,
          error: 'Error al generar PDF'
        });
      }
    });
  } catch (error) {
    console.error('Error al exportar dashboard a PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Error al exportar dashboard'
    });
  }
});

/**
 * GET /api/reports/customers/top
 * Obtener top clientes
 */
router.get('/customers/top', async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    const { startDate: start, endDate: end } = analyticsService.parseDateFilters({
      startDate,
      endDate
    });

    const dateFilter = {
      createdAt: {
        gte: start,
        lte: end
      }
    };

    const topCustomers = await analyticsService.getTopCustomers(
      parseInt(limit),
      dateFilter
    );

    res.json({
      success: true,
      data: topCustomers
    });
  } catch (error) {
    console.error('Error al obtener top clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener top clientes'
    });
  }
});

module.exports = router;
