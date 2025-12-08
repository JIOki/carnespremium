import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

// ==================== TIPOS ====================

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  provider: 'STRIPE' | 'MERCADOPAGO';
  providerPaymentId?: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  metadata?: any;
  authorizedAt?: string;
  capturedAt?: string;
  failedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  order?: {
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
  };
  transactions?: PaymentTransaction[];
  refunds?: Refund[];
}

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  type: 'AUTHORIZATION' | 'CAPTURE' | 'VOID' | 'REFUND' | 'CHARGEBACK';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  providerTransactionId?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  orderId: string;
  userId: string;
  type: 'FULL' | 'PARTIAL';
  reason: 'CUSTOMER_REQUEST' | 'QUALITY_ISSUE' | 'DAMAGED' | 'OUT_OF_STOCK' | 'FRAUD' | 'OTHER';
  reasonDetails?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  providerRefundId?: string;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  payment?: Payment;
}

export interface PaymentStats {
  totalPayments: number;
  totalRevenue: number;
  byProvider: {
    provider: string;
    _count: number;
    _sum: { amount: number };
  }[];
  byStatus: {
    status: string;
    _count: number;
    _sum: { amount: number };
  }[];
  totalRefunds: {
    count: number;
    amount: number;
  };
  topPaymentMethods: {
    paymentMethod: string;
    _count: number;
  }[];
}

// ==================== STRIPE ====================

export const createStripePaymentIntent = async (orderId: string, amount: number, currency: string = 'usd', paymentMethodId?: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/payments/stripe/create-payment-intent`,
    { orderId, amount, currency, paymentMethodId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

export const confirmStripePayment = async (paymentIntentId: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/payments/stripe/confirm-payment`,
    { paymentIntentId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

// ==================== MERCADOPAGO ====================

export const createMercadoPagoPreference = async (orderId: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/payments/mercadopago/create-preference`,
    { orderId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

export const getMercadoPagoPaymentStatus = async (mpPaymentId: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_URL}/payments/mercadopago/payment-status/${mpPaymentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// ==================== HISTORIAL DE PAGOS ====================

export const getPaymentHistory = async (page: number = 1, limit: number = 20, filters?: { status?: string; provider?: string }) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.provider && { provider: filters.provider })
  });

  const response = await axios.get(
    `${API_URL}/payments/history?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

export const getPaymentDetails = async (paymentId: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_URL}/payments/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// ==================== REEMBOLSOS ====================

export const requestRefund = async (paymentId: string, reason: string, reasonDetails?: string, amount?: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/payments/${paymentId}/refund`,
    { reason, reasonDetails, amount },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

export const getMyRefundRequests = async (page: number = 1, limit: number = 20) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_URL}/payments/refunds/my-requests?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// ==================== ADMIN ====================

export const getAllPayments = async (page: number = 1, limit: number = 50, filters?: { status?: string; provider?: string; search?: string }) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.provider && { provider: filters.provider }),
    ...(filters?.search && { search: filters.search })
  });

  const response = await axios.get(
    `${API_URL}/payments/admin/all?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

export const getAllRefunds = async (page: number = 1, limit: number = 50, status?: string) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status })
  });

  const response = await axios.get(
    `${API_URL}/payments/admin/refunds?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

export const approveRefund = async (refundId: string, notes?: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/payments/admin/refunds/${refundId}/approve`,
    { notes },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

export const rejectRefund = async (refundId: string, rejectionReason: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/payments/admin/refunds/${refundId}/reject`,
    { rejectionReason },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

export const getPaymentStats = async (startDate?: string, endDate?: string) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({
    ...(startDate && { startDate }),
    ...(endDate && { endDate })
  });

  const response = await axios.get(
    `${API_URL}/payments/admin/stats?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// ==================== UTILIDADES ====================

export const getStatusBadgeColor = (status: string): string => {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    AUTHORIZED: 'bg-blue-100 text-blue-800',
    CAPTURED: 'bg-green-100 text-green-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    REFUNDED: 'bg-purple-100 text-purple-800',
    PARTIALLY_REFUNDED: 'bg-purple-100 text-purple-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    PENDING: 'Pendiente',
    AUTHORIZED: 'Autorizado',
    CAPTURED: 'Capturado',
    PROCESSING: 'Procesando',
    COMPLETED: 'Completado',
    FAILED: 'Fallido',
    CANCELLED: 'Cancelado',
    REFUNDED: 'Reembolsado',
    PARTIALLY_REFUNDED: 'Reembolso Parcial'
  };
  return texts[status] || status;
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const paymentService = {
  // Stripe
  createStripePaymentIntent,
  confirmStripePayment,
  
  // MercadoPago
  createMercadoPagoPreference,
  getMercadoPagoPaymentStatus,
  
  // Historial
  getPaymentHistory,
  getPaymentDetails,
  
  // Reembolsos
  requestRefund,
  getMyRefundRequests,
  
  // Admin
  getAllPayments,
  getAllRefunds,
  approveRefund,
  rejectRefund,
  getPaymentStats,
  
  // Utilidades
  getStatusBadgeColor,
  getStatusText,
  formatCurrency
};

export default paymentService;
