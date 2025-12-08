'use client';

import { useCallback, useEffect, useRef } from 'react';
import * as recommendationService from '../services/recommendationService';

// Detectar información del dispositivo
const getDeviceInfo = () => {
  if (typeof window === 'undefined') return {};
  
  const userAgent = navigator.userAgent;
  let deviceType = 'DESKTOP';
  
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    deviceType = /iPad/.test(userAgent) ? 'TABLET' : 'MOBILE';
  }
  
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'MacOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return { deviceType, browser, os };
};

// Generar o recuperar session ID
const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('tracking_session_id');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('tracking_session_id', sessionId);
  }
  
  return sessionId;
};

export interface TrackingOptions {
  productId?: string;
  categoryId?: string;
  searchQuery?: string;
  duration?: number;
  quantity?: number;
  price?: number;
  position?: number;
  fromRecommendation?: boolean;
  recommendationType?: string;
  metadata?: any;
}

export const useTracking = () => {
  const eventQueue = useRef<any[]>([]);
  const flushTimeout = useRef<NodeJS.Timeout | null>(null);
  const deviceInfo = useRef(getDeviceInfo());

  // Obtener userId del token si existe
  const getUserId = () => {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id || null;
    } catch {
      return null;
    }
  };

  // Enviar eventos en batch
  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;
    
    const eventsToSend = [...eventQueue.current];
    eventQueue.current = [];
    
    try {
      await recommendationService.trackEventsBatch(eventsToSend);
    } catch (error) {
      console.error('Error flushing tracking events:', error);
      // Re-agregar eventos fallidos a la cola
      eventQueue.current = [...eventsToSend, ...eventQueue.current];
    }
  }, []);

  // Programar flush de eventos
  const scheduleFlush = useCallback(() => {
    if (flushTimeout.current) {
      clearTimeout(flushTimeout.current);
    }
    
    flushTimeout.current = setTimeout(() => {
      flushEvents();
    }, 2000); // Flush cada 2 segundos
  }, [flushEvents]);

  // Función principal de tracking
  const trackEvent = useCallback((
    eventType: string,
    options: TrackingOptions = {}
  ) => {
    const event = {
      userId: getUserId(),
      sessionId: getSessionId(),
      eventType,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      ...deviceInfo.current,
      ...options,
    };
    
    eventQueue.current.push(event);
    scheduleFlush();
  }, [scheduleFlush]);

  // Tracking específicos
  const trackProductView = useCallback((
    productId: string,
    options: Omit<TrackingOptions, 'productId'> = {}
  ) => {
    trackEvent('VIEW_PRODUCT', { productId, ...options });
  }, [trackEvent]);

  const trackAddToCart = useCallback((
    productId: string,
    quantity: number,
    price: number,
    options: Omit<TrackingOptions, 'productId' | 'quantity' | 'price'> = {}
  ) => {
    trackEvent('ADD_TO_CART', { productId, quantity, price, ...options });
  }, [trackEvent]);

  const trackRemoveFromCart = useCallback((
    productId: string,
    quantity: number,
    options: Omit<TrackingOptions, 'productId' | 'quantity'> = {}
  ) => {
    trackEvent('REMOVE_FROM_CART', { productId, quantity, ...options });
  }, [trackEvent]);

  const trackAddToWishlist = useCallback((
    productId: string,
    options: Omit<TrackingOptions, 'productId'> = {}
  ) => {
    trackEvent('ADD_TO_WISHLIST', { productId, ...options });
  }, [trackEvent]);

  const trackRemoveFromWishlist = useCallback((
    productId: string,
    options: Omit<TrackingOptions, 'productId'> = {}
  ) => {
    trackEvent('REMOVE_FROM_WISHLIST', { productId, ...options });
  }, [trackEvent]);

  const trackSearch = useCallback((
    searchQuery: string,
    options: Omit<TrackingOptions, 'searchQuery'> = {}
  ) => {
    trackEvent('SEARCH', { searchQuery, ...options });
  }, [trackEvent]);

  const trackPurchase = useCallback((
    productId: string,
    quantity: number,
    price: number,
    options: Omit<TrackingOptions, 'productId' | 'quantity' | 'price'> = {}
  ) => {
    trackEvent('PURCHASE', { productId, quantity, price, ...options });
  }, [trackEvent]);

  const trackClick = useCallback((
    productId: string,
    position?: number,
    options: Omit<TrackingOptions, 'productId' | 'position'> = {}
  ) => {
    trackEvent('CLICK', { productId, position, ...options });
  }, [trackEvent]);

  const trackCategoryView = useCallback((
    categoryId: string,
    options: Omit<TrackingOptions, 'categoryId'> = {}
  ) => {
    trackEvent('VIEW_CATEGORY', { categoryId, ...options });
  }, [trackEvent]);

  const trackCheckoutStart = useCallback((
    options: TrackingOptions = {}
  ) => {
    trackEvent('CHECKOUT_START', options);
  }, [trackEvent]);

  const trackCheckoutComplete = useCallback((
    options: TrackingOptions = {}
  ) => {
    trackEvent('CHECKOUT_COMPLETE', options);
  }, [trackEvent]);

  // Tracking de tiempo en producto
  const trackProductViewDuration = useCallback((
    productId: string,
    startTime: number,
    options: Omit<TrackingOptions, 'productId' | 'duration'> = {}
  ) => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    if (duration > 0) {
      trackEvent('VIEW_PRODUCT', { productId, duration, ...options });
    }
  }, [trackEvent]);

  // Tracking de recomendación clickeada
  const trackRecommendationClick = useCallback((
    productId: string,
    recommendedProductId: string,
    recommendationType: string,
    position: number
  ) => {
    trackEvent('CLICK', {
      productId: recommendedProductId,
      position,
      fromRecommendation: true,
      recommendationType,
      metadata: { sourceProductId: productId }
    });
  }, [trackEvent]);

  // Flush al desmontar o cerrar página
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushEvents();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (flushTimeout.current) {
        clearTimeout(flushTimeout.current);
      }
      flushEvents();
    };
  }, [flushEvents]);

  return {
    trackEvent,
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackAddToWishlist,
    trackRemoveFromWishlist,
    trackSearch,
    trackPurchase,
    trackClick,
    trackCategoryView,
    trackCheckoutStart,
    trackCheckoutComplete,
    trackProductViewDuration,
    trackRecommendationClick,
    flushEvents,
  };
};

export default useTracking;
