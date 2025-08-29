'use client';

import { useEffect } from 'react';
import { initFacebookPixel, trackEvent, generateEventId, getStableUserIdentifier } from '@/lib/pixelTracking';
import { fetchAndCacheSiteSettings } from '@/lib/siteSettingsClient';

export default function PixelBootstrap() {
  useEffect(() => {
    let aborted = false;
    if (typeof window !== 'undefined') {
      (window as any).__pageviewFired = (window as any).__pageviewFired || false;
    }
    (async () => {
      try {
        // Hydrate local settings from server so any browser sees Admin changes
        try { await fetchAndCacheSiteSettings(); } catch {}
        const res = await fetch('/api/settings/pixels', { cache: 'no-store' });
        if (!res.ok) return;
        const s = await res.json();
        const envPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID as string | undefined;
        const envTestCode = process.env.NEXT_PUBLIC_FB_TEST_EVENT_CODE as string | undefined;
        const pixelId: string | undefined = s?.fbPixelId || envPixelId || undefined;
        const testEventCode: string | undefined = s?.fbTestEventCode || envTestCode || undefined;
        if (!aborted && pixelId) {
          try { console.log('✅ Initializing Meta Pixel with ID:', pixelId); } catch {}
          // Prepare advanced matching from local storage (no email field in BD market; use phone/external_id)
          let advanced: { em?: string; ph?: string; external_id?: string } | undefined = undefined;
          try {
            const ph = typeof window !== 'undefined' ? window.localStorage.getItem('pixel_phone') || undefined : undefined;
            const em = typeof window !== 'undefined' ? window.localStorage.getItem('pixel_email') || undefined : undefined;
            const external_id = getStableUserIdentifier();
            advanced = { ...(em ? { em } : {}), ...(ph ? { ph } : {}), ...(external_id ? { external_id } : {}) };
          } catch {}
          initFacebookPixel(pixelId, testEventCode, advanced);
          try {
            (window as any).__fb_pixel_id = pixelId;
            // Flush any queued events collected before fbq ready
            const pending = (window as any).__pendingPixelEvents as Array<{ name: string; data: any; eventId: string }> | undefined;
            const fbq = (window as any).fbq;
            if (pending && fbq && typeof fbq === 'function') {
              pending.forEach(evt => {
                try { fbq('track', evt.name, evt.data || {}, { eventID: evt.eventId }); } catch {}
              });
              (window as any).__pendingPixelEvents = [];
            }
          } catch {}
        }
      } catch {}
    })();
    return () => { aborted = true; };
  }, []);

  return null;
}


