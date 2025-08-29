"use client";
import { useEffect, useRef } from 'react';
import { pixelEvents, PixelEvent, generateEventId, getEnhancedUserData } from '@/lib/pixelTracking';

export const useFacebookPixelTracking = (pageName: string) => {
  const trackedEvents = useRef<Set<string>>(new Set());

  // Note: PageView tracking is centralized; ensure this hook doesn't trigger any PageView.

  // Removed scroll tracking from this hook (handled by useScrollTracking)

  // Engagement click tracking is disabled to prevent double-firing with specific CTAs

  // Removed time-on-page from this hook (handled by useTimeTracking)

  // Track search events
  const trackSearch = (searchString: string) => {
    const eventId = generateEventId();
    pixelEvents.search({
      search_string: searchString,
      content_category: 'search',
      content_type: 'search'
    }, {
      eventId: eventId,
      enableServerTracking: true
    });
  };

  // Track view content events (Product detail impressions)
  const trackViewContent = (contentData: PixelEvent) => {
    // Prevent duplicate VC for same product within a short session
    try {
      const dedupKey = `vc_${(contentData.content_ids && contentData.content_ids[0]) || contentData.content_name || 'unknown'}`;
      if (trackedEvents.current.has(dedupKey)) return;
      trackedEvents.current.add(dedupKey);
    } catch {}
    const eventId = generateEventId();

    const clientData: PixelEvent = {
      content_name: contentData.content_name || 'Product',
      content_category: contentData.content_category || 'product',
      content_ids: contentData.content_ids || [],
      content_type: contentData.content_type || 'product',
      value: contentData.value,
      currency: contentData.currency || 'BDT',
      num_items: contentData.num_items || 1,
      event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...contentData
    };

    // 1) Fire client-side first with explicit eventID to guarantee browser event
    try {
      if (typeof window !== 'undefined') {
        const fbq = (window as any).fbq;
        if (typeof fbq === 'function') {
          fbq('track', 'ViewContent', clientData, { eventID: eventId });
          try { console.log('🎯 Direct fbq ViewContent tracked', { eventId, name: clientData.content_name }); } catch {}
        }
      }
    } catch {}

    // 2) Fire server-side with the SAME eventId for deduplication and to send IP/UA
    pixelEvents.viewContent(clientData, {
      eventId: eventId,
      enableServerTracking: true,
      enableClientTracking: false // already sent above
    });
  };

  // Track add to cart events (client fbq + server CAPI with enhanced user data)
  const trackAddToCart = (cartData: PixelEvent) => {
    const eventId = generateEventId();

    const clientData: PixelEvent = {
      content_name: cartData.content_name || 'Product',
      content_category: cartData.content_category || 'product',
      content_ids: cartData.content_ids || [],
      content_type: cartData.content_type || 'product',
      value: cartData.value,
      currency: cartData.currency || 'BDT',
      num_items: cartData.num_items || 1,
      event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...cartData
    };

    // 1) Browser event
    try {
      if (typeof window !== 'undefined') {
        const fbq = (window as any).fbq;
        if (typeof fbq === 'function') {
          fbq('track', 'AddToCart', clientData, { eventID: eventId });
          try { console.log('🛒 Direct fbq AddToCart tracked', { eventId }); } catch {}
        }
      }
    } catch {}

    // 2) Server event with same ID and enhanced user data
    const userData = getEnhancedUserData();
    pixelEvents.addToCart(clientData, {
      eventId: eventId,
      enableServerTracking: true,
      enableClientTracking: false,
      deduplicationWindow: 60000,
      userData
    });
  };

  // Track initiate checkout events (use same pattern: client fbq + server CAPI with same eventId)
  const trackInitiateCheckout = (checkoutData: PixelEvent) => {
    const eventId = generateEventId();

    const clientData: PixelEvent = {
      content_name: checkoutData.content_name || 'Checkout',
      content_category: checkoutData.content_category || 'checkout',
      content_ids: checkoutData.content_ids || [],
      content_type: checkoutData.content_type || 'checkout',
      value: checkoutData.value,
      currency: checkoutData.currency || 'BDT',
      num_items: checkoutData.num_items || 1,
      event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...checkoutData
    };

    // 1) Browser event with explicit event ID
    try {
      if (typeof window !== 'undefined') {
        const fbq = (window as any).fbq;
        if (typeof fbq === 'function') {
          fbq('track', 'InitiateCheckout', clientData, { eventID: eventId });
          try { console.log('🎯 Direct fbq InitiateCheckout tracked', { eventId }); } catch {}
        }
      }
    } catch {}

    // 2) Server event with same event ID and enhanced user data (email/phone/external_id etc.)
    const userData = getEnhancedUserData();
    pixelEvents.initiateCheckout(clientData, {
      eventId: eventId,
      enableServerTracking: true,
      enableClientTracking: false,
      userData
    });
  };

  // Track purchase events (client fbq + server CAPI, merged user data)
  const trackPurchase = (
    purchaseData: PixelEvent,
    userData?: { email?: string; phone?: string; external_id?: string; fb_login_id?: string; first_name?: string; last_name?: string; city?: string; country?: string; gender?: string; dob?: string }
  ) => {
    const eventId = generateEventId();

    const clientData: PixelEvent = {
      content_name: purchaseData.content_name || 'Purchase',
      content_category: purchaseData.content_category || 'purchase',
      content_ids: purchaseData.content_ids || [],
      content_type: purchaseData.content_type || 'order',
      value: purchaseData.value,
      currency: purchaseData.currency || 'BDT',
      num_items: purchaseData.num_items || 1,
      order_id: purchaseData.order_id,
      event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...purchaseData
    };

    // 1) Browser event
    try {
      if (typeof window !== 'undefined') {
        const fbq = (window as any).fbq;
        if (typeof fbq === 'function') {
          fbq('track', 'Purchase', clientData, { eventID: eventId });
          try { console.log('💰 Direct fbq Purchase tracked', { eventId }); } catch {}
        }
      }
    } catch {}

    // 2) Server event with same ID and merged user data
    const enhanced = { ...getEnhancedUserData(), ...(userData || {}) };
    pixelEvents.purchase(clientData, {
      eventId: eventId,
      enableServerTracking: true,
      enableClientTracking: false,
      userData: enhanced
    });
  };

  // Track lead events
  const trackLead = (leadData: PixelEvent) => {
    const eventId = generateEventId();
    pixelEvents.lead({
      content_name: leadData.content_name || 'Lead',
      content_category: leadData.content_category || 'lead',
      content_type: leadData.content_type || 'lead',
      value: leadData.value,
      currency: leadData.currency || 'BDT',
      ...leadData
    }, {
      eventId: eventId,
      enableServerTracking: true // Enable server-side tracking
    });
  };

  // Track complete registration events
  const trackCompleteRegistration = (registrationData: PixelEvent) => {
    const eventId = generateEventId();
    pixelEvents.completeRegistration({
      content_name: registrationData.content_name || 'Registration',
      content_category: registrationData.content_category || 'registration',
      content_type: registrationData.content_type || 'registration',
      value: registrationData.value,
      currency: registrationData.currency || 'BDT',
      ...registrationData
    }, {
      eventId: eventId,
      enableServerTracking: true // Enable server-side tracking
    });
  };

  // Track contact events
  const trackContact = (contactData: PixelEvent) => {
    const eventId = generateEventId();
    pixelEvents.contact({
      content_name: contactData.content_name || 'Contact',
      content_category: contactData.content_category || 'contact',
      content_type: contactData.content_type || 'contact',
      value: contactData.value,
      currency: contactData.currency || 'BDT',
      ...contactData
    }, {
      eventId: eventId,
      enableServerTracking: true // Enable server-side tracking
    });
  };

  // Track add to wishlist events
  const trackAddToWishlist = (wishlistData: PixelEvent) => {
    const eventId = generateEventId();
    pixelEvents.addToWishlist({
      content_name: wishlistData.content_name || 'Product',
      content_category: wishlistData.content_category || 'product',
      content_ids: wishlistData.content_ids || [],
      content_type: wishlistData.content_type || 'product',
      value: wishlistData.value,
      currency: wishlistData.currency || 'BDT',
      num_items: wishlistData.num_items || 1,
      ...wishlistData
    }, {
      eventId: eventId,
      enableServerTracking: true // Enable server-side tracking
    });
  };

  // Track customize product events
  const trackCustomizeProduct = (customizeData: PixelEvent) => {
    const eventId = generateEventId();
    pixelEvents.customizeProduct({
      content_name: customizeData.content_name || 'Product',
      content_category: customizeData.content_category || 'product',
      content_ids: customizeData.content_ids || [],
      content_type: customizeData.content_type || 'product',
      value: customizeData.value,
      currency: customizeData.currency || 'BDT',
      num_items: customizeData.num_items || 1,
      ...customizeData
    }, {
      eventId: eventId,
      enableServerTracking: true // Enable server-side tracking
    });
  };

  return {
    trackSearch,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    trackLead,
    trackCompleteRegistration,
    trackContact,
    trackAddToWishlist,
    trackCustomizeProduct
  };
};
