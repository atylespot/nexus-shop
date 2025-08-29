"use client";

import { useEffect, useState } from 'react';

interface Retention {
  retentionDays: number;
}

interface Offer {
  id?: number;
  scope: string; // website | landing_page | both
  enabled: boolean;
  delaySeconds: number;
  title?: string | null;
  message?: string | null;
  ctaText?: string | null;
  imageUrl?: string | null;
  productId?: number | null;
  landingPageId?: number | null;
}

export default function SettingsForm() {
  // Retention
  const [ret, setRet] = useState<Retention>({ retentionDays: 30 });
  const [savingRet, setSavingRet] = useState(false);
  // Offer
  const [offer, setOffer] = useState<Offer>({ scope: 'website', enabled: false, delaySeconds: 10, title: '', message: '', ctaText: '', imageUrl: '', productId: undefined, landingPageId: undefined });
  const [savingOffer, setSavingOffer] = useState(false);

  useEffect(() => {
    // Load retention
    (async () => {
      try {
        const r = await fetch('/api/customer-info/retention');
        if (r.ok) {
          const j = await r.json();
          setRet({ retentionDays: j.retentionDays ?? 30 });
        }
      } catch {}
    })();
    // Load offer (latest website-scope as default)
    (async () => {
      try {
        const r = await fetch('/api/customer-info/offer?scope=website');
        if (r.ok) {
          const list = await r.json();
          if (Array.isArray(list) && list.length > 0) {
            const o = list[0];
            setOffer({
              id: o.id,
              scope: o.scope || 'website',
              enabled: !!o.enabled,
              delaySeconds: o.delaySeconds ?? 10,
              title: o.title ?? '',
              message: o.message ?? '',
              ctaText: o.ctaText ?? '',
              imageUrl: o.imageUrl ?? '',
              productId: o.productId ?? undefined,
              landingPageId: o.landingPageId ?? undefined,
            });
          }
        }
      } catch {}
    })();
  }, []);

  const saveRetention = async () => {
    setSavingRet(true);
    try {
      await fetch('/api/customer-info/retention', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ret) });
    } finally { setSavingRet(false); }
  };

  const saveOffer = async () => {
    setSavingOffer(true);
    try {
      await fetch('/api/customer-info/offer', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(offer) });
    } finally { setSavingOffer(false); }
  };

  return (
    <div className="space-y-8">
      {/* Retention */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Auto-delete Journey Events</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Keep events for (days)</label>
            <input type="number" min={0} max={365} value={ret.retentionDays} onChange={e => setRet({ retentionDays: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <button onClick={saveRetention} disabled={savingRet} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">{savingRet ? 'Saving…' : 'Save Retention'}</button>
          </div>
        </div>
      </div>

      {/* Offer */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Checkout Offer (per scope/product)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Scope</label>
            <select value={offer.scope} onChange={e => setOffer({ ...offer, scope: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
              <option value="website">Website</option>
              <option value="landing_page">Landing Page</option>
              <option value="both">Both</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={offer.enabled} onChange={e => setOffer({ ...offer, enabled: e.target.checked })} />
            <span className="text-sm">Enable</span>
          </label>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Delay (seconds)</label>
            <input type="number" min={0} max={3600} value={offer.delaySeconds} onChange={e => setOffer({ ...offer, delaySeconds: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Offer Title</label>
            <input value={offer.title ?? ''} onChange={e => setOffer({ ...offer, title: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Offer Message</label>
            <input value={offer.message ?? ''} onChange={e => setOffer({ ...offer, message: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">CTA Text</label>
            <input value={offer.ctaText ?? ''} onChange={e => setOffer({ ...offer, ctaText: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Offer Image</label>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const fd = new FormData();
                fd.append('file', f);
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                if (res.ok) {
                  const j = await res.json();
                  setOffer({ ...offer, imageUrl: j.url });
                } else {
                  alert('Upload failed');
                }
              }} />
              {offer.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={offer.imageUrl} alt="offer" className="w-16 h-16 object-cover rounded border" />
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Product (Website)</label>
            <SelectProduct value={offer.productId} onChange={(v) => setOffer({ ...offer, productId: v || undefined })} disabled={offer.scope === 'landing_page'} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Landing Page</label>
            <SelectLanding value={offer.landingPageId} onChange={(v) => setOffer({ ...offer, landingPageId: v || undefined })} disabled={offer.scope === 'website'} />
          </div>
        </div>
        <div className="mt-3">
          <button onClick={saveOffer} disabled={savingOffer} className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50">{savingOffer ? 'Saving…' : 'Save Offer'}</button>
        </div>
      </div>
    </div>
  );
}

function SelectProduct({ value, onChange, disabled }: { value?: number | null; onChange: (v: number | null) => void; disabled?: boolean }) {
  const [list, setList] = useState<Array<{ id: number; name: string }>>([]);
  useEffect(() => { (async () => { try { const r = await fetch('/api/catalog/products'); if (r.ok) setList(await r.json()); } catch {} })(); }, []);
  return (
    <select disabled={disabled} value={value ?? ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded px-3 py-2 text-sm">
      <option value="">Select product…</option>
      {list.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );
}

function SelectLanding({ value, onChange, disabled }: { value?: number | null; onChange: (v: number | null) => void; disabled?: boolean }) {
  const [list, setList] = useState<Array<{ id: number; slug: string; title: string }>>([]);
  useEffect(() => { (async () => { try { const r = await fetch('/api/catalog/landing-pages'); if (r.ok) setList(await r.json()); } catch {} })(); }, []);
  return (
    <select disabled={disabled} value={value ?? ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded px-3 py-2 text-sm">
      <option value="">Select landing page…</option>
      {list.map(lp => <option key={lp.id} value={lp.id}>{lp.title || lp.slug}</option>)}
    </select>
  );
}


