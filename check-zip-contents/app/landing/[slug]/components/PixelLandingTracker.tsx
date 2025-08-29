'use client';

import { useEffect } from 'react';
import { trackEvent, generateEventId, getEnhancedUserData } from '@/lib/pixelTracking';
import { useScrollTracking } from '@/app/hooks/useScrollTracking';
import { useTimeTracking } from '@/app/hooks/useTimeTracking';

interface PixelLandingTrackerProps {
  title: string;
  price?: number;
  productId?: number | string;
  currency?: string;
}

export default function PixelLandingTracker({ title, price, productId, currency }: PixelLandingTrackerProps) {
  // Fire PageView with server+browser on landing open
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const eventId = generateEventId();

      // Browser PageView
      try {
        const fbq = (window as any).fbq;
        if (typeof fbq === 'function') {
          fbq('track', 'PageView', {
            content_name: title || 'Landing',
            content_category: 'landing_page',
            event_source_url: window.location.href
          }, { eventID: eventId });
        }
      } catch {}

      // Server PageView
      trackEvent('PageView', {
        content_name: title || 'Landing',
        content_category: 'landing_page',
        event_source_url: typeof window !== 'undefined' ? window.location.href : undefined
      }, {
        eventId,
        enableClientTracking: false,
        enableServerTracking: true
      });

      // Also treat landing hero as a product impression (ViewContent)
      const vcId = generateEventId();
      const vcData = {
        content_name: title || 'Landing Product',
        content_category: 'landing_product',
        content_ids: [productId || 'landing_product'],
        content_type: 'product',
        value: (price && price > 0) ? price : 1,
        currency: currency || 'BDT',
        num_items: 1,
        event_source_url: typeof window !== 'undefined' ? window.location.href : undefined
      } as any;
      try {
        const fbq = (window as any).fbq;
        if (typeof fbq === 'function') {
          fbq('track', 'ViewContent', vcData, { eventID: vcId });
        }
      } catch {}
      trackEvent('ViewContent', vcData, { eventId: vcId, enableClientTracking: false, enableServerTracking: true });

      // InitiateCheckout when checkout section enters viewport (basic observer)
      try {
        const obs = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const icId = generateEventId();
              const icData: any = {
                content_name: 'Checkout',
                content_category: 'landing_checkout',
                content_ids: [productId || 'landing_checkout'],
                content_type: 'checkout',
                value: (price && price > 0) ? price : 1,
                currency: currency || 'BDT',
                num_items: 1,
                event_source_url: typeof window !== 'undefined' ? window.location.href : undefined
              };
              try {
                const fbq = (window as any).fbq;
                if (typeof fbq === 'function') {
                  fbq('track', 'InitiateCheckout', icData, { eventID: icId });
                }
              } catch {}
              const userData = getEnhancedUserData();
              trackEvent('InitiateCheckout', icData, { eventId: icId, enableClientTracking: false, enableServerTracking: true, userData });
              obs.disconnect();
            }
          });
        }, { threshold: 0.2 });
        const el = document.getElementById('checkout');
        if (el) obs.observe(el);
      } catch {}
    } catch {}
  }, [title]);

  // Engagement events similar to website
  useScrollTracking('Landing');
  useTimeTracking('Landing');

  return null;
}




