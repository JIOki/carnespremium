// Servicio de Recomendaciones y Personalización
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

// ==================== TRACKING DE EVENTOS ====================

export const trackEvent = async (eventData: {
  userId?: string;
  sessionId?: string;
  eventType: string;
  productId?: string;
  categoryId?: string;
  searchQuery?: string;
  pageUrl?: string;
  referrer?: string;
  duration?: number;
  quantity?: number;
  price?: number;
  position?: number;
  fromRecommendation?: boolean;
  recommendationType?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  metadata?: any;
}) => {
  const response = await fetch(`${API_URL}/recommendations/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });
  return response.json();
};

export const trackEventsBatch = async (events: any[]) => {
  const response = await fetch(`${API_URL}/recommendations/track/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ events }),
  });
  return response.json();
};

export const getUserEvents = async (options?: {
  eventType?: string;
  productId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }

  const response = await fetch(
    `${API_URL}/recommendations/user/events?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const getRecentlyViewedProducts = async (limit?: number) => {
  const token = localStorage.getItem('token');
  const params = limit ? `?limit=${limit}` : '';

  const response = await fetch(
    `${API_URL}/recommendations/user/recently-viewed${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const getRecentSearches = async (limit?: number) => {
  const token = localStorage.getItem('token');
  const params = limit ? `?limit=${limit}` : '';

  const response = await fetch(
    `${API_URL}/recommendations/user/recent-searches${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const getUserBehavior = async (days?: number) => {
  const token = localStorage.getItem('token');
  const params = days ? `?days=${days}` : '';

  const response = await fetch(
    `${API_URL}/recommendations/user/behavior${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const getAbandonedCartProducts = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `${API_URL}/recommendations/user/abandoned-cart`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

// ==================== RECOMENDACIONES ====================

export const getPersonalizedRecommendations = async (options?: {
  limit?: number;
  excludeProductIds?: string[];
  includeTypes?: string[];
}) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  
  if (options) {
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.excludeProductIds) {
      params.append('excludeProductIds', JSON.stringify(options.excludeProductIds));
    }
    if (options.includeTypes) {
      params.append('includeTypes', JSON.stringify(options.includeTypes));
    }
  }

  const response = await fetch(
    `${API_URL}/recommendations/personalized?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const getSimilarProducts = async (
  productId: string,
  limit?: number,
  excludeIds?: string[]
) => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (excludeIds) params.append('excludeIds', JSON.stringify(excludeIds));

  const response = await fetch(
    `${API_URL}/recommendations/similar/${productId}?${params.toString()}`
  );
  return response.json();
};

export const getFrequentlyBoughtTogether = async (
  productId: string,
  limit?: number,
  excludeIds?: string[]
) => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (excludeIds) params.append('excludeIds', JSON.stringify(excludeIds));

  const response = await fetch(
    `${API_URL}/recommendations/frequently-bought/${productId}?${params.toString()}`
  );
  return response.json();
};

export const getComplementaryProducts = async (
  productId: string,
  limit?: number,
  excludeIds?: string[]
) => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (excludeIds) params.append('excludeIds', JSON.stringify(excludeIds));

  const response = await fetch(
    `${API_URL}/recommendations/complementary/${productId}?${params.toString()}`
  );
  return response.json();
};

export const getTrendingProducts = async (limit?: number, excludeIds?: string[]) => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (excludeIds) params.append('excludeIds', JSON.stringify(excludeIds));

  const response = await fetch(
    `${API_URL}/recommendations/trending?${params.toString()}`
  );
  return response.json();
};

export const getNewProducts = async (limit?: number, excludeIds?: string[]) => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (excludeIds) params.append('excludeIds', JSON.stringify(excludeIds));

  const response = await fetch(
    `${API_URL}/recommendations/new?${params.toString()}`
  );
  return response.json();
};

export const recordRecommendationFeedback = async (feedbackData: {
  productId: string;
  recommendedProductId: string;
  action: 'CLICKED' | 'PURCHASED' | 'DISMISSED' | 'IGNORED';
  metadata?: any;
}) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}/recommendations/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(feedbackData),
  });
  return response.json();
};

// ==================== SEGMENTACIÓN ====================

export const getUserSegment = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `${API_URL}/recommendations/user/segment`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const recalculateUserSegment = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `${API_URL}/recommendations/user/segment/recalculate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

// ==================== ADMIN ====================

export const getEventStats = async (startDate?: string, endDate?: string) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await fetch(
    `${API_URL}/recommendations/admin/stats/events?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const getRecommendationStats = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `${API_URL}/recommendations/admin/stats/recommendations`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const getSegmentStats = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `${API_URL}/recommendations/admin/stats/segments`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const getUsersBySegment = async (
  segmentName: string,
  options?: { limit?: number; offset?: number }
) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const response = await fetch(
    `${API_URL}/recommendations/admin/segments/${segmentName}?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const getAtRiskUsers = async (minRisk?: number, limit?: number) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  
  if (minRisk) params.append('minRisk', minRisk.toString());
  if (limit) params.append('limit', limit.toString());

  const response = await fetch(
    `${API_URL}/recommendations/admin/at-risk-users?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const getHighValueUsers = async (minValue?: number, limit?: number) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  
  if (minValue) params.append('minValue', minValue.toString());
  if (limit) params.append('limit', limit.toString());

  const response = await fetch(
    `${API_URL}/recommendations/admin/high-value-users?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const recalculateSegments = async (limit?: number) => {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `${API_URL}/recommendations/admin/recalculate-segments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ limit }),
    }
  );
  return response.json();
};

export const cleanOldEvents = async (daysToKeep?: number) => {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `${API_URL}/recommendations/admin/events/cleanup`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ daysToKeep }),
    }
  );
  return response.json();
};
