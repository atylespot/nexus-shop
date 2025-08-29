declare global {
  interface Window {
    __fbqInitialized?: boolean;
    __pixelEventMemo?: Record<string, number>;
  }
}

export function initPixels({ fbPixelId, ttPixelId }:{ fbPixelId?: string; ttPixelId?: string }) {
  if (fbPixelId && typeof window !== "undefined") {
    if (!(window as any).__fbqInitialized) {
      !(function (f,b,e,v,n?,t?,s?) {
        if (f.fbq) return; n = f.fbq = function(){ n.callMethod? n.callMethod.apply(n, arguments): n.queue.push(arguments) };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
        t = b.createElement(e); t.async = true; t.src = "https://connect.facebook.net/en_US/fbevents.js";
        s = b.getElementsByTagName(e)[0]; s.parentNode!.insertBefore(t,s);
      })(window, document, "script");
      (window as any).fbq("init", fbPixelId);
      (window as any).__fbqInitialized = true;
    }
  }

  if (ttPixelId && typeof window !== "undefined") {
    (function(w:any,d:any,t:string){
      w.TiktokAnalyticsObject=t; var ttq=w[t]=w[t]||[];
      ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
      ttq.setAndDefer=function(t:any,e:string){t[e]=function(){t.push([e].concat([].slice.call(arguments,0)))}};
      for(var i=0;i<ttq.methods.length;i++) ttq.setAndDefer(ttq,ttq.methods[i]);
      ttq.load=function(e:string){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
      var a=d.createElement("script"); a.async=true; a.src=i; var s=d.getElementsByTagName("script")[0]; s.parentNode!.insertBefore(a,s); ttq._i=ttq._i||{}; ttq._i[e]=[]; };
      ttq.load(ttPixelId);
    })(window, document, "ttq");
  }
}

// Helpers to read browser values for CAPI duplication
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift();
  return undefined;
}

function getFbc(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const url = new URL(window.location.href);
  const fbclid = url.searchParams.get('fbclid');
  if (!fbclid) return getCookie('_fbc');
  const timestamp = Math.floor(Date.now()/1000);
  return `fb.1.${timestamp}.${fbclid}`;
}

export type PixelEvent = {
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
};

export function generateEventId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `${ts}-${rand}`;
}

export async function trackEvent(eventName: string, data?: PixelEvent, eventId?: string, attempt: number = 0) {
  const id = eventId || generateEventId();
  if (typeof window !== 'undefined') {
    window.__pixelEventMemo = window.__pixelEventMemo || {};
    const key = `${eventName}:${JSON.stringify(data || {})}`;
    const now = Date.now();
    const last = window.__pixelEventMemo[key] || 0;
    // de-duplicate same event payload within 1 second window
    if (now - last < 1000) return;
    window.__pixelEventMemo[key] = now;
  }
  try {
    if (typeof window !== 'undefined') {
      const fbq = (window as any).fbq;
      if (fbq) {
        fbq('track', eventName, data || {}, { eventID: id });
      } else if (attempt < 10) {
        // wait for fbq to be initialized by Analytics/initPixels
        setTimeout(() => { trackEvent(eventName, data, id, attempt + 1); }, 200);
      }
    }
  } catch {}

  try {
    // Duplicate to server-side CAPI
    if (typeof fetch !== 'undefined') {
      const enhancedData = {
        ...data,
        event_source_url: data?.event_source_url || window.location.href,
        contents: data?.contents || (data?.content_ids && data?.num_items ? [{
          id: data.content_ids[0],
          quantity: data.num_items,
          item_price: data.value ? data.value / data.num_items : undefined
        }] : undefined)
      };

      await fetch('/api/fb-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: eventName,
          event_id: id,
          user_data: {
            ua: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            fbp: getCookie('_fbp'),
            fbc: getFbc(),
            // Avoid undefined sha256 on client; let server hash if email/phone provided later
          },
          custom_data: enhancedData
        })
      });
    }
  } catch {}
}

