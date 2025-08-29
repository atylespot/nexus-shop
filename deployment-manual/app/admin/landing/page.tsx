"use client";
import { useEffect, useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";

interface Product {
  id: number;
  name: string;
  slug?: string;
  image?: string;
  price?: number;
}

type Landing = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  productId: number;
  headerImage: string;
  videoUrl: string;
  productDescription: string;
  regularPrice: string;
  discountPrice: string;
  productImages: string[];
  productFeatures: string;
  customerReviews: string[];
  shippingAreas: Array<{ area: string; charge: string }>;
  freeDelivery: boolean;
  blocks: any;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  product: Product;
  ctaText?: string;
  viewCount?: number;
};

export default function LandingAdminPage() {
  const [activeTab, setActiveTab] = useState<'create'|'overview'>('create');
  const [products, setProducts] = useState<{id:number, name:string, slug?:string, image?:string, regularPrice?:number, salePrice?:number}[]>([]);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    productId: '',
    headerImage: '',
    videoUrl: '',
    ctaText: '',
    productDescription: '',
    regularPrice: '',
    discountPrice: '',
    productImages: [] as string[],
    productFeatures: '',
    customerReviews: [] as string[],
    shippingAreas: [{ area: 'ঢাকার ভিতরে', charge: '80' }],
    freeDelivery: false,
    paymentMethod: 'cash_on_delivery',
    variantConfig: { mode: 'none', colors: [] as Array<{ color: string; sizes: string[] }> }
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<Landing[]>([]);
  const [productOpen, setProductOpen] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [generatingSubtitle, setGeneratingSubtitle] = useState(false);
  const [titleProgress, setTitleProgress] = useState(0);
  const [subtitleProgress, setSubtitleProgress] = useState(0);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [descriptionProgress, setDescriptionProgress] = useState(0);
  const [generatingFeatures, setGeneratingFeatures] = useState(false);
  const [featuresProgress, setFeaturesProgress] = useState(0);
  const [editing, setEditing] = useState<Landing | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    subtitle: '',
    productId: '',
    headerImage: '',
    videoUrl: '',
    ctaText: '',
    productDescription: '',
    regularPrice: '',
    discountPrice: '',
    productImages: [] as string[],
    productFeatures: '',
    customerReviews: [] as string[],
    shippingAreas: [{ area: 'ঢাকার ভিতরে', charge: '80' }],
    freeDelivery: false,
    paymentMethod: 'cash_on_delivery',
    variantConfig: { mode: 'none', colors: [] as Array<{ color: string; sizes: string[] }> }
  });
  const [compact, setCompact] = useState(true);
  const cardPad = compact ? 'p-3' : 'p-6';
  const gridGap = compact ? 'gap-3' : 'gap-6';
  const [availableVariants, setAvailableVariants] = useState<Array<{ color: string; sizes: string[] }>>([]);

  useEffect(() => { (async () => {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        console.log('📦 Products API Response:', data);
        const productsArray = data.products || data;
        console.log('📦 Products Array:', productsArray);
        setProducts(productsArray.map((p:any)=>({
          id: parseInt(p.id),
          name: p.name,
          slug: p.slug,
          image: p.image || (p.images?.[0] ?? ''),
          regularPrice: Number(p.regularPrice ?? p.sellingPrice ?? 0),
          salePrice: p.salePrice != null ? Number(p.salePrice) : undefined
        })));
        console.log('📦 Processed Products:', productsArray.map((p:any)=>({
          id: parseInt(p.id),
          name: p.name,
          slug: p.slug,
          image: p.image || (p.images?.[0] ?? ''),
          regularPrice: Number(p.regularPrice ?? p.sellingPrice ?? 0),
          salePrice: p.salePrice != null ? Number(p.salePrice) : undefined
        })));
      }
      const r2 = await fetch('/api/landing', { cache: 'no-store' });
      if (r2.ok) setRows(await r2.json());
    } catch {}
  })();}, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Submit function called with form data:', form);
    if (!form.title || !form.productId) { alert('Please fill in Title and select a Product'); return; }
    if (!form.freeDelivery && (!form.shippingAreas || form.shippingAreas.length === 0 || form.shippingAreas.some(s => !s.area || !s.charge))) { alert('Please fill in all shipping areas and charges, or enable free delivery'); return; }
    setSaving(true);
    try {
      const response = await fetch('/api/landing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        title: form.title,
        subtitle: form.subtitle,
        productId: form.productId,
        headerImage: form.headerImage,
        videoUrl: form.videoUrl,
        ctaText: form.ctaText,
        productDescription: form.productDescription,
        regularPrice: form.regularPrice,
        discountPrice: form.discountPrice,
        productImages: form.productImages,
        productFeatures: form.productFeatures,
        customerReviews: form.customerReviews,
        shippingAreas: form.shippingAreas,
        freeDelivery: form.freeDelivery,
        variantConfig: form.variantConfig,
        paymentMethod: form.paymentMethod
      })});
      if (response.ok) {
        const created = await response.json();
        console.log('✅ Landing page created successfully:', created);
        setRows(prev=>[created, ...prev]);
        setForm({ title: '', subtitle: '', productId: '', headerImage: '', videoUrl: '', ctaText: '', productDescription: '', regularPrice: '', discountPrice: '', productImages: [], productFeatures: '', customerReviews: [], shippingAreas: [{ area: 'ঢাকার ভিতরে', charge: '80' }], freeDelivery: false, paymentMethod: 'cash_on_delivery', variantConfig: { mode: 'none', colors: [] } });
        setActiveTab('overview');
        alert('Landing page created successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ API Error:', errorData);
        alert(`Failed to create landing page: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 Submit Error:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Fetch variations for the selected product and prefill variantConfig
  useEffect(() => {
    (async () => {
      try {
        const selectedId = editing ? editForm.productId : form.productId;
        const product = products.find(p => String(p.id) === String(selectedId));
        if (!product?.slug) { setAvailableVariants([]); return; }
        const res = await fetch(`/api/products/${product.slug}`, { cache: 'no-store' });
        if (!res.ok) { setAvailableVariants([]); return; }
        const data = await res.json();
        const variations = Array.isArray(data.variations) ? data.variations : [];
        const map = new Map<string, Set<string>>();
        for (const v of variations) {
          const color = v?.color?.name || '';
          const size = v?.size?.name || '';
          if (!color && !size) continue;
          if (!map.has(color)) map.set(color, new Set<string>());
          if (size) map.get(color)!.add(size);
        }
        const tree: Array<{ color: string; sizes: string[] }> = [];
        for (const [color, sizes] of map.entries()) {
          tree.push({ color, sizes: Array.from(sizes) });
        }
        setAvailableVariants(tree);
        const prefill = { mode: 'colors-sizes', colors: tree.map(c=>({ color: c.color, sizes: [...c.sizes] })) };
        if (editing) setEditForm(prev => ({ ...prev, variantConfig: prev.variantConfig?.mode ? prev.variantConfig : prefill }));
        else setForm(prev => ({ ...prev, variantConfig: prev.variantConfig?.mode ? prev.variantConfig : prefill }));
      } catch {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.productId, editForm.productId, products.length]);

  const deleteLanding = async (id: number) => {
    if (!confirm('Are you sure you want to delete this landing page?')) return;
    try { const res = await fetch(`/api/landing/${id}`, { method: 'DELETE' }); if (res.ok) setRows(prev => prev.filter(r => r.id !== id)); } catch (error) { console.error('Error deleting landing page:', error); }
  };

  const startEdit = (landing: Landing) => {
    setEditing(landing);
    setEditForm({
      title: landing.title,
      subtitle: landing.subtitle || '',
      productId: String(landing.productId),
      headerImage: landing.headerImage || '',
      videoUrl: landing.videoUrl || '',
      ctaText: landing.ctaText || '',
      productDescription: landing.productDescription || '',
      regularPrice: landing.regularPrice || '',
      discountPrice: landing.discountPrice || '',
      productImages: landing.productImages || [],
      productFeatures: landing.productFeatures || '',
      customerReviews: landing.customerReviews || [],
      shippingAreas: landing.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }],
      freeDelivery: landing.freeDelivery || false,
      paymentMethod: (landing.blocks && (landing as any).blocks?.paymentMethod) || 'cash_on_delivery',
      variantConfig: { mode: 'none', colors: [] }
    });
    setActiveTab('create');
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditForm({ title: '', subtitle: '', productId: '', headerImage: '', videoUrl: '', ctaText: '', productDescription: '', regularPrice: '', discountPrice: '', productImages: [], productFeatures: '', customerReviews: [], shippingAreas: [{ area: 'ঢাকার ভিতরে', charge: '80' }], freeDelivery: false, paymentMethod: 'cash_on_delivery', variantConfig: { mode: 'none', colors: [] } });
    setForm({ title: '', subtitle: '', productId: '', headerImage: '', videoUrl: '', ctaText: '', productDescription: '', regularPrice: '', discountPrice: '', productImages: [], productFeatures: '', customerReviews: [], shippingAreas: [{ area: 'ঢাকার ভিতরে', charge: '80' }], freeDelivery: false, paymentMethod: 'cash_on_delivery', variantConfig: { mode: 'none', colors: [] } });
  };

  const updateLanding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editForm.title || !editForm.productId) return;
    if (!editForm.freeDelivery && (!editForm.shippingAreas || editForm.shippingAreas.length === 0 || editForm.shippingAreas.some(s => !s.area || !s.charge))) { alert('Please fill in all shipping areas and charges, or enable free delivery'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/landing/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        title: editForm.title,
        subtitle: editForm.subtitle || undefined,
        productId: parseInt(editForm.productId),
        headerImage: editForm.headerImage || undefined,
        videoUrl: editForm.videoUrl || undefined,
        ctaText: editForm.ctaText || undefined,
        productDescription: editForm.productDescription || undefined,
        regularPrice: editForm.regularPrice || undefined,
        discountPrice: editForm.discountPrice || undefined,
        productImages: editForm.productImages,
        productFeatures: editForm.productFeatures,
        customerReviews: editForm.customerReviews,
        shippingAreas: editForm.shippingAreas,
        freeDelivery: editForm.freeDelivery,
        variantConfig: editForm.variantConfig,
        paymentMethod: editForm.paymentMethod
      })});
      if (res.ok) {
        const updated = await res.json();
        setRows(prev => prev.map(r => r.id === editing.id ? updated : r));
        setEditing(null);
        setEditForm({ title: '', subtitle: '', productId: '', headerImage: '', videoUrl: '', ctaText: '', productDescription: '', regularPrice: '', discountPrice: '', productImages: [], productFeatures: '', customerReviews: [], shippingAreas: [{ area: 'ঢাকার ভিতরে', charge: '80' }], freeDelivery: false, paymentMethod: 'cash_on_delivery', variantConfig: { mode: 'none', colors: [] } });
        setForm({ title: '', subtitle: '', productId: '', headerImage: '', videoUrl: '', ctaText: '', productDescription: '', regularPrice: '', discountPrice: '', productImages: [], productFeatures: '', customerReviews: [], shippingAreas: [{ area: 'ঢাকার ভিতরে', charge: '80' }], freeDelivery: false, paymentMethod: 'cash_on_delivery', variantConfig: { mode: 'none', colors: [] } });
        setActiveTab('overview');
        alert('Landing page updated successfully!');
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to update landing page: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const getMarketingLink = (slug: string) => {
    return `${window.location.origin}/landing/${slug}`;
  };

  const getOpenAIKey = () => {
    try {
      const saved = localStorage.getItem('nexus-shop-general-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('🔑 OpenAI Key Debug:', { hasSettings: !!saved, hasApiKey: !!parsed.openaiApiKey, apiKeyLength: parsed.openaiApiKey?.length || 0 });
        return parsed.openaiApiKey || '';
      }
    } catch (error) {
      console.error('❌ Error parsing localStorage:', error);
    }
    return '';
  };

  const generateTitle = async () => {
    const p = products.find(p=>String(p.id)===form.productId);
    const apiKey = getOpenAIKey();
    console.log('🔍 Generate Title Debug:', { product: p, apiKey: apiKey ? 'Found' : 'Missing', productId: form.productId, productName: p?.name });
    if(!apiKey || !p){ alert('Select product and configure OpenAI API Key in Settings > General'); return; }
    setGeneratingTitle(true); setTitleProgress(0);
    const progressInterval = setInterval(() => { setTitleProgress(prev => Math.min(prev + 20, 90)); }, 200);
    try {
      const res = await fetch('/api/ai',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode:'landing-header', apiKey, product:{ name:p.name } }) });
      if(res.ok){ const d = await res.json(); setForm(prev=>{ const nf={...prev, title:d.title||prev.title}; return nf;}); setTitleProgress(100); setTimeout(()=>setTitleProgress(0),1000);} else { const errorData = await res.json(); alert(`AI generation failed: ${errorData.error || 'Unknown error'}`); }
    } catch (error) { alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);} finally { clearInterval(progressInterval); setGeneratingTitle(false); setTimeout(()=>setTitleProgress(0),1000); }
  };

  const generateSubtitle = async () => {
    const p = products.find(p=>String(p.id)===form.productId);
    const apiKey = getOpenAIKey();
    if(!apiKey || !p){ alert('Select product and configure OpenAI API Key in Settings > General'); return; }
    setGeneratingSubtitle(true); setSubtitleProgress(0);
    const progressInterval = setInterval(() => { setSubtitleProgress(prev => Math.min(prev + 20, 90)); }, 200);
    try { const res = await fetch('/api/ai',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode:'landing-header', apiKey, product:{ name:p.name } }) }); if(res.ok){ const d = await res.json(); setForm(prev=>({...prev, subtitle: d.subtitle || prev.subtitle})); setSubtitleProgress(100); setTimeout(()=>setSubtitleProgress(0),1000);} else { const errorData = await res.json(); alert(`AI generation failed: ${errorData.error || 'Unknown error'}`);} } catch (error) { alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);} finally { clearInterval(progressInterval); setGeneratingSubtitle(false); setTimeout(()=>setSubtitleProgress(0),1000);} }
  ;

  const generateProductDescription = async () => {
    const p = products.find(p=>String(p.id)===form.productId);
    const apiKey = getOpenAIKey();
    if(!apiKey || !p){ alert('Select product and configure OpenAI API Key in Settings > General'); return; }
    setGeneratingDescription(true); setDescriptionProgress(0);
    const progressInterval = setInterval(() => { setDescriptionProgress(prev => Math.min(prev + 20, 90)); }, 200);
    try { const res = await fetch('/api/ai',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode:'product-description', apiKey, product:{ name:p.name } }) }); if(res.ok){ const d = await res.json(); setForm(prev=>({...prev, productDescription: d.description || prev.productDescription})); setDescriptionProgress(100); setTimeout(()=>setDescriptionProgress(0),1000);} else { const errorData = await res.json(); alert(`AI generation failed: ${errorData.error || 'Unknown error'}`);} } catch (error) { alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);} finally { clearInterval(progressInterval); setGeneratingDescription(false); setTimeout(()=>setDescriptionProgress(0),1000);} }
  ;

  const generateProductFeatures = async () => {
    const p = products.find(p=>String(p.id)===form.productId);
    const apiKey = getOpenAIKey();
    if(!apiKey || !p){ alert('Select product and configure OpenAI API Key in Settings > General'); return; }
    setGeneratingFeatures(true); setFeaturesProgress(0);
    const progressInterval = setInterval(() => { setFeaturesProgress(prev => Math.min(prev + 20, 90)); }, 200);
    try { const res = await fetch('/api/ai',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode:'product-features', apiKey, product:{ name:p.name } }) }); if(res.ok){ const d = await res.json(); setForm(prev=>({...prev, productFeatures: d.features || prev.productFeatures})); setFeaturesProgress(100); setTimeout(()=>setFeaturesProgress(0),1000);} else { const errorData = await res.json(); alert(`AI generation failed: ${errorData.error || 'Unknown error'}`);} } catch (error) { alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);} finally { clearInterval(progressInterval); setGeneratingFeatures(false); setTimeout(()=>setFeaturesProgress(0),1000);} }
  ;

  const handleProductImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('📁 Files selected:', files);
    if (!files || files.length === 0) { alert('Please select files first'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) fd.append('files', files[i]);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        if (editing) setEditForm(prev => ({ ...prev, productImages: [...prev.productImages || [], ...data.map((d: any) => d.url)] }));
        else setForm(prev => ({ ...prev, productImages: [...prev.productImages || [], ...data.map((d: any) => d.url)] }));
        alert(`${data.length} images uploaded successfully!`);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Upload failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) { console.error('Error uploading product images:', error); alert('Failed to upload product images.'); }
    finally { setUploading(false); }
  };

  const removeProductImage = (indexToRemove: number) => {
    setForm(prev => ({ ...prev, productImages: prev.productImages?.filter((_, index) => index !== indexToRemove) || [] }));
    setEditForm(prev => ({ ...prev, productImages: prev.productImages?.filter((_, index) => index !== indexToRemove) || [] }));
  };

  const handleCustomerReviewsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) { alert('Please select customer review files first'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) fd.append('files', files[i]);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        if (editing) setEditForm(prev => ({ ...prev, customerReviews: [...prev.customerReviews || [], ...data.map((d: any) => d.url)] }));
        else setForm(prev => ({ ...prev, customerReviews: [...prev.customerReviews || [], ...data.map((d: any) => d.url)] }));
        alert(`${data.length} customer review images uploaded successfully!`);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Customer review upload failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) { console.error('Error uploading customer review images:', error); alert('Failed to upload customer review images.'); }
    finally { setUploading(false); }
  };

  const removeCustomerReview = (indexToRemove: number) => {
    if (editing) setEditForm(prev => ({ ...prev, customerReviews: prev.customerReviews?.filter((_, index) => index !== indexToRemove) || [] }));
    else setForm(prev => ({ ...prev, customerReviews: prev.customerReviews?.filter((_, index) => index !== indexToRemove) || [] }));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-md border">
        <div className="border-b px-4 pt-2">
          <nav className="flex gap-6" aria-label="Tabs">
            {[
              { id:'create', label:'Create Landing Page' },
              { id:'overview', label:'Overview' }
            ].map(t => (
              <button key={t.id}
                onClick={()=>setActiveTab(t.id as any)}
                className={`py-3 border-b-2 text-sm ${activeTab===t.id?'border-emerald-600 text-emerald-700':'border-transparent text-gray-600 hover:text-gray-800'}`}
              >{t.label}</button>
            ))}
          </nav>
          <div className="flex items-center gap-2 pb-3">
            <label className="text-xs text-gray-600">Compact view</label>
            <input type="checkbox" checked={compact} onChange={()=>setCompact(v=>!v)} />
          </div>
        </div>
        <div className="p-4">
          {activeTab==='create' && <>
            <form onSubmit={editing ? updateLanding : submit} className={compact?"space-y-4":"space-y-6"}>
              {/* Header */}
              <div className={`grid grid-cols-1 xl:grid-cols-2 ${gridGap} items-start`}>
                {/* Left Column (Header, Media, CTA) */}
                <div className={`border rounded-lg ${cardPad} bg-gray-50`}>
                  <h4 className="font-semibold text-gray-800 mb-3">Header</h4>
                  <div className={compact?"space-y-2":"space-y-3"}>
                    <div>
                      <label className="block text-sm font-medium mb-1">1) Title</label>
                      <div className="flex gap-2">
                        <input
                          value={editing ? editForm.title : form.title}
                          onChange={e => editing ? setEditForm({...editForm, title: e.target.value}) : setForm({...form, title: e.target.value})}
                          className="w-full border rounded px-3 py-2"
                          placeholder="Summer Sale Landing"
                          required
                        />
                        {!editing && (
                          <button type="button" title="AI" onClick={generateTitle} disabled={generatingTitle} className="px-2 py-2 border rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            {generatingTitle ? <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-5 h-5"/>}
                          </button>
                        )}
                      </div>
                      {(generatingTitle || titleProgress>0) && (
                        <div className="mt-2 h-1.5 bg-gray-200 rounded">
                          <div className="h-1.5 bg-emerald-500 rounded" style={{ width: `${titleProgress}%`, transition: 'width 0.2s ease' }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">2) Subtitle</label>
                      <div className="flex gap-2">
                        <input
                          value={editing ? editForm.subtitle : form.subtitle}
                          onChange={e => editing ? setEditForm({...editForm, subtitle: e.target.value}) : setForm({...form, subtitle: e.target.value})}
                          className="w-full border rounded px-3 py-2"
                          placeholder="Short supporting text"
                        />
                        {!editing && (
                          <button type="button" title="AI" onClick={generateSubtitle} disabled={generatingSubtitle} className="px-2 py-2 border rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            {generatingSubtitle ? <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-5 h-5"/>}
                          </button>
                        )}
                      </div>
                      {(generatingSubtitle || subtitleProgress>0) && (
                        <div className="mt-2 h-1.5 bg-gray-200 rounded">
                          <div className="h-1.5 bg-emerald-500 rounded" style={{ width: `${subtitleProgress}%`, transition: 'width 0.2s ease' }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">3) Header Image</label>
                      <div className="flex items-center gap-3">
                        <input id="headerImageInput" className="hidden" type="file" accept="image/*" onChange={async (e)=>{ const file=(e.target as HTMLInputElement).files?.[0]; if(!file) return; setUploading(true); try{ const fd=new FormData(); fd.append('file', file); const up=await fetch('/api/upload',{method:'POST', body:fd}); if(up.ok){ const d=await up.json(); if(editing) setEditForm(prev=>({...prev, headerImage:d.url})); else setForm(prev=>({...prev, headerImage:d.url})); } } finally { setUploading(false);} }} />
                        <label htmlFor="headerImageInput" className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer">
                          Upload header image
                        </label>
                        {uploading && <span className="text-sm text-gray-500">Uploading…</span>}
                      </div>
                      {(editing ? editForm.headerImage : form.headerImage) && (<img src={editing ? editForm.headerImage : form.headerImage} alt="header" className="mt-2 h-24 rounded border" />)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">4) Video Upload</label>
                      <div className="flex items-center gap-3">
                        <input id="landingVideoInput" className="hidden" type="file" accept="video/*" onChange={async (e)=>{ const file=(e.target as HTMLInputElement).files?.[0]; if(!file) return; setUploading(true); try{ const fd=new FormData(); fd.append('file', file); const up=await fetch('/api/upload',{method:'POST', body:fd}); if(up.ok){ const d=await up.json(); if(editing) setEditForm(prev=>({...prev, videoUrl:d.url})); else setForm(prev=>({...prev, videoUrl:d.url})); } } finally { setUploading(false);} }} />
                        <label htmlFor="landingVideoInput" className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer">
                          Upload video
                        </label>
                        {uploading && <span className="text-sm text-gray-500">Uploading video…</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">MP4, WebM, AVI supported</p>
                      {(editing ? editForm.videoUrl : form.videoUrl) && (<video src={editing ? editForm.videoUrl : form.videoUrl} className="mt-2 h-32 rounded border" controls />)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">5) Action Button Text</label>
                      <input value={editing ? editForm.ctaText : form.ctaText} onChange={e => editing ? setEditForm({...editForm, ctaText: e.target.value}) : setForm({...form, ctaText: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="Buy Now" />
                    </div>
                  </div>
                </div>

                {/* Right Column (Product picker + Variations) */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Product</label>
                  <button type="button" onClick={()=>setProductOpen(v=>!v)} className="w-full border rounded px-3 py-2 flex items-center justify-between">
                    {(() => {
                      const sel = products.find(p=>String(p.id)===(editing ? editForm.productId : form.productId));
                      return sel ? (
                        <span className="flex items-center gap-2">
                          {sel.image && <img src={sel.image} onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} className="h-6 w-6 rounded object-cover"/>}
                          {sel.name}
                        </span>
                      ) : (<span className="text-gray-500">Select product</span>);
                    })()}
                    <span className="text-gray-400">▾</span>
                  </button>
                  {productOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
                      {products.map((p:any)=> (
                        <button type="button" key={p.id} onClick={()=>{ 
                          if(editing){ 
                            setEditForm(prev=>({
                              ...prev, 
                              productId:String(p.id),
                              regularPrice: String((p as any).regularPrice ?? ''),
                              discountPrice: (p as any).salePrice != null ? String((p as any).salePrice) : ''
                            })); 
                          } else { 
                            setForm(prev=>({
                              ...prev, 
                              productId:String(p.id),
                              regularPrice: String((p as any).regularPrice ?? ''),
                              discountPrice: (p as any).salePrice != null ? String((p as any).salePrice) : ''
                            })); 
                          } 
                          setProductOpen(false); 
                        }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2">
                          {p.image && <img src={p.image} onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} className="h-6 w-6 rounded object-cover"/>}
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Variations selector moved here under product */}
                  <div className={`mt-4 border rounded-lg ${cardPad} bg-white`}>
                    <h4 className="font-semibold text-gray-800 mb-3">Variations to show on landing</h4>
                    <div className="space-y-3">
                      {availableVariants.length === 0 && (
                        <p className="text-sm text-gray-500">No size/color variations found for the selected product.</p>
                      )}
                      {availableVariants.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <label className="text-sm">Mode</label>
                            <select value={editing ? (editForm.variantConfig?.mode || 'colors-sizes') : (form.variantConfig?.mode || 'colors-sizes')} onChange={e=> editing ? setEditForm(prev=>({ ...prev, variantConfig: { ...(prev.variantConfig||{}), mode: e.target.value }})) : setForm(prev=>({ ...prev, variantConfig: { ...(prev.variantConfig||{}), mode: e.target.value }}))} className="border rounded px-2 py-1 text-sm">
                              <option value="colors-sizes">Color → Sizes</option>
                              <option value="colors-only">Colors only</option>
                            </select>
                            <button type="button" onClick={()=>{
                              const mode = editing ? (editForm.variantConfig?.mode) : (form.variantConfig?.mode);
                              const all = availableVariants.map(c=>({ color: c.color, sizes: mode==='colors-only' ? [] : [...c.sizes] }));
                              if (editing) setEditForm(prev=>({ ...prev, variantConfig: { ...(prev.variantConfig||{}), colors: all } }));
                              else setForm(prev=>({ ...prev, variantConfig: { ...(prev.variantConfig||{}), colors: all } }));
                            }} className="text-emerald-700 text-xs border border-emerald-300 rounded px-2 py-1">Select all</button>
                          </div>
                          <div className="space-y-2">
                            {availableVariants.map((c, idx) => {
                              const selected = (editing ? editForm.variantConfig?.colors : form.variantConfig?.colors) || [];
                              const current = selected.find(x=>x.color===c.color) || { color: c.color, sizes: [] as string[] };
                              const toggleColor = (checked:boolean) => {
                                let list = [...selected];
                                const i = list.findIndex(x=>x.color===c.color);
                                if (checked) {
                                  const mode = editing ? (editForm.variantConfig?.mode) : (form.variantConfig?.mode);
                                  const sizesToUse = mode === 'colors-only' ? [] : [...c.sizes];
                                  if (i>=0) list[i] = { color: c.color, sizes: sizesToUse };
                                  else list.push({ color: c.color, sizes: sizesToUse });
                                } else {
                                  if (i>=0) list.splice(i,1);
                                }
                                if (editing) setEditForm(prev=>({ ...prev, variantConfig: { ...(prev.variantConfig||{}), colors: list } }));
                                else setForm(prev=>({ ...prev, variantConfig: { ...(prev.variantConfig||{}), colors: list } }));
                              };
                              const toggleSize = (size:string, checked:boolean) => {
                                let list = [...selected];
                                const i = list.findIndex(x=>x.color===c.color);
                                if (i<0) list.push({ color: c.color, sizes: [] });
                                const idx2 = i<0 ? list.length-1 : i;
                                const sizes = new Set(list[idx2].sizes || []);
                                if (checked) sizes.add(size); else sizes.delete(size);
                                list[idx2] = { color: c.color, sizes: Array.from(sizes) };
                                if (editing) setEditForm(prev=>({ ...prev, variantConfig: { ...(prev.variantConfig||{}), colors: list } }));
                                else setForm(prev=>({ ...prev, variantConfig: { ...(prev.variantConfig||{}), colors: list } }));
                              };
                              const mode = editing ? (editForm.variantConfig?.mode) : (form.variantConfig?.mode);
                              const allChecked = mode==='colors-only' ? selected.some(x=>x.color===c.color) : (c.sizes.length>0 && c.sizes.every(s=>current.sizes.includes(s)));
                              return (
                                <div key={idx} className="border rounded p-2">
                                  <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 text-sm">
                                      <input type="checkbox" checked={allChecked} onChange={e=> toggleColor(e.target.checked)} />
                                      <span>Color: {c.color || 'N/A'}</span>
                                    </label>
                                  </div>
                                  {(mode !== 'colors-only') && (
                                  <div className="mt-2 flex flex-wrap gap-3">
                                    {c.sizes.map((s, i2)=> (
                                      <label key={i2} className="flex items-center gap-1 text-xs border rounded px-2 py-1">
                                        <input type="checkbox" checked={current.sizes.includes(s)} onChange={e=> toggleSize(s, e.target.checked)} />
                                        <span>{s}</span>
                                      </label>
                                    ))}
                                    {c.sizes.length===0 && (
                                      <span className="text-xs text-gray-500">No sizes for this color</span>
                                    )}
                                  </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Description */}
              <div className={`border rounded-lg ${cardPad} bg-gray-50 xl:col-span-2`}>
                <h4 className="font-semibold text-gray-800 mb-3">Product Description</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">6) Why Buy This Product?</label>
                    <div className="flex gap-2">
                      <textarea value={editing ? editForm.productDescription : form.productDescription} onChange={e => editing ? setEditForm({...editForm, productDescription: e.target.value}) : setForm({...form, productDescription: e.target.value})} className="w-full border rounded px-3 py-2 h-24 resize-none" placeholder="AI will generate 10 compelling reasons to buy this product..." readOnly />
                      {!editing && (
                        <button type="button" title="AI Generate" onClick={generateProductDescription} disabled={generatingDescription as any} className="px-3 py-2 border rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                          <div className="flex items-center gap-1"><SparklesIcon className="w-4 h-4"/><span className="text-xs">AI Generate</span></div>
                        </button>
                      )}
                    </div>
                    {(generatingDescription || descriptionProgress>0) && (
                      <div className="mt-2 h-1.5 bg-gray-200 rounded">
                        <div className="h-1.5 bg-emerald-500 rounded" style={{ width: `${descriptionProgress}%`, transition: 'width 0.2s ease' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing + Images side-by-side */}
              <div className={`grid grid-cols-1 md:grid-cols-2 ${gridGap}`}>
                {/* Product Pricing (left) */}
                <div className={`rounded-lg shadow-md ${cardPad} bg-gradient-to-br from-blue-50 to-indigo-50`}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Pricing</h3>
                  <div className={`grid grid-cols-1 md:grid-cols-2 ${gridGap}`}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Regular Price (৳)</label>
                      <input type="text" value={editing ? editForm.regularPrice || '' : form.regularPrice || ''} onChange={(e)=> editing ? setEditForm({...editForm, regularPrice:e.target.value}) : setForm({...form, regularPrice:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter regular price" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount Price (৳)</label>
                      <input type="text" value={editing ? editForm.discountPrice || '' : form.discountPrice || ''} onChange={(e)=> editing ? setEditForm({...editForm, discountPrice:e.target.value}) : setForm({...form, discountPrice:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter discount price" />
                    </div>
                  </div>
                </div>

                {/* Product Images (right) */}
                <div className={`rounded-lg shadow-md ${cardPad} bg-gradient-to-br from-pink-50 to-rose-50`}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Images</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Product Images (Multiple)</label>
                    <input type="file" multiple accept="image/*" onChange={handleProductImagesUpload} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-sm text-gray-500 mt-1">You can select multiple images at once</p>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {(editing ? editForm.productImages || [] : form.productImages || []).map((imageUrl: string, index: number) => (
                      <div key={index} className="relative group w-20 h-20 md:w-24 md:h-24">
                        <img src={imageUrl} alt={`Product ${index + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                        <button type="button" onClick={()=>removeProductImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Features + Reviews side-by-side */}
              <div className={`grid grid-cols-1 md:grid-cols-2 ${gridGap}`}>
                {/* Product Features (left) */}
                <div className={`rounded-lg shadow-md ${cardPad} bg-gradient-to-br from-emerald-50 to-green-50`}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Features</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">7) Product Features</label>
                      <div className="flex gap-2">
                        <textarea value={editing ? editForm.productFeatures || '' : form.productFeatures || ''} onChange={e => editing ? setEditForm({...editForm, productFeatures: e.target.value}) : setForm({...form, productFeatures: e.target.value})} className="w-full border rounded px-3 py-2 h-24 resize-none" placeholder="AI will generate 6 compelling product features..." readOnly />
                        {!editing && (
                          <button type="button" title="AI Generate" onClick={generateProductFeatures} disabled={generatingFeatures} className="px-3 py-2 border rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                            <div className="flex items-center gap-1"><SparklesIcon className="w-4 h-4"/><span className="text-xs">AI Generate</span></div>
                          </button>
                        )}
                      </div>
                      {(generatingFeatures || featuresProgress>0) && (
                        <div className="mt-2 h-1.5 bg-gray-200 rounded">
                          <div className="h-1.5 bg-emerald-500 rounded" style={{ width: `${featuresProgress}%`, transition: 'width 0.2s ease' }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Customer Reviews (right) */}
                <div className={`rounded-lg shadow-md ${cardPad} bg-gradient-to-br from-yellow-50 to-amber-50`}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Reviews</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">8) Customer Review Images</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input type="file" multiple accept="image/*" onChange={handleCustomerReviewsUpload} className="hidden" id="customerReviewsInput" />
                        <label htmlFor="customerReviewsInput" className="cursor-pointer">
                          <div className="flex flex-col items-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <p className="mt-1 text-sm text-gray-600">Click to upload customer review screenshots</p>
                            <p className="mt-1 text-xs text-gray-500">PNG, JPG, JPEG up to 10MB each</p>
                          </div>
                        </label>
                      </div>
                    </div>
                    {(editing ? editForm.customerReviews : form.customerReviews) && (editing ? editForm.customerReviews : form.customerReviews).length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Uploaded Reviews:</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                          {(editing ? editForm.customerReviews : form.customerReviews).map((imageUrl: string, index: number) => (
                            <div key={index} className="relative group w-20 h-20 md:w-24 md:h-24">
                              <img src={imageUrl} alt={`Customer Review ${index + 1}`} className="w-full h-full object-cover rounded-lg border" />
                              <button type="button" onClick={()=>{
                                if (editing) setEditForm(prev=>({...prev, customerReviews: prev.customerReviews?.filter((_, i)=> i!==index) || []}));
                                else setForm(prev=>({...prev, customerReviews: prev.customerReviews?.filter((_, i)=> i!==index) || []}));
                              }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping & Payment side-by-side */}
              <div className={`grid grid-cols-1 md:grid-cols-2 ${gridGap}`}>
                {/* Shipping Box */}
                <div className={`rounded-lg shadow-md ${cardPad} bg-gradient-to-br from-sky-50 to-cyan-50`}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Shipping & Delivery</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={editing ? (editForm.freeDelivery || false) : (form.freeDelivery || false)} onChange={e => editing ? setEditForm({...editForm, freeDelivery: e.target.checked}) : setForm({...form, freeDelivery: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm font-medium text-gray-700">🚚 Free Delivery (Check if delivery is free)</span>
                      </label>
                    </div>
                    {!(editing ? (editForm.freeDelivery || false) : (form.freeDelivery || false)) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Areas & Charges</label>
                        <p className="text-sm text-gray-600 mb-3">Add shipping areas and their corresponding charges. At least one shipping area is required if free delivery is disabled.</p>
                        <div className="space-y-3">
                          {(editing ? (editForm.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]) : (form.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }])).map((shipping, index) => (
                            <div key={index} className="flex gap-2">
                              <input type="text" value={shipping.area || ''} onChange={e=>{ const cur = editing ? (editForm.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]) : (form.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]); const ns=[...cur]; ns[index].area=e.target.value; editing ? setEditForm({...editForm, shippingAreas: ns}) : setForm({...form, shippingAreas: ns}); }} className={`flex-1 border rounded px-3 py-2 ${!shipping.area ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., ঢাকার ভিতরে" required />
                              <input type="text" value={shipping.charge || ''} onChange={e=>{ const cur = editing ? (editForm.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]) : (form.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]); const ns=[...cur]; ns[index].charge=e.target.value; editing ? setEditForm({...editForm, shippingAreas: ns}) : setForm({...form, shippingAreas: ns}); }} className={`w-24 border rounded px-3 py-2 ${!shipping.charge ? 'border-red-500' : 'border-gray-300'}`} placeholder="৳80" required />
                              <button type="button" onClick={()=>{ const cur = editing ? (editForm.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]) : (form.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]); if (cur.length>1){ const ns=cur.filter((_,i)=>i!==index); editing ? setEditForm({...editForm, shippingAreas: ns}) : setForm({...form, shippingAreas: ns}); } }} disabled={(editing ? (editForm.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]) : (form.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }])).length <= 1} className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed">Remove</button>
                            </div>
                          ))}
                          <button type="button" onClick={()=>{ const cur = editing ? (editForm.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]) : (form.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]); const ns=[...cur, { area:'', charge:'' }]; editing ? setEditForm({...editForm, shippingAreas: ns}) : setForm({...form, shippingAreas: ns}); }} className="px-3 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50">+ Add Shipping Area</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Payment Box */}
                <div className={`rounded-lg shadow-md ${cardPad} bg-gradient-to-br from-purple-50 to-fuchsia-50`}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Method</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select payment method</label>
                    <select value={editing ? (editForm as any).paymentMethod || 'cash_on_delivery' : (form as any).paymentMethod || 'cash_on_delivery'} onChange={e => editing ? setEditForm({ ...editForm, paymentMethod: e.target.value as any }) : setForm({ ...form, paymentMethod: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="cash_on_delivery">Cash on Delivery</option>
                      <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="online_payment">Online Payment (Gateway)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">This will be shown on the landing page checkout.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">{saving ? 'Saving...' : (editing ? 'Update Landing Page' : 'Create Landing')}</button>
              </div>
            </form>
          </>}

          {activeTab==='overview' && (
            <div className="overflow-x-auto">
              {(() => {
                // @ts-ignore
                if (!window.__landingOrdersCache) {
                  fetch('/api/orders')
                    .then(r => r.ok ? r.json() : Promise.resolve({ orders: [] }))
                    .then(d => {
                      // @ts-ignore
                      window.__landingOrdersCache = Array.isArray(d.orders) ? d.orders : [];
                      setRows(prev => [...prev]);
                    })
                    .catch(() => {
                      // @ts-ignore
                      window.__landingOrdersCache = [];
                    });
                }
                return null;
              })()}
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium">Landing Pages Overview</h3>
                <div className="text-sm text-gray-600">Total: {rows.length} landing pages</div>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Marketing Link</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map(r=>{
                    const product = products.find(p => p.id === r.productId);
                    // @ts-ignore
                    const allOrders = (window.__landingOrdersCache || []) as any[];
                    const lpOrders = allOrders.filter(o => o.landingPageId === r.id);
                    const ordersCount = lpOrders.length;
                    const revenue = lpOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><div className="flex items-center gap-2">{product?.image && (<img src={product.image} alt="product" className="h-8 w-8 rounded object-cover"/>)}<div><div className="font-medium text-gray-900">{product?.name || ''}</div><div className="text-xs text-gray-500">ID: {r.productId}</div></div></div></td>
                        <td className="px-4 py-3"><span className="font-medium text-green-600">৳{r.discountPrice || r.regularPrice || 0}</span></td>
                        <td className="px-4 py-3"><span className="text-sm font-medium text-gray-900">{r.viewCount || 0}</span></td>
                        <td className="px-4 py-3"><span className="text-sm font-medium text-gray-900">{ordersCount}</span></td>
                        <td className="px-4 py-3"><span className="text-sm font-medium text-gray-900">৳{revenue}</span></td>
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><input type="text" value={`${window.location.origin}/landing/${r.slug}`} readOnly className="text-xs bg-gray-100 border rounded px-2 py-1 w-48" /><button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/landing/${r.slug}`); alert('Marketing link copied to clipboard!');}} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Copy</button></div></td>
                        <td className="px-4 py-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span></td>
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><a href={`${window.location.origin}/landing/${r.slug}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">View</a><button onClick={()=>startEdit(r)} className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600">Edit</button><button onClick={()=>deleteLanding(r.id)} className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Delete</button></div></td>
                      </tr>
                    );
                  })}
                  {rows.length===0 && (<tr><td className="px-4 py-6 text-center text-gray-500" colSpan={8}>No landing pages yet. Create your first landing page!</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


