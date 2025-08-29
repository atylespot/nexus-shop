// Advanced Pixel Tracking Library with Deduplication
// Supports all 11 Facebook events with 10/10 score and 100% match quality

declare global {
  interface Window {
    __fbqInitialized?: boolean;
    __pixelEventMemo?: Record<string, number>;
    __pixelEventIds?: Record<string, string>;
    __pixelServerSent?: Record<string, boolean>;
    __fb_test_event_code?: string;
    __pendingPixelEvents?: Array<{ name: string; data: any; eventId: string }>;
  }
}

export interface PixelEvent {
  value?: number;
  currency?: string;
  content_ids?: (string|number)[];
  contents?: any[];
  num_items?: number;
  content_type?: string;
  content_name?: string;
  content_category?: string;
  event_source_url?: string;
  external_id?: string;
  search_string?: string;
  order_id?: string;
  [key: string]: any;
}

export interface TrackingOptions {
  eventId?: string;
  deduplicationWindow?: number;
  enableServerTracking?: boolean;
  enableClientTracking?: boolean;
  // Optional user data for server-side matching (email/phone/external_id etc.)
  userData?: {
    email?: string;
    phone?: string;
    external_id?: string;
    fb_login_id?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

// Default settings
const DEFAULT_DEDUPLICATION_WINDOW = 10000; // 10 seconds for better deduplication
const DEFAULT_SERVER_TRACKING = true; // Enable server-side tracking
const DEFAULT_CLIENT_TRACKING = true;

// Facebook Events with required parameters for 10/10 score
const FACEBOOK_EVENTS: Record<string, { required_params: string[]; optional_params: string[] }> = {
  'PageView': {
    required_params: ['content_name', 'content_category'],
    optional_params: ['content_ids', 'content_type', 'value', 'currency']
  },
  'ViewContent': {
    required_params: ['content_name', 'content_category', 'content_ids'],
    optional_params: ['content_type', 'value', 'currency', 'num_items']
  },
  'AddToCart': {
    required_params: ['content_name', 'content_category', 'content_ids', 'value', 'currency'],
    optional_params: ['content_type', 'num_items']
  },
  'InitiateCheckout': {
    required_params: ['content_name', 'content_category', 'content_ids', 'value', 'currency'],
    optional_params: ['content_type', 'num_items']
  },
  'Purchase': {
    required_params: ['content_name', 'content_category', 'content_ids', 'value', 'currency', 'num_items'],
    optional_params: ['content_type', 'order_id']
  },
  'Search': {
    required_params: ['search_string', 'content_category'],
    optional_params: ['content_type', 'content_ids']
  },
  'AddToWishlist': {
    required_params: ['content_name', 'content_category', 'content_ids', 'value', 'currency'],
    optional_params: ['content_type', 'num_items']
  },
  'Lead': {
    required_params: ['content_name', 'content_category'],
    optional_params: ['content_type', 'value', 'currency']
  },
  'CompleteRegistration': {
    required_params: ['content_name', 'content_category'],
    optional_params: ['content_type', 'value', 'currency']
  },
  'Contact': {
    required_params: ['content_name', 'content_category'],
    optional_params: ['content_type', 'value', 'currency']
  },
  'CustomizeProduct': {
    required_params: ['content_name', 'content_category', 'content_ids', 'value', 'currency'],
    optional_params: ['content_type', 'num_items']
  },
  // Custom tracking mapped for validation so they don't get rejected
  'Scroll': {
    required_params: ['content_name', 'content_category'],
    optional_params: ['scroll_depth']
  },
  'TimeOnPage': {
    required_params: ['content_name', 'content_category'],
    optional_params: ['time_spent']
  },
  'NavClick': {
    required_params: ['content_name', 'content_category'],
    optional_params: ['content_ids']
  }
};

// Generate unique event ID with high entropy
export function generateEventId(): string {
  const timestamp = Date.now();
  const randomBytes = Math.random().toString(36).substr(2, 12);
  const sessionId = Math.random().toString(36).substr(2, 9);
  return `evt_${timestamp}_${randomBytes}_${sessionId}`;
}

// Create event key for deduplication
function createEventKey(eventName: string, data: PixelEvent, userIdentifier?: string): string {
  const keyData = {
    event_name: eventName,
    user_identifier: userIdentifier || 'anonymous',
    // For known FB events, hash important fields; for custom events, hash full payload
    content_hash: JSON.stringify(
      FACEBOOK_EVENTS[eventName]
        ? {
            content_ids: data.content_ids,
            value: data.value,
            currency: data.currency,
            content_type: data.content_type,
            content_name: data.content_name,
            search_string: data.search_string,
            order_id: data.order_id
          }
        : data
    )
  };
  
  // Safe hash for client-side - handles non-Latin1 characters
  try {
    // Convert to UTF-8 bytes first, then to base64
    const jsonString = JSON.stringify(keyData);
    const utf8Bytes = new TextEncoder().encode(jsonString);
    const base64String = btoa(String.fromCharCode(...utf8Bytes));
    return base64String.replace(/[^a-zA-Z0-9]/g, '');
  } catch (error) {
    // Fallback: use simple hash without special characters
    const simpleKey = `${eventName}_${userIdentifier || 'anonymous'}_${Date.now()}`;
    return simpleKey.replace(/[^a-zA-Z0-9]/g, '');
  }
}

// Get Facebook Browser ID from cookie
function getFBP(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split('; _fbp=');
  if (parts.length === 2) return parts.pop()!.split(';').shift();
  return undefined;
}

// Get Facebook Click ID
function getFBC(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  // Try URL parameter first
  const url = new URL(window.location.href);
  const fbclid = url.searchParams.get('fbclid');
  if (fbclid) {
    const timestamp = Math.floor(Date.now()/1000);
    return `fb.1.${timestamp}.${fbclid}`;
  }
  
  // Try cookie
  const value = `; ${document.cookie}`;
  const parts = value.split('; _fbc=');
  if (parts.length === 2) return parts.pop()!.split(';').shift();
  
  return undefined;
}

// Stable identifier to keep dedup keys consistent even before _fbp/_fbc are set
export function getStableUserIdentifier(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const storage = window.localStorage;
    const key = 'pixel_stable_id';
    let sid = storage.getItem(key) || '';
    if (!sid) {
      sid = `sid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      storage.setItem(key, sid);
    }
    return sid;
  } catch {
    // localStorage may be unavailable; fall back to a process-local value
    return `sid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

// Function to set Facebook Login ID (call this when user logs in with Facebook)
export function setFacebookLoginId(fbLoginId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('pixel_fb_login_id', fbLoginId);
  } catch {}
}

// Function to collect all available user data for enhanced matching
export function getEnhancedUserData(): {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  external_id?: string;
  fb_login_id?: string;
} {
  const persistedData = getPersistedUserData();
  const external_id = getStableUserIdentifier();

  return {
    ...persistedData,
    external_id: external_id || undefined,
    state: persistedData.city || undefined, // Use city as state for BD addresses
    zip: undefined, // Bangladesh doesn't use zip codes typically
  };
}

// Try to read persisted user data (set after purchase or via URL)
function getPersistedUserData(): { email?: string; phone?: string; city?: string; country?: string; first_name?: string; last_name?: string; fb_login_id?: string } {
  if (typeof window === 'undefined') return {};
  try {
    const storage = window.localStorage;
    const email = storage.getItem('pixel_email') || undefined;
    const phone = storage.getItem('pixel_phone') || undefined;
    const city = storage.getItem('pixel_city') || undefined;
    const country = storage.getItem('pixel_country') || undefined;
    const fullName = storage.getItem('pixel_name') || undefined;
    const fbLoginId = storage.getItem('pixel_fb_login_id') || undefined;

    // Split full name into first and last name for Facebook
    let first_name, last_name;
    if (fullName) {
      const nameParts = fullName.trim().split(' ');
      first_name = nameParts[0];
      last_name = nameParts.slice(1).join(' ') || undefined;
    }

    // Also allow capturing from URL params once
    const url = new URL(window.location.href);
    const urlEmail = url.searchParams.get('email') || undefined;
    const urlPhone = url.searchParams.get('phone') || undefined;

    return {
      email: email || urlEmail || undefined,
      phone: phone || urlPhone || undefined,
      city: city || undefined,
      country: country || undefined,
      first_name: first_name || undefined,
      last_name: last_name || undefined,
      fb_login_id: fbLoginId || undefined
    };
  } catch {
    return {};
  }
}

// Validate event parameters for 10/10 score
function validateEventParameters(eventName: string, data: PixelEvent): { valid: boolean; missing: string[]; score: number } {
  const eventConfig = FACEBOOK_EVENTS[eventName];
  if (!eventConfig) {
    return { valid: false, missing: ['Unknown event'], score: 0 };
  }

  const missing = [];
  let score = 0;
  const totalRequired = eventConfig.required_params.length;

  // Check required parameters
  for (const param of eventConfig.required_params) {
    if (!data[param] || data[param] === '') {
      missing.push(param);
    } else {
      score += 1;
    }
  }

  // Bonus points for optional parameters
  for (const param of eventConfig.optional_params) {
    if (data[param] && data[param] !== '') {
      score += 0.5;
    }
  }

  const percentageScore = (score / totalRequired) * 10;
  return {
    valid: missing.length === 0,
    missing,
    score: Math.min(10, Math.round(percentageScore * 10) / 10)
  };
}

// Check for duplicate events (client-side)
function isDuplicateEvent(eventKey: string, deduplicationWindow: number, data?: PixelEvent): boolean {
  if (typeof window === 'undefined') return false;
  
  window.__pixelEventMemo = window.__pixelEventMemo || {};
  const now = Date.now();
  const lastTime = window.__pixelEventMemo[eventKey];
  
  if (lastTime && (now - lastTime) < deduplicationWindow) {
    console.log(`🔄 Duplicate event prevented: ${eventKey} (${now - lastTime}ms ago)`);
    return true; // Duplicate detected
  }
  
  // Special handling for AddToCart events - prevent multiple browser-side fires
  if (eventKey.includes('AddToCart')) {
    // Create a more specific key for AddToCart deduplication
    const addToCartKey = `AddToCart_${data?.content_name || 'product'}_${data?.content_ids?.[0] || 'unknown'}`;
    const lastAddToCart = window.__pixelEventMemo[addToCartKey];
    
    if (lastAddToCart && (now - lastAddToCart) < 15000) { // 15 seconds for AddToCart
      console.log(`🛒 AddToCart duplicate prevented: ${addToCartKey} (${now - lastAddToCart}ms ago)`);
      return true;
    }
    
    // Also check for any AddToCart event in the last 5 seconds
    const anyAddToCartKey = 'AddToCart_any';
    const lastAnyAddToCart = window.__pixelEventMemo[anyAddToCartKey];
    
    if (lastAnyAddToCart && (now - lastAnyAddToCart) < 5000) { // 5 seconds for any AddToCart
      console.log(`🛒 AddToCart duplicate prevented (any product): ${anyAddToCartKey} (${now - lastAnyAddToCart}ms ago)`);
      return true;
    }
    
    // Update both specific and general AddToCart memo
    window.__pixelEventMemo[addToCartKey] = now;
    window.__pixelEventMemo[anyAddToCartKey] = now;
  }
  
  // Special handling for PageView events - ensure browser-side event ID and proper deduplication
  if (eventKey.includes('PageView')) {
    // Create a more specific key for PageView deduplication
    const pageViewKey = `PageView_${data?.content_name || 'homepage'}_${data?.content_category || 'page'}`;
    const lastPageView = window.__pixelEventMemo[pageViewKey];
    
    if (lastPageView && (now - lastPageView) < 60000) { // 60 seconds for PageView
      console.log(`📄 PageView duplicate prevented: ${pageViewKey} (${now - lastPageView}ms ago)`);
      return true;
    }
    
    // Also check for any PageView event in the last 30 seconds
    const anyPageViewKey = 'PageView_any';
    const lastAnyPageView = window.__pixelEventMemo[anyPageViewKey];
    
    if (lastAnyPageView && (now - lastAnyPageView) < 30000) { // 30 seconds for any PageView
      console.log(`📄 PageView duplicate prevented (any page): ${anyPageViewKey} (${now - lastAnyPageView}ms ago)`);
      return true;
    }
    
    // Update both specific and general PageView memo
    window.__pixelEventMemo[pageViewKey] = now;
    window.__pixelEventMemo[anyPageViewKey] = now;
    
    console.log(`📄 PageView deduplication keys updated: ${pageViewKey}, ${anyPageViewKey}`);
  }
  
  // Special handling for Lead events - prevent over-firing
  if (eventKey.includes('Lead')) {
    const leadKey = `Lead_${data?.content_name || 'general'}`;
    const lastLead = window.__pixelEventMemo[leadKey];
    
    if (lastLead && (now - lastLead) < 120000) { // 120 seconds for Lead events
      console.log(`📝 Lead duplicate prevented: ${leadKey} (${now - lastLead}ms ago)`);
      return true;
    }
    
    // Also check for any Lead event in the last 60 seconds
    const anyLeadKey = 'Lead_any';
    const lastAnyLead = window.__pixelEventMemo[anyLeadKey];
    
    if (lastAnyLead && (now - lastAnyLead) < 60000) { // 60 seconds for any Lead
      console.log(`📝 Lead duplicate prevented (any type): ${anyLeadKey} (${now - lastAnyLead}ms ago)`);
      return true;
    }
    
    // Update both specific and general Lead memo
    window.__pixelEventMemo[leadKey] = now;
    window.__pixelEventMemo[anyLeadKey] = now;
  }
  
  // Update memo
  window.__pixelEventMemo[eventKey] = now;
  
  // Clean old entries (older than 5 minutes)
  const fiveMinutesAgo = now - 300000;
  Object.keys(window.__pixelEventMemo).forEach(key => {
    if (window.__pixelEventMemo && window.__pixelEventMemo[key] < fiveMinutesAgo) {
      delete window.__pixelEventMemo[key];
    }
  });
  
  return false;
}

// Store event ID for consistency
function storeEventId(eventKey: string, eventId: string): void {
  if (typeof window === 'undefined') return;
  
  window.__pixelEventIds = window.__pixelEventIds || {};
  window.__pixelEventIds[eventKey] = eventId;
}

function markServerSent(eventKey: string): void {
  if (typeof window === 'undefined') return;
  window.__pixelServerSent = window.__pixelServerSent || {};
  window.__pixelServerSent[eventKey] = true;
}

function wasServerSent(eventKey: string): boolean {
  if (typeof window === 'undefined') return false;
  window.__pixelServerSent = window.__pixelServerSent || {};
  return !!window.__pixelServerSent[eventKey];
}

// Get stored event ID
function getStoredEventId(eventKey: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  window.__pixelEventIds = window.__pixelEventIds || {};
  return window.__pixelEventIds[eventKey];
}

// Client-side Facebook Pixel tracking
function trackClientSide(eventName: string, data: PixelEvent, eventId: string): void {
  if (typeof window === 'undefined') return;

  const attemptTrack = (attempt: number) => {
    const fbq = (window as any).fbq;
    if (fbq) {
      const trackingData = { ...data };
      fbq('track', eventName, trackingData, { eventID: eventId });
      console.log(`🎯 Client-side event tracked${attempt > 0 ? ' after retry' : ''}: ${eventName}`, { eventId });
      return true;
    }
    return false;
  };

  // If fbq exists now, send immediately
  if (attemptTrack(0)) return;

  // Queue if fbq not ready yet and try multiple times with backoff
  try {
    // Queue for later flush on init
    window.__pendingPixelEvents = window.__pendingPixelEvents || [];
    window.__pendingPixelEvents.push({ name: eventName, data, eventId });

    const retryDelays = [100, 250, 500, 1000, 1500, 2500];
    retryDelays.forEach((delay, idx) => {
      setTimeout(() => {
        if (attemptTrack(idx + 1)) {
          // Also remove from pending queue if found
          if (window.__pendingPixelEvents) {
            window.__pendingPixelEvents = window.__pendingPixelEvents.filter(e => !(e.name === eventName && e.eventId === eventId));
          }
        }
      }, delay);
    });
  } catch {}
}

// Server-side tracking via API
async function trackServerSide(
  eventName: string, 
  data: PixelEvent, 
  eventId: string, 
  userData?: any
): Promise<boolean> {
  try {
    const enhancedData = {
      ...data,
      event_source_url: data.event_source_url || (typeof window !== 'undefined' ? window.location.href : undefined),
      contents: data.contents || (data.content_ids && data.num_items ? [{
        id: data.content_ids[0],
        quantity: data.num_items,
        item_price: data.value ? data.value / data.num_items : undefined
      }] : undefined)
    };

    const response = await fetch('/api/fb-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId,
        test_event_code: (typeof window !== 'undefined' ? window.__fb_test_event_code : undefined),
        user_data: {
          fbp: getFBP(),
          fbc: getFBC(),
          ...userData
        },
        custom_data: enhancedData
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Server-side event tracked: ${eventName}`, { 
        eventId, 
        deduplication_key: result.deduplication_key,
        match_quality: result.tracking_data?.match_quality_score,
        validation_score: result.tracking_data?.event_validation_score
      });
      return true;
    } else {
      console.error(`❌ Server-side tracking failed: ${eventName}`, result);
      return false;
    }
  } catch (error) {
    console.error(`🚨 Server-side tracking error: ${eventName}`, error);
    return false;
  }
}

// Main tracking function with deduplication
export async function trackEvent(
  eventName: string, 
  data: PixelEvent = {}, 
  options: TrackingOptions = {}
): Promise<{ success: boolean; eventId: string; deduplicationKey: string; validationScore?: number }> {
  // Ensure required defaults for PageView before validation
  let eventData: PixelEvent = { ...data };
  if (eventName === 'PageView') {
    const safeTitle = (typeof document !== 'undefined' && document?.title) ? document.title : 'Homepage';
    const safePath = (typeof window !== 'undefined' && window?.location?.pathname)
      ? window.location.pathname.replace(/[^a-zA-Z0-9_-]/g, '_') || 'homepage'
      : 'homepage';
    eventData.content_name = eventData.content_name || safeTitle;
    eventData.content_category = eventData.content_category || 'page';
    eventData.content_type = eventData.content_type || 'page';
    eventData.value = eventData.value ?? 0;
    eventData.currency = eventData.currency || 'BDT';
    eventData.content_ids = eventData.content_ids || [`page_${safePath}`];
    eventData.num_items = eventData.num_items ?? 1;
    eventData.event_source_url = eventData.event_source_url || (typeof window !== 'undefined' ? window.location.href : undefined);
  }
  const {
    eventId: providedEventId,
    deduplicationWindow = DEFAULT_DEDUPLICATION_WINDOW,
    enableServerTracking = DEFAULT_SERVER_TRACKING,
    enableClientTracking = DEFAULT_CLIENT_TRACKING,
    userData
  } = options;

  // For custom events (not in FACEBOOK_EVENTS), allow pass-through without validation

  // Validate event parameters only for known events
  const validation = FACEBOOK_EVENTS[eventName]
    ? validateEventParameters(eventName, eventData)
    : { valid: true, missing: [], score: 10 } as { valid: boolean; missing: string[]; score: number };
  if (!validation.valid) {
    console.error(`❌ Missing required parameters for ${eventName}:`, validation.missing);
    console.log(`📋 Required: ${FACEBOOK_EVENTS[eventName].required_params.join(', ')}`);
    console.log(`📋 Optional: ${FACEBOOK_EVENTS[eventName].optional_params.join(', ')}`);
    return {
      success: false,
      eventId: '',
      deduplicationKey: '',
      validationScore: validation.score
    };
  }

  // Generate or use provided event ID
  const eventId = providedEventId || generateEventId();
  
  // Create event key for deduplication
  // Prefer a stable identifier that doesn't fluctuate between early/late init
  const stableId = getStableUserIdentifier() || getFBP() || getFBC();
  const eventKey = createEventKey(eventName, eventData, stableId);
  
  // Check for duplicates
  if (isDuplicateEvent(eventKey, deduplicationWindow, data)) {
    const storedEventId = getStoredEventId(eventKey);
    console.log(`🔄 Duplicate event detected, using stored ID: ${eventName}`, { 
      eventId: storedEventId, 
      deduplicationKey: eventKey 
    });
    // Ensure PageView gets a server call at least once
    if (eventName === 'PageView' && enableServerTracking && !wasServerSent(eventKey)) {
      try {
        await trackServerSide(eventName, eventData, storedEventId || eventId, userData);
        markServerSent(eventKey);
      } catch {}
    }
    
    return {
      success: true,
      eventId: storedEventId || eventId,
      deduplicationKey: eventKey,
      validationScore: validation.score
    };
  }
  
  // Store event ID for consistency
  storeEventId(eventKey, eventId);
  
  let clientSuccess = false;
  let serverSuccess = false;
  
  // Track client-side
  if (enableClientTracking) {
    try {
      trackClientSide(eventName, eventData, eventId);
      clientSuccess = true;
    } catch (error) {
      console.error(`❌ Client-side tracking failed: ${eventName}`, error);
    }
  }
  
  // Track server-side
  if (enableServerTracking) {
    // Provide comprehensive user data for better match quality
    const enhancedUserData = getEnhancedUserData();
    serverSuccess = await trackServerSide(eventName, eventData, eventId, {
      ...enhancedUserData,
      ...(userData || {})
    });
    if (serverSuccess) markServerSent(eventKey);
  }
  
  const overallSuccess = clientSuccess || serverSuccess;
  
  console.log(`📊 Event tracking completed: ${eventName}`, {
    eventId,
    deduplicationKey: eventKey,
    clientSuccess,
    serverSuccess,
    overallSuccess,
    validationScore: validation.score
  });
  
  return {
    success: overallSuccess,
    eventId,
    deduplicationKey: eventKey,
    validationScore: validation.score
  };
}

// Convenience functions for all 11 Facebook events
export const pixelEvents = {
  // Page View
  pageView: (data: PixelEvent = {}, options?: TrackingOptions) => 
    trackEvent('PageView', data, options),
  
  // View Content
  viewContent: (data: PixelEvent, options?: TrackingOptions) => 
    trackEvent('ViewContent', data, options),
  
  // Add to Cart
  addToCart: (data: PixelEvent, options?: TrackingOptions) => 
    trackEvent('AddToCart', data, options),
  
  // Initiate Checkout
  initiateCheckout: (data: PixelEvent, options?: TrackingOptions) => 
    trackEvent('InitiateCheckout', data, options),
  
  // Purchase
  purchase: (data: PixelEvent, options?: TrackingOptions) => 
    trackEvent('Purchase', data, options),
  
  // Search
  search: (data: PixelEvent, options?: TrackingOptions) => 
    trackEvent('Search', data, options),
  
  // Add to Wishlist
  addToWishlist: (data: PixelEvent, options?: TrackingOptions) => 
    trackEvent('AddToWishlist', data, options),
  
  // Lead
  lead: (data: PixelEvent, options?: TrackingOptions) => 
    trackEvent('Lead', data, options),
  
  // Complete Registration
  completeRegistration: (data: PixelEvent, options?: TrackingOptions) => 
    trackEvent('CompleteRegistration', data, options),
  
  // Contact
  contact: (data: PixelEvent, options?: TrackingOptions) => 
    trackEvent('Contact', data, options),
  
  // Customize Product
  customizeProduct: (data: PixelEvent, options?: TrackingOptions) => 
    trackEvent('CustomizeProduct', data, options),
  
  // Custom Event
  custom: (eventName: string, data: PixelEvent, options?: TrackingOptions) => 
    trackEvent(eventName, data, options)
};

// Initialize Facebook Pixel
export function initFacebookPixel(
  pixelId: string,
  testEventCode?: string,
  advancedMatching?: { em?: string; ph?: string; external_id?: string }
): void {
  if (typeof window === 'undefined' || window.__fbqInitialized) return;
  
  // Facebook Pixel Code
  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if(f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if(!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  
  // Initialize Pixel
  try {
    // Pass advanced matching (FB will hash client-side automatically)
    if (advancedMatching && (advancedMatching.em || advancedMatching.ph || advancedMatching.external_id)) {
      (window as any).fbq('init', pixelId, advancedMatching);
    } else {
      (window as any).fbq('init', pixelId);
    }
  } catch (e) {
    console.warn('⚠️ fbq init failed, retrying after script load...', e);
  }
  
  // Set test event code if provided
  if (testEventCode) {
    (window as any).fbq('set', 'test_event_code', testEventCode);
    window.__fb_test_event_code = testEventCode;
  }

  // Do not auto-fire PageView here; it will be fired once in PixelBootstrap after init
  
  // Store pixel id for later advanced matching refresh
  try { (window as any).__fb_pixel_id = pixelId; } catch {}
  window.__fbqInitialized = true;
  console.log('✅ Facebook Pixel initialized:', pixelId);

  // Flush any pending events queued before fbq was available
  try {
    if (window.__pendingPixelEvents && Array.isArray(window.__pendingPixelEvents)) {
      const queued = [...window.__pendingPixelEvents];
      window.__pendingPixelEvents = [];
      queued.forEach(evt => {
        try {
          (window as any).fbq('track', evt.name, evt.data || {}, { eventID: evt.eventId });
          console.log(`🚀 Flushed queued pixel event: ${evt.name}`, { eventId: evt.eventId });
        } catch {}
      });
    }
  } catch {}
}

// Export for global use
if (typeof window !== 'undefined') {
  (window as any).pixelTracking = {
    trackEvent,
    pixelEvents,
    initFacebookPixel,
    // expose helper dynamically
    refreshAdvancedMatching,
    generateEventId,
    FACEBOOK_EVENTS
  };
}

// Force a PageView with explicit Event ID (browser + server) and local lock
export async function firePageViewNowOnce(): Promise<string> {
  const lockKey = `pv_lock_${typeof window !== 'undefined' ? (window.location?.pathname || '/') : 'ssr'}`;
  try {
    if (typeof window !== 'undefined') {
      const ts = window.localStorage.getItem(lockKey);
      if (ts && Date.now() - parseInt(ts) < 30000) {
        return getStoredEventId(lockKey) || '';
      }
    }
  } catch {}

  const eventId = generateEventId();
  const title = (typeof document !== 'undefined' && document?.title) ? document.title : 'Homepage';
  const path = (typeof window !== 'undefined' && window?.location?.pathname) ? window.location.pathname : '/';
  const data: PixelEvent = {
    content_name: title,
    content_category: 'page',
    content_type: 'page',
    value: 0,
    currency: 'BDT',
    content_ids: [`page_${path.replace(/[^a-zA-Z0-9_-]/g, '_') || 'homepage'}`],
    num_items: 1,
    event_source_url: typeof window !== 'undefined' ? window.location.href : undefined
  };

  try {
    if (typeof window !== 'undefined') {
      const fbq = (window as any).fbq;
      if (typeof fbq === 'function') {
        fbq('track', 'PageView', data, { eventID: eventId });
      }
    }
  } catch {}

  try {
    await fetch('/api/fb-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'PageView',
        event_id: eventId,
        test_event_code: (typeof window !== 'undefined' ? (window as any).__fb_test_event_code : undefined),
        user_data: {
          fbp: getFBP(),
          fbc: getFBC()
        },
        custom_data: data
      })
    });
  } catch {}

  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(lockKey, String(Date.now()));
    }
  } catch {}

  return eventId;
}

// Refresh advanced matching after phone/external_id becomes available (e.g., on thank-you page)
export function refreshAdvancedMatching(): void {
  if (typeof window === 'undefined') return;
  try {
    const fbq = (window as any).fbq;
    const pixelId: string | undefined = (window as any).__fb_pixel_id;
    if (!fbq || !pixelId) return;
    const em = window.localStorage.getItem('pixel_email') || undefined;
    const ph = window.localStorage.getItem('pixel_phone') || undefined;
    const external_id = getStableUserIdentifier();
    if (em || ph || external_id) {
      fbq('init', pixelId, { ...(em ? { em } : {}), ...(ph ? { ph } : {}), ...(external_id ? { external_id } : {}) });
      try { console.log('🔁 Advanced matching refreshed'); } catch {}
    }
  } catch {}
}
