"use client";
import { useCallback } from 'react';

declare global {
  interface Window {
    fbq: any;
  }
}

export const usePixelEvents = () => {
  const trackEvent = useCallback((eventName: string, parameters?: any) => {
    if (typeof window !== 'undefined' && window.fbq) {
      // Only fire client-side events if fbq is available
      window.fbq('track', eventName, parameters);
      console.log(`🎯 Client-side Pixel Event: ${eventName}`, parameters);
    }
  }, []);

  const trackPageView = useCallback(() => {
    trackEvent('PageView');
  }, [trackEvent]);

  const trackViewContent = useCallback((contentId: string, contentName: string, value?: number) => {
    trackEvent('ViewContent', {
      content_ids: [contentId],
      content_name: contentName,
      value: value,
      currency: 'USD'
    });
  }, [trackEvent]);

  const trackAddToCart = useCallback((contentId: string, contentName: string, value: number, quantity: number = 1) => {
    trackEvent('AddToCart', {
      content_ids: [contentId],
      content_name: contentName,
      value: value,
      currency: 'USD',
      contents: [{
        id: contentId,
        quantity: quantity,
        item_price: value / quantity
      }]
    });
  }, [trackEvent]);

  const trackInitiateCheckout = useCallback((value: number, contentIds: string[]) => {
    trackEvent('InitiateCheckout', {
      value: value,
      currency: 'USD',
      content_ids: contentIds
    });
  }, [trackEvent]);

  const trackPurchase = useCallback((value: number, contentIds: string[], orderId: string) => {
    trackEvent('Purchase', {
      value: value,
      currency: 'USD',
      content_ids: contentIds,
      order_id: orderId
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase
  };
};

