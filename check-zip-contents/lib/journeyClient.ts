"use client";

import { getStableUserIdentifier } from '@/lib/pixelTracking';

type JourneyStatus = 'view' | 'checkout_form' | 'checkout_filled';

interface BasePayload {
  source: 'website' | 'landing_page';
  pageType?: 'product' | 'checkout' | 'landing_product' | 'landing_checkout';
  status: JourneyStatus;
  sessionId?: string;
  customerName?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  district?: string | null;
  thana?: string | null;
  productId?: number | string | null;
  productName?: string | null;
  productImage?: string | null;
  landingPageId?: number | null;
  landingPageSlug?: string | null;
}

const debounceStore: Record<string, number> = {};

function debounceKey(payload: Partial<BasePayload>) {
  const sid = payload.sessionId || 'anon';
  const p = payload.pageType || 'unknown';
  const s = payload.status || 'view';
  const pid = payload.productId || '';
  return `${sid}_${p}_${s}_${pid}`;
}

export async function logJourney(payload: Partial<BasePayload>, debounceMs = 800) {
  try {
    const sessionId = getStableUserIdentifier() || undefined;
    const body: any = { ...payload, sessionId };
    const key = debounceKey(body);
    const now = Date.now();
    const last = debounceStore[key] || 0;
    if (now - last < debounceMs) return; // debounce
    debounceStore[key] = now;
    const res = await fetch('/api/customer-journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      try { console.warn('Journey log failed', await res.json()); } catch { console.warn('Journey log failed'); }
    }
  } catch {}
}

export function useJourneyLogger(config: { source: 'website' | 'landing_page'; pageType?: BasePayload['pageType']; defaultProduct?: { id?: number | string; name?: string; image?: string }; landing?: { id?: number; slug?: string } }) {
  const sessionId = getStableUserIdentifier() || undefined;

  const base: Partial<BasePayload> = {
    source: config.source,
    pageType: config.pageType,
    sessionId,
    productId: config.defaultProduct?.id ?? null,
    productName: config.defaultProduct?.name ?? null,
    productImage: config.defaultProduct?.image ?? null,
    landingPageId: config.landing?.id ?? null,
    landingPageSlug: config.landing?.slug ?? null
  };

  return {
    logView: async (fields?: Partial<BasePayload>, debounceMs?: number) => logJourney({ ...base, status: 'view', ...(fields || {}) }, debounceMs ?? 800),
    logCheckoutForm: async (fields?: Partial<BasePayload>, debounceMs?: number) => logJourney({ ...base, status: 'checkout_form', ...(fields || {}) }, debounceMs ?? 800),
    logCheckoutFilled: async (fields: Partial<BasePayload>, debounceMs?: number) => logJourney({ ...base, status: 'checkout_filled', ...fields }, debounceMs ?? 800),
  };
}


