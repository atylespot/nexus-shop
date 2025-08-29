'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent, generateEventId } from '@/lib/pixelTracking';
import { useScrollTracking } from '@/app/hooks/useScrollTracking';
import { useTimeTracking } from '@/app/hooks/useTimeTracking';

export default function PageViewTracker() {
  const pathname = usePathname();

  // Fire PageView with server+browser on page load and route changes
  useEffect(() => {
    // Only run on client side to ensure proper event ID generation
    if (typeof window === 'undefined') return;

    try {
      // Determine content category based on pathname
      let contentCategory = 'page';
      let contentName = pathname;

      if (pathname.startsWith('/products')) {
        contentCategory = 'product';
        contentName = 'Product Page';
      } else if (pathname.startsWith('/categories')) {
        contentCategory = 'category';
        contentName = 'Category Page';
      } else if (pathname === '/') {
        contentName = 'Home Page';
      } else if (pathname === '/cart') {
        contentName = 'Cart Page';
        contentCategory = 'cart';
      } else if (pathname === '/checkout') {
        contentName = 'Checkout Page';
        contentCategory = 'checkout';
      } else if (pathname === '/search') {
        contentName = 'Search Page';
        contentCategory = 'search';
      } else if (pathname === '/about') {
        contentName = 'About Page';
      } else if (pathname === '/contact') {
        contentName = 'Contact Page';
      }

      // Generate event ID on client side first for proper deduplication
      const eventId = generateEventId();

      // Try direct fbq first
      let fbqSucceeded = false;
      try {
        const fbq = (window as any).fbq;
        if (typeof fbq === 'function') {
          fbq('track', 'PageView', {
            content_name: contentName,
            content_category: contentCategory,
            event_source_url: window.location.href
          }, { eventID: eventId });
          fbqSucceeded = true;
          console.log('🎯 Direct fbq PageView tracked:', { eventId, contentName });
        }
      } catch (error) {
        console.warn('Direct fbq PageView failed:', error);
      }

      // Server call with fallback client tracking if fbq wasn't ready
      trackEvent('PageView', {
        content_name: contentName,
        content_category: contentCategory,
        event_source_url: typeof window !== 'undefined' ? window.location.href : undefined
      }, {
        eventId: eventId,
        enableClientTracking: !fbqSucceeded, // queue and retry if fbq not ready
        enableServerTracking: true
      });
    } catch (error) {
      console.warn('PageView tracking error:', error);
    }
  }, [pathname]);

  // Engagement events for storefront
  useScrollTracking('Website');
  useTimeTracking('Website');

  return null;
}
