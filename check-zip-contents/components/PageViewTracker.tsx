'use client';

import { useEffect, useRef } from 'react';
import { generateEventId, trackEvent } from '@/lib/pixelTracking';

export default function PageViewTracker() {
  const lastPathRef = useRef<string | null>(null);
  const firingRef = useRef<boolean>(false);

  useEffect(() => {
    const fire = async () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname + window.location.search;
      if (firingRef.current) return;
      // Allow re-fire when only hash changes or when previous PV failed
      if (lastPathRef.current === path) {
        // but still ensure at least one PV per path per 30s (lock)
        try {
          const lockKey = `pv_lock_${path}`;
          const ts = window.localStorage.getItem(lockKey);
          if (ts && Date.now() - parseInt(ts) < 30000) return;
        } catch {}
      }
      // Local lock to avoid multiple fires within 30s for same path
      let lockKey = `pv_lock_${path}`;
      try {
        const ts = window.localStorage.getItem(lockKey);
        if (ts && Date.now() - parseInt(ts) < 30000) return;
      } catch {}
      firingRef.current = true;

      const eventId = generateEventId();
      const data = {
        content_name: document?.title || 'Page',
        content_category: 'page',
        content_type: 'page',
        value: 0,
        currency: 'BDT',
        content_ids: [`page_${(window.location.pathname || '/').replace(/[^a-zA-Z0-9_-]/g,'_') || 'homepage'}`],
        num_items: 1,
        event_source_url: window.location.href
      } as any;

      // Single, unified tracking (browser + server) with dedup + userData handled internally
      const fireOnceReady = async () => {
        const isReady = typeof (window as any).fbq === 'function' || (window as any).__fbqInitialized;
        if (!isReady) return false;
        try {
          const res = await trackEvent('PageView', data, { eventId, enableClientTracking: true, enableServerTracking: true });
          if (res?.success) {
            try { window.localStorage.setItem(lockKey, String(Date.now())); } catch {}
            return true;
          }
        } catch {}
        return false;
      };

      let ok = await fireOnceReady();
      if (!ok) {
        // Retry with backoff until Pixel is ready
        for (let i = 0; i < 6 && !ok; i++) {
          await new Promise(r => setTimeout(r, 150 * (i + 1)));
          ok = await fireOnceReady();
        }
        if (!ok) {
          // Last resort: fire server-only to avoid total miss
          try { await trackEvent('PageView', data, { eventId: generateEventId(), enableClientTracking: false, enableServerTracking: true }); } catch {}
        }
      }

      lastPathRef.current = path;
      firingRef.current = false;
    };

    fire();

    const origPush = history.pushState;
    const origReplace = history.replaceState;
    const onChange = () => setTimeout(fire, 0);
    history.pushState = function(...args) { const r = origPush.apply(this, args as any); onChange(); return r; } as any;
    history.replaceState = function(...args) { const r = origReplace.apply(this, args as any); onChange(); return r; } as any;
    window.addEventListener('popstate', onChange);
    window.addEventListener('hashchange', onChange);
    // Remove visibilitychange to avoid extra PVs on tab switch

    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener('hashchange', onChange);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);

  return null;
}


