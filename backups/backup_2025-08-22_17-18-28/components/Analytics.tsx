"use client";

import { useEffect, useState } from "react";
import { initPixels, trackEvent } from "@/lib/pixels";
import { usePathname, useSearchParams } from "next/navigation";

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initialized, setInitialized] = useState(false);

  // Initialize pixels once (prefer DB settings over env)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let pixelId: string | undefined = process.env.NEXT_PUBLIC_FB_PIXEL_ID as string | undefined;
        try {
          const r = await fetch('/api/settings/pixels', { cache: 'no-store' });
          if (r.ok) {
            const s = await r.json();
            if (s?.fbPixelId) pixelId = s.fbPixelId as string;
          }
        } catch {}
        if (!cancelled && pixelId) {
          initPixels({ fbPixelId: pixelId });
          setInitialized(true);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // Fire page view on route changes
  useEffect(() => {
    if (!initialized) return;
    try { 
      trackEvent("PageView", {
        event_source_url: window.location.href,
        content_type: 'page'
      }); 
    } catch {}
  }, [pathname, searchParams, initialized]);

  return null;
}


