import { apiClient } from './api';

/**
 * ===================================================
 * SUBSCRIPTION SERVICE - Frontend API Client
 * ===================================================
 */

// ==================== TIPOS ====================

export interface MembershipPlan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  monthlyPrice: number;
  quarterlyPrice?: number;
  annualPrice?: number;
  discountPercent: number;
  freeShipping: boolean;
  pointsMultiplier: number;
  earlyAccess: boolean;
  exclusiveProducts: boolean;
  maxMonthlyOrders?: number;
  prioritySupport: boolean;
  features: string[];
  color?: string;
  icon?: string;
  isActive: boolean;
  totalMembers?: number;
}

export interface UserMembership {
  id: string;
  userId: string;
  planId: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAUSED';
  startDate: string;
  endDate: string;
  renewalDate?: string;
  cancelledAt?: string;
  pausedAt?: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  autoRenew: boolean;
  ordersThisMonth: number;
  benefitsUsed: number;
  totalSavings: number;
  plan: MembershipPlan;
  daysRemaining?: number;
  isExpired?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  boxType: string;
  boxSize?: string;
  estimatedValue: number;
  price: number;
  comparePrice?: number;
  includedProducts: any[];
  productCount: number;
  totalWeight?: number;
  allowCustomization: boolean;
  customizationOptions?: any;
  deliveryFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  minSubscriptionPeriod?: number;
  membershipRequired?: string;
  isActive: boolean;
  imageUrl?: string;
  features: string[];
  tags: string[];
  totalSubscribers?: number;
  availableSlots?: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';
  startDate: string;
  endDate?: string;
  nextDeliveryDate?: string;
  cancelledAt?: string;
  pausedAt?: string;
  pausedUntil?: string;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  deliveryDay?: string;
  preferences?: any;
  excludedProducts: string[];
  notes?: string;
  paymentMethod?: string;
  autoRenew: boolean;
  totalDeliveries: number;
  completedDeliveries: number;
  skippedDeliveries: number;
  totalSpent: number;
  plan: SubscriptionPlan;
  deliveries?: SubscriptionDelivery[];
}

export interface SubscriptionDelivery {
  id: string;
  subscriptionId: string;
  orderId?: string;
  scheduledDate: string;
  deliveredDate?: string;
  status: 'SCHEDULED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'SKIPPED' | 'FAILED';
  products: any[];
  totalValue: number;
  trackingNumber?: string;
  trackingUrl?: string;
  skippedBy?: string;
  skippedAt?: string;
  skipReason?: string;
  rating?: number;
  feedback?: string;
}

// ==================== MEMBERSHIP PLANS ====================

export const getMembershipPlans = async (): Promise<MembershipPlan[]> => {
  const response = await apiClient.get('/subscriptions/membership-plans');
  return response.data;
};

export const getMembershipPlan = async (planId: string): Promise<MembershipPlan> => {
  const response = await apiClient.get(`/subscriptions/membership-plans/${planId}`);
  return response.data;
};

// ==================== USER MEMBERSHIP ====================

export const getMyMembership = async (): Promise<{ hasMembership: boolean; membership?: UserMembership }> => {
  const response = await apiClient.get('/subscriptions/my-membership');
  return response.data;
};

export const subscribeMembership = async (data: {
  planId: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
}): Promise<UserMembership> => {
  const response = await apiClient.post('/subscriptions/membership/subscribe', data);
  return response.data;
};

export const upgradeMembership = async (planId: string): Promise<UserMembership> => {
  const response = await apiClient.put('/subscriptions/membership/upgrade', { planId });
  return response.data;
};

export const cancelMembership = async (reason?: string): Promise<UserMembership> => {
  const response = await apiClient.post('/subscriptions/membership/cancel', { reason });
  return response.data;
};

export const pauseMembership = async (): Promise<UserMembership> => {
  const response = await apiClient.post('/subscriptions/membership/pause');
  return response.data;
};

export const resumeMembership = async (): Promise<UserMembership> => {
  const response = await apiClient.post('/subscriptions/membership/resume');
  return response.data;
};

export const applyMembershipDiscount = async (orderAmount: number): Promise<{
  hasDiscount: boolean;
  discountPercent?: number;
  discount: number;
  finalAmount: number;
  freeShipping?: boolean;
  reason?: string;
}> => {
  const response = await apiClient.post('/subscriptions/membership/apply-discount', { orderAmount });
  return response.data;
};

// ==================== SUBSCRIPTION PLANS ====================

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await apiClient.get('/subscriptions/subscription-plans');
  return response.data;
};

export const getSubscriptionPlan = async (planId: string): Promise<SubscriptionPlan> => {
  const response = await apiClient.get(`/subscriptions/subscription-plans/${planId}`);
  return response.data;
};

// ==================== USER SUBSCRIPTIONS ====================

export const getMySubscriptions = async (): Promise<Subscription[]> => {
  const response = await apiClient.get('/subscriptions/my-subscriptions');
  return response.data;
};

export const createSubscription = async (data: {
  planId: string;
  frequency?: string;
  deliveryDay?: string;
  addressId?: string;
  shippingAddress?: any;
  preferences?: any;
  excludedProducts?: string[];
  notes?: string;
  paymentMethod?: string;
  autoRenew?: boolean;
}): Promise<Subscription> => {
  const response = await apiClient.post('/subscriptions/subscribe', data);
  return response.data;
};

export const updateSubscription = async (subscriptionId: string, data: {
  frequency?: string;
  deliveryDay?: string;
  addressId?: string;
  shippingAddress?: any;
  preferences?: any;
  excludedProducts?: string[];
  notes?: string;
  paymentMethod?: string;
  autoRenew?: boolean;
}): Promise<Subscription> => {
  const response = await apiClient.put(`/subscriptions/${subscriptionId}`, data);
  return response.data;
};

export const cancelSubscription = async (subscriptionId: string, reason?: string): Promise<Subscription> => {
  const response = await apiClient.post(`/subscriptions/${subscriptionId}/cancel`, { reason });
  return response.data;
};

export const pauseSubscription = async (subscriptionId: string, pauseUntil?: string): Promise<Subscription> => {
  const response = await apiClient.post(`/subscriptions/${subscriptionId}/pause`, { pauseUntil });
  return response.data;
};

export const resumeSubscription = async (subscriptionId: string): Promise<Subscription> => {
  const response = await apiClient.post(`/subscriptions/${subscriptionId}/resume`);
  return response.data;
};

// ==================== DELIVERIES ====================

export const getSubscriptionDeliveries = async (
  subscriptionId: string,
  params?: { status?: string; limit?: number }
): Promise<SubscriptionDelivery[]> => {
  const response = await apiClient.get(`/subscriptions/${subscriptionId}/deliveries`, { params });
  return response.data;
};

export const skipDelivery = async (deliveryId: string, reason?: string): Promise<SubscriptionDelivery> => {
  const response = await apiClient.post(`/subscriptions/deliveries/${deliveryId}/skip`, { reason });
  return response.data;
};

// ==================== ADMIN - PLANS ====================

export const createMembershipPlan = async (data: Partial<MembershipPlan>): Promise<MembershipPlan> => {
  const response = await apiClient.post('/subscriptions/admin/membership-plans', data);
  return response.data;
};

export const updateMembershipPlan = async (planId: string, data: Partial<MembershipPlan>): Promise<MembershipPlan> => {
  const response = await apiClient.put(`/subscriptions/admin/membership-plans/${planId}`, data);
  return response.data;
};

export const deleteMembershipPlan = async (planId: string): Promise<void> => {
  await apiClient.delete(`/subscriptions/admin/membership-plans/${planId}`);
};

export const createSubscriptionPlan = async (data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
  const response = await apiClient.post('/subscriptions/admin/subscription-plans', data);
  return response.data;
};

export const updateSubscriptionPlan = async (planId: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
  const response = await apiClient.put(`/subscriptions/admin/subscription-plans/${planId}`, data);
  return response.data;
};

export const deleteSubscriptionPlan = async (planId: string): Promise<void> => {
  await apiClient.delete(`/subscriptions/admin/subscription-plans/${planId}`);
};

// ==================== ADMIN - MANAGEMENT ====================

export const getAllMemberships = async (params?: {
  status?: string;
  planId?: string;
  page?: number;
  limit?: number;
}): Promise<{
  memberships: any[];
  pagination: { total: number; page: number; limit: number; pages: number };
}> => {
  const response = await apiClient.get('/subscriptions/admin/memberships', { params });
  return response.data;
};

export const getAllSubscriptions = async (params?: {
  status?: string;
  planId?: string;
  page?: number;
  limit?: number;
}): Promise<{
  subscriptions: any[];
  pagination: { total: number; page: number; limit: number; pages: number };
}> => {
  const response = await apiClient.get('/subscriptions/admin/subscriptions', { params });
  return response.data;
};

export const getSubscriptionStats = async (): Promise<{
  memberships: any;
  subscriptions: any;
}> => {
  const response = await apiClient.get('/subscriptions/admin/stats');
  return response.data;
};

export const completeDelivery = async (deliveryId: string, orderId: string): Promise<SubscriptionDelivery> => {
  const response = await apiClient.post(`/subscriptions/admin/deliveries/${deliveryId}/complete`, { orderId });
  return response.data;
};
