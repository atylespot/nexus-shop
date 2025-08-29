"use client";
import { useEffect, useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";

interface Product {
  id: number;
  name: string;
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
  const [products, setProducts] = useState<{id:number, name:string, image?:string, price?:number}[]>([]);
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
    freeDelivery: false
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
    freeDelivery: false
  });

  useEffect(() => { (async () => {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.map((p:any)=>({
          id: parseInt(p.id),
          name: p.name,
          image: p.image || (p.images?.[0] ?? ''),
          price: p.price || 0
        })));
      }
      const r2 = await fetch('/api/landing', { cache: 'no-store' });
      if (r2.ok) setRows(await r2.json());
    } catch {}
  })();}, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Submit function called with form data:', form);

    if (!form.title || !form.productId) {
      console.log('❌ Validation failed:', { title: form.title, productId: form.productId });
      alert('Please fill in Title and select a Product');
      return;
    }

    // Validate shipping areas
    if (!form.freeDelivery && (!form.shippingAreas || form.shippingAreas.length === 0 || form.shippingAreas.some(s => !s.area || !s.charge))) {
      alert('Please fill in all shipping areas and charges, or enable free delivery');
      return;
    }

    setSaving(true);
    try {
      const requestBody = {
        title: form.title,
        subtitle: form.subtitle || undefined,
        productId: parseInt(form.productId),
        headerImage: form.headerImage || undefined,
        videoUrl: form.videoUrl || undefined,
        ctaText: form.ctaText || undefined,
        productDescription: form.productDescription || undefined,
        regularPrice: form.regularPrice || undefined,
        discountPrice: form.discountPrice || undefined,
        productImages: form.productImages || undefined
      };

      console.log('📤 Sending request to /api/landing:', requestBody);
      console.log('🔍 Form productImages before submit:', form.productImages);

      const response = await fetch('/api/landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          freeDelivery: form.freeDelivery
        })
      });

      console.log('📡 API Response:', { status: response.status, ok: response.ok });

      if (response.ok) {
        const created = await response.json();
        console.log('✅ Landing page created successfully:', created);
        setRows(prev=>[created, ...prev]);
        setForm({ title: '', subtitle: '', productId: '', headerImage: '', videoUrl: '', ctaText: '', productDescription: '', regularPrice: '', discountPrice: '', productImages: [], productFeatures: '', customerReviews: [], shippingAreas: [{ area: 'ঢাকার ভিতরে', charge: '80' }], freeDelivery: false });
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

  const deleteLanding = async (id: number) => {
    if (!confirm('Are you sure you want to delete this landing page?')) return;

    try {
      const res = await fetch(`/api/landing/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRows(prev => prev.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Error deleting landing page:', error);
    }
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
      freeDelivery: landing.freeDelivery || false
    });
    setActiveTab('create');
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditForm({ title: '', subtitle: '', productId: '', headerImage: '', videoUrl: '', ctaText: '', productDescription: '', regularPrice: '', discountPrice: '', productImages: [], productFeatures: '', customerReviews: [], shippingAreas: [{ area: 'ঢাকার ভিতরে', charge: '80' }], freeDelivery: false });
    setForm({ title: '', subtitle: '', productId: '', headerImage: '', videoUrl: '', ctaText: '', productDescription: '', regularPrice: '', discountPrice: '', productImages: [], productFeatures: '', customerReviews: [], shippingAreas: [{ area: 'ঢাকার ভিতরে', charge: '80' }], freeDelivery: false });
  };

  const updateLanding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editForm.title || !editForm.productId) return;

    // Validate shipping areas
    if (!editForm.freeDelivery && (!editForm.shippingAreas || editForm.shippingAreas.length === 0 || editForm.shippingAreas.some(s => !s.area || !s.charge))) {
      alert('Please fill in all shipping areas and charges, or enable free delivery');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/landing/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          freeDelivery: editForm.freeDelivery
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setRows(prev => prev.map(r => r.id === editing.id ? updated : r));
        setEditing(null);
        setEditForm({ title: '', subtitle: '', productId: '', headerImage: '', videoUrl: '', ctaText: '', productDescription: '', regularPrice: '', discountPrice: '', productImages: [], productFeatures: '', customerReviews: [], shippingAreas: [{ area: 'ঢাকার ভিতরে', charge: '80' }], freeDelivery: false });
        setForm({ title: '', subtitle: '', productId: '', headerImage: '', videoUrl: '', ctaText: '', productDescription: '', regularPrice: '', discountPrice: '', productImages: [], productFeatures: '', customerReviews: [], shippingAreas: [{ area: 'ঢাকার ভিতরে', charge: '80' }], freeDelivery: false });
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
        console.log('🔑 OpenAI Key Debug:', {
          hasSettings: !!saved,
          hasApiKey: !!parsed.openaiApiKey,
          apiKeyLength: parsed.openaiApiKey?.length || 0
        });
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

    console.log('🔍 Generate Title Debug:', {
      product: p,
      apiKey: apiKey ? 'Found' : 'Missing',
      productId: form.productId,
      productName: p?.name
    });

    if(!apiKey || !p){
      alert('Select product and configure OpenAI API Key in Settings > General');
      return;
    }

    setGeneratingTitle(true);
    setTitleProgress(0);

    // Simulate progress steps
    const progressInterval = setInterval(() => {
      setTitleProgress(prev => Math.min(prev + 20, 90));
    }, 200);

    try {
      console.log('🚀 Calling AI API for title...');
      const requestBody = {
        mode:'landing-header',
        apiKey,
        product:{ name:p.name }
      };
      console.log('📤 Request Body:', requestBody);

      const res = await fetch('/api/ai',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(requestBody)
      });

      console.log('📡 AI API Response:', { status: res.status, ok: res.ok });

      if(res.ok){
        const d = await res.json();
        console.log('✅ AI Response Data:', d);
        console.log('📝 Setting title from:', d.title, 'to form');
        setForm(prev=>{
          const newForm = {...prev, title: d.title || prev.title};
          console.log('🔄 Form updated:', newForm);
          return newForm;
        });
        setTitleProgress(100);
        setTimeout(() => setTitleProgress(0), 1000);
      } else {
        const errorData = await res.json();
        console.error('❌ AI API Error:', errorData);
        alert(`AI generation failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 Generate Title Error:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      clearInterval(progressInterval);
      setGeneratingTitle(false);
      setTimeout(() => setTitleProgress(0), 1000);
    }
  };

  const generateSubtitle = async () => {
    const p = products.find(p=>String(p.id)===form.productId);
    const apiKey = getOpenAIKey();

    console.log('🔍 Generate Subtitle Debug:', { product: p, apiKey: apiKey ? 'Found' : 'Missing' });

    if(!apiKey || !p){
      alert('Select product and configure OpenAI API Key in Settings > General');
      return;
    }

    setGeneratingSubtitle(true);
    setSubtitleProgress(0);

    // Simulate progress steps
    const progressInterval = setInterval(() => {
      setSubtitleProgress(prev => Math.min(prev + 20, 90));
    }, 200);

    try {
      console.log('🚀 Calling AI API for subtitle...');
      const res = await fetch('/api/ai',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          mode:'landing-header',
          apiKey,
          product:{ name:p.name }
        })
      });

      console.log('📡 AI API Response:', { status: res.status, ok: res.ok });

      if(res.ok){
        const d = await res.json();
        console.log('✅ AI Response Data:', d);
        setForm(prev=>({...prev, subtitle: d.subtitle || prev.subtitle}));
        setSubtitleProgress(100);
        setTimeout(() => setSubtitleProgress(0), 1000);
      } else {
        const errorData = await res.json();
        console.error('❌ AI API Error:', errorData);
        alert(`AI generation failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 Generate Subtitle Error:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      clearInterval(progressInterval);
      setGeneratingSubtitle(false);
      setTimeout(() => setSubtitleProgress(0), 1000);
    }
  };

  const generateProductDescription = async () => {
    const p = products.find(p=>String(p.id)===form.productId);
    const apiKey = getOpenAIKey();

    console.log('🔍 Generate Product Description Debug:', { product: p, apiKey: apiKey ? 'Found' : 'Missing' });

    if(!apiKey || !p){
      alert('Select product and configure OpenAI API Key in Settings > General');
      return;
    }

    setGeneratingDescription(true);
    setDescriptionProgress(0);

    // Simulate progress steps
    const progressInterval = setInterval(() => {
      setDescriptionProgress(prev => Math.min(prev + 20, 90));
    }, 200);

    try {
      console.log('🚀 Calling AI API for product description...');
      const res = await fetch('/api/ai',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          mode:'product-description',
          apiKey,
          product:{ name:p.name }
        })
      });

      console.log('📡 AI API Response:', { status: res.status, ok: res.ok });

      if(res.ok){
        const d = await res.json();
        console.log('✅ AI Response Data:', d);
        setForm(prev=>({...prev, productDescription: d.description || prev.productDescription}));
        setDescriptionProgress(100);
        setTimeout(() => setDescriptionProgress(0), 1000);
      } else {
        const errorData = await res.json();
        console.error('❌ AI API Error:', errorData);
        alert(`AI generation failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 Generate Product Description Error:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      clearInterval(progressInterval);
      setGeneratingDescription(false);
      setTimeout(() => setDescriptionProgress(0), 1000);
    }
  };

  const generateProductFeatures = async () => {
    const p = products.find(p=>String(p.id)===form.productId);
    const apiKey = getOpenAIKey();

    console.log('🔍 Generate Product Features Debug:', { product: p, apiKey: apiKey ? 'Found' : 'Missing' });

    if(!apiKey || !p){
      alert('Select product and configure OpenAI API Key in Settings > General');
      return;
    }

    setGeneratingFeatures(true);
    setFeaturesProgress(0);

    // Simulate progress steps
    const progressInterval = setInterval(() => {
      setFeaturesProgress(prev => Math.min(prev + 20, 90));
    }, 200);

    try {
      console.log('🚀 Calling AI API for product features...');
      const res = await fetch('/api/ai',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          mode:'product-features',
          apiKey,
          product:{ name:p.name }
        })
      });

      console.log('📡 AI API Response:', { status: res.status, ok: res.ok });

      if(res.ok){
        const d = await res.json();
        console.log('✅ AI Response Data:', d);
        setForm(prev=>({...prev, productFeatures: d.features || prev.productFeatures}));
        setFeaturesProgress(100);
        setTimeout(() => setFeaturesProgress(0), 1000);
      } else {
        const errorData = await res.json();
        console.error('❌ AI API Error:', errorData);
        alert(`AI generation failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 Generate Product Features Error:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      clearInterval(progressInterval);
      setGeneratingFeatures(false);
      setTimeout(() => setFeaturesProgress(0), 1000);
    }
  };

  const handleProductImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('📁 Files selected:', files);
    
    if (!files || files.length === 0) {
      alert('Please select files first');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) {
        console.log(`📤 Appending file ${i}:`, files[i].name, files[i].size);
        fd.append('files', files[i]);
      }
      
      console.log('📤 FormData created with', files.length, 'files');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        console.log('📤 Upload response:', data);
        if (editing) {
          setEditForm(prev => {
            const updated = {
              ...prev,
              productImages: [...prev.productImages || [], ...data.map((d: any) => d.url)]
            };
            console.log('🔄 EditForm updated:', updated);
            return updated;
          });
        } else {
          setForm(prev => {
            const updated = {
              ...prev,
              productImages: [...prev.productImages || [], ...data.map((d: any) => d.url)]
            };
            console.log('🔄 Form updated:', updated);
            return updated;
          });
        }
        alert(`${data.length} images uploaded successfully!`);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Upload error:', errorData);
        alert(`Upload failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading product images:', error);
      alert('Failed to upload product images.');
    } finally {
      setUploading(false);
    }
  };

  const removeProductImage = (indexToRemove: number) => {
    setForm(prev => ({
      ...prev,
      productImages: prev.productImages?.filter((_, index) => index !== indexToRemove) || []
    }));
    setEditForm(prev => ({
      ...prev,
      productImages: prev.productImages?.filter((_, index) => index !== indexToRemove) || []
    }));
  };

  const handleCustomerReviewsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('📁 Customer review files selected:', files);
    
    if (!files || files.length === 0) {
      alert('Please select customer review files first');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) {
        console.log(`📤 Appending customer review file ${i}:`, files[i].name, files[i].size);
        fd.append('files', files[i]);
      }
      
      console.log('📤 FormData created with', files.length, 'customer review files');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        console.log('📤 Customer review upload response:', data);
        if (editing) {
          setEditForm(prev => {
            const updated = {
              ...prev,
              customerReviews: [...prev.customerReviews || [], ...data.map((d: any) => d.url)]
            };
            console.log('🔄 EditForm customer reviews updated:', updated);
            return updated;
          });
        } else {
          setForm(prev => {
            const updated = {
              ...prev,
              customerReviews: [...prev.customerReviews || [], ...data.map((d: any) => d.url)]
            };
            console.log('🔄 Form customer reviews updated:', updated);
            return updated;
          });
        }
        alert(`${data.length} customer review images uploaded successfully!`);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Customer review upload error:', errorData);
        alert(`Customer review upload failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading customer review images:', error);
      alert('Failed to upload customer review images.');
    } finally {
      setUploading(false);
    }
  };

  const removeCustomerReview = (indexToRemove: number) => {
    if (editing) {
      setEditForm(prev => ({
        ...prev,
        customerReviews: prev.customerReviews?.filter((_, index) => index !== indexToRemove) || []
      }));
    } else {
      setForm(prev => ({
        ...prev,
        customerReviews: prev.customerReviews?.filter((_, index) => index !== indexToRemove) || []
      }));
    }
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
        </div>
        <div className="p-4">
          {activeTab==='create' && (
            <form onSubmit={editing ? updateLanding : submit} className="space-y-4 max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editing ? 'Edit Landing Page' : 'Create Landing Page'}
                </h3>
                {editing && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-3">Header</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">1) Title</label>
                    <div className="flex gap-2">
                      <input
                        value={editing ? editForm.title : form.title}
                        onChange={e => editing ?
                          setEditForm({...editForm, title: e.target.value}) :
                          setForm({...form, title: e.target.value})
                        }
                        className="w-full border rounded px-3 py-2"
                        placeholder="Summer Sale Landing"
                        required
                      />
                      {!editing && (
                        <button type="button" title="AI"
                          onClick={generateTitle}
                          disabled={generatingTitle}
                          className="px-2 py-2 border rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed">
                          {generatingTitle ? (
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs">Generating...</span>
                            </div>
                          ) : (
                            <SparklesIcon className="w-5 h-5"/>
                          )}
                        </button>
                      )}
                      {generatingTitle && !editing && (
                        <div className="w-full mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-600 h-2 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${titleProgress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {titleProgress < 30 && "Analyzing product..."}
                            {titleProgress >= 30 && titleProgress < 60 && "Generating content..."}
                            {titleProgress >= 60 && titleProgress < 90 && "Finalizing..."}
                            {titleProgress >= 90 && "Almost done..."}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">2) Subtitle</label>
                    <div className="flex gap-2">
                      <input
                        value={editing ? editForm.subtitle : form.subtitle}
                        onChange={e => editing ?
                          setEditForm({...editForm, subtitle: e.target.value}) :
                          setForm({...form, subtitle: e.target.value})
                        }
                        className="w-full border rounded px-3 py-2"
                        placeholder="Short supporting text"
                      />
                      {!editing && (
                        <button type="button" title="AI"
                          onClick={generateSubtitle}
                          disabled={generatingSubtitle}
                          className="px-2 py-2 border rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed">
                          {generatingSubtitle ? (
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs">Generating...</span>
                            </div>
                          ) : (
                            <SparklesIcon className="w-5 h-5"/>
                          )}
                        </button>
                      )}
                      {generatingSubtitle && !editing && (
                        <div className="w-full mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-600 h-2 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${subtitleProgress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {subtitleProgress < 30 && "Analyzing product..."}
                            {subtitleProgress >= 30 && subtitleProgress < 60 && "Generating content..."}
                            {subtitleProgress >= 60 && subtitleProgress < 90 && "Finalizing..."}
                            {subtitleProgress >= 90 && "Almost done..."}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">3) Header Image</label>
                    <div className="flex items-center gap-3">
                      <input type="file" accept="image/*" onChange={async (e)=>{
                        const file=(e.target as HTMLInputElement).files?.[0];
                        if(!file) return;
                        setUploading(true);
                        try{
                          const fd=new FormData();
                          fd.append('file', file);
                          const up=await fetch('/api/upload', { method:'POST', body: fd });
                          if(up.ok){
                            const d=await up.json();
                            if (editing) {
                              setEditForm(prev=>({...prev, headerImage: d.url}));
                            } else {
                              setForm(prev=>({...prev, headerImage: d.url}));
                            }
                          }
                        } finally { setUploading(false); }
                      }} />
                      {uploading && <span className="text-sm text-gray-500">Uploading…</span>}
                    </div>
                    {(editing ? editForm.headerImage : form.headerImage) && (
                      <img src={editing ? editForm.headerImage : form.headerImage} alt="header" className="mt-2 h-24 rounded border" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">4) Video Upload</label>
                    <div className="flex items-center gap-3">
                      <input type="file" accept="video/*" onChange={async (e)=>{
                        const file=(e.target as HTMLInputElement).files?.[0];
                        if(!file) return;
                        setUploading(true);
                        try{
                          const fd=new FormData();
                          fd.append('file', file);
                          const up=await fetch('/api/upload', { method:'POST', body: fd });
                          if(up.ok){
                            const d=await up.json();
                            if (editing) {
                              setEditForm(prev=>({...prev, videoUrl: d.url}));
                            } else {
                              setForm(prev=>({...prev, videoUrl: d.url}));
                            }
                          }
                        } finally { setUploading(false); }
                      }} />
                      {uploading && <span className="text-sm text-gray-500">Uploading video…</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">MP4, WebM, AVI supported</p>
                    {(editing ? editForm.videoUrl : form.videoUrl) && (
                      <video src={editing ? editForm.videoUrl : form.videoUrl} className="mt-2 h-32 rounded border" controls />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">5) Action Button Text</label>
                    <input
                      value={editing ? editForm.ctaText : form.ctaText}
                      onChange={e => editing ?
                        setEditForm({...editForm, ctaText: e.target.value}) :
                        setForm({...form, ctaText: e.target.value})
                      }
                      className="w-full border rounded px-3 py-2"
                      placeholder="Buy Now"
                    />
                  </div>
                </div>
              </div>
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
                        if (editing) {
                          setEditForm(prev=>({...prev, productId: String(p.id)}));
                        } else {
                          setForm(prev=>({...prev, productId: String(p.id)}));
                        }
                        setProductOpen(false);
                      }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2">
                        {p.image && <img src={p.image} onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} className="h-6 w-6 rounded object-cover"/>}
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Description Section */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-3">Product Description</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">6) Why Buy This Product?</label>
                    <div className="flex gap-2">
                      <textarea
                        value={editing ? editForm.productDescription : form.productDescription}
                        onChange={e => editing ?
                          setEditForm({...editForm, productDescription: e.target.value}) :
                          setForm({...form, productDescription: e.target.value})
                        }
                        className="w-full border rounded px-3 py-2 h-24 resize-none"
                        placeholder="AI will generate 10 compelling reasons to buy this product..."
                        readOnly
                      />
                      {!editing && (
                        <button type="button" title="AI Generate"
                          onClick={generateProductDescription}
                          disabled={generatingDescription}
                          className="px-3 py-2 border rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                          {generatingDescription ? (
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs">Generating...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <SparklesIcon className="w-4 h-4"/>
                              <span className="text-xs">AI Generate</span>
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                    {generatingDescription && !editing && (
                      <div className="w-full mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${descriptionProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {descriptionProgress < 30 && "Analyzing product..."}
                          {descriptionProgress >= 30 && descriptionProgress < 60 && "Generating reasons..."}
                          {descriptionProgress >= 60 && descriptionProgress < 90 && "Finalizing..."}
                          {descriptionProgress >= 90 && "Almost done..."}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Pricing Section */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Regular Price (৳)
                    </label>
                    <input
                      type="text"
                      value={editing ? editForm.regularPrice || '' : form.regularPrice || ''}
                      onChange={(e) => editing ? setEditForm({...editForm, regularPrice: e.target.value}) : setForm({...form, regularPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter regular price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Price (৳)
                    </label>
                    <input
                      type="text"
                      value={editing ? editForm.discountPrice || '' : form.discountPrice || ''}
                      onChange={(e) => editing ? setEditForm({...editForm, discountPrice: e.target.value}) : setForm({...form, discountPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter discount price"
                    />
                  </div>
                </div>
              </div>

              {/* Product Images Section */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Images</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Product Images (Multiple)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleProductImagesUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">You can select multiple images at once</p>
                </div>

                {/* Display uploaded images */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(editing ? editForm.productImages || [] : form.productImages || []).map((imageUrl: string, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeProductImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Features Section */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Features</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      7) Product Features
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        value={editing ? editForm.productFeatures || '' : form.productFeatures || ''}
                        onChange={e => editing ?
                          setEditForm({...editForm, productFeatures: e.target.value}) :
                          setForm({...form, productFeatures: e.target.value})
                        }
                        className="w-full border rounded px-3 py-2 h-24 resize-none"
                        placeholder="AI will generate 6 compelling product features..."
                        readOnly
                      />
                      {!editing && (
                        <button type="button" title="AI Generate"
                          onClick={generateProductFeatures}
                          disabled={generatingFeatures}
                          className="px-3 py-2 border rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                          {generatingFeatures ? (
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs">Generating...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <SparklesIcon className="w-4 h-4"/>
                              <span className="text-xs">AI Generate</span>
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                    {generatingFeatures && !editing && (
                      <div className="w-full mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${featuresProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {featuresProgress < 30 && "Analyzing product..."}
                          {featuresProgress >= 30 && featuresProgress < 60 && "Generating features..."}
                          {featuresProgress >= 60 && featuresProgress < 90 && "Finalizing..."}
                          {featuresProgress >= 90 && "Almost done..."}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Reviews Section */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Reviews</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      8) Customer Review Images
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleCustomerReviewsUpload}
                        className="hidden"
                        id="customerReviewsInput"
                      />
                      <label htmlFor="customerReviewsInput" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="mt-1 text-sm text-gray-600">
                            Click to upload customer review screenshots
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            PNG, JPG, JPEG up to 10MB each
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Preview uploaded images */}
                  {(editing ? editForm.customerReviews : form.customerReviews) && (editing ? editForm.customerReviews : form.customerReviews).length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Uploaded Reviews:</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(editing ? editForm.customerReviews : form.customerReviews).map((imageUrl: string, index: number) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Customer Review ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeCustomerReview(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Area Section */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Shipping & Delivery</h3>
                <div className="space-y-4">
                  {/* Free Delivery Option */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editing ? (editForm.freeDelivery || false) : (form.freeDelivery || false)}
                        onChange={e => editing ?
                          setEditForm({...editForm, freeDelivery: e.target.checked}) :
                          setForm({...form, freeDelivery: e.target.checked})
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">🚚 Free Delivery (Check if delivery is free)</span>
                    </label>
                  </div>

                  {/* Shipping Areas */}
                  {!(editing ? (editForm.freeDelivery || false) : (form.freeDelivery || false)) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shipping Areas & Charges
                      </label>
                      <p className="text-sm text-gray-600 mb-3">
                        Add shipping areas and their corresponding charges. At least one shipping area is required if free delivery is disabled.
                      </p>
                      <div className="space-y-3">
                        {(editing ? (editForm.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]) : (form.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }])).map((shipping, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={shipping.area || ''}
                              onChange={e => {
                                const currentShippingAreas = editing ? (editForm.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]) : (form.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]);
                                const newShippingAreas = [...currentShippingAreas];
                                newShippingAreas[index].area = e.target.value;
                                editing ?
                                  setEditForm({...editForm, shippingAreas: newShippingAreas}) :
                                  setForm({...form, shippingAreas: newShippingAreas});
                              }}
                              className={`flex-1 border rounded px-3 py-2 ${!shipping.area ? 'border-red-500' : 'border-gray-300'}`}
                              placeholder="e.g., ঢাকার ভিতরে"
                              required
                            />
                            <input
                              type="text"
                              value={shipping.charge || ''}
                              onChange={e => {
                                const currentShippingAreas = editing ? (editForm.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]) : (form.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]);
                                const newShippingAreas = [...currentShippingAreas];
                                newShippingAreas[index].charge = e.target.value;
                                editing ?
                                  setEditForm({...editForm, shippingAreas: newShippingAreas}) :
                                  setForm({...form, shippingAreas: newShippingAreas});
                              }}
                              className={`w-24 border rounded px-3 py-2 ${!shipping.charge ? 'border-red-500' : 'border-gray-300'}`}
                              placeholder="৳80"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const currentShippingAreas = editing ? (editForm.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]) : (form.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]);
                                if (currentShippingAreas.length > 1) {
                                  const newShippingAreas = currentShippingAreas.filter((_, i) => i !== index);
                                  editing ?
                                    setEditForm({...editForm, shippingAreas: newShippingAreas}) :
                                    setForm({...form, shippingAreas: newShippingAreas});
                                }
                              }}
                              disabled={(editing ? (editForm.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]) : (form.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }])).length <= 1}
                              className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentShippingAreas = editing ? (editForm.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]) : (form.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }]);
                            const newShippingAreas = [...currentShippingAreas, { area: '', charge: '' }];
                            editing ?
                              setEditForm({...editForm, shippingAreas: newShippingAreas}) :
                              setForm({...form, shippingAreas: newShippingAreas});
                          }}
                          className="px-3 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          + Add Shipping Area
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                  {saving ? 'Saving...' : (editing ? 'Update Landing Page' : 'Create Landing')}
                </button>
              </div>

              {/* Debug section */}
              <div className="border-t pt-4 mt-4">
                <details className="text-sm text-gray-600">
                  <summary className="cursor-pointer hover:text-gray-800">🔧 Debug Info</summary>
                  <div className="mt-2 space-y-2 text-xs">
                    <div>Product Selected: {form.productId ? 'Yes' : 'No'}</div>
                    <div>OpenAI API Key: {getOpenAIKey() ? 'Found' : 'Missing'}</div>
                    <div>Products Loaded: {products.length}</div>
                    <div>Current Title: "{form.title}"</div>
                    <div>Current Subtitle: "{form.subtitle}"</div>
                    <button
                      onClick={() => {
                        const key = getOpenAIKey();
                        alert(`API Key Status: ${key ? 'Found (' + key.length + ' chars)' : 'Missing'}\n\nKey: ${key || 'N/A'}`);
                      }}
                      className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
                    >
                      Check API Key
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/ai', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              mode: 'landing-header',
                              apiKey: getOpenAIKey(),
                              product: { name: 'Test Product' }
                            })
                          });
                          const data = await res.json();
                          alert(`Test API Response:\nStatus: ${res.status}\nData: ${JSON.stringify(data, null, 2)}`);
                        } catch (error) {
                          alert(`Test API Error: ${error}`);
                        }
                      }}
                      className="px-2 py-1 bg-blue-200 rounded text-xs hover:bg-blue-300 ml-2"
                    >
                      Test AI API
                    </button>
                  </div>
                </details>
              </div>
            </form>
          )}
          {activeTab==='overview' && (
            <div className="overflow-x-auto">
              {/* Load orders and compute per-landing summary */}
              {/* eslint-disable-next-line react-hooks/rules-of-hooks */}
              {(() => {
                // local cache on component instance
                // @ts-ignore
                if (!window.__landingOrdersCache) {
                  // fetch once
                  fetch('/api/orders')
                    .then(r => r.ok ? r.json() : Promise.resolve({ orders: [] }))
                    .then(d => {
                      // @ts-ignore
                      window.__landingOrdersCache = Array.isArray(d.orders) ? d.orders : [];
                      // force update by toggling state length (cheap rerender)
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
                <div className="text-sm text-gray-600">
                  Total: {rows.length} landing pages
                </div>
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
                  {rows.map(r=> {
                    const product = products.find(p => p.id === r.productId);
                    // @ts-ignore
                    const allOrders = (window.__landingOrdersCache || []) as any[];
                    const lpOrders = allOrders.filter(o => o.landingPageId === r.id);
                    const ordersCount = lpOrders.length;
                    const revenue = lpOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {product?.image && (
                              <img src={product.image} alt="product" className="h-8 w-8 rounded object-cover"/>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{product?.name || ''}</div>
                              <div className="text-xs text-gray-500">ID: {r.productId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-green-600">
                            ৳{r.discountPrice || r.regularPrice || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{r.viewCount || 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{ordersCount}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">৳{revenue}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={getMarketingLink(r.slug)}
                              readOnly
                              className="text-xs bg-gray-100 border rounded px-2 py-1 w-48"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(getMarketingLink(r.slug));
                                alert('Marketing link copied to clipboard!');
                              }}
                              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Copy
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={getMarketingLink(r.slug)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              View
                            </a>
                            <button
                              onClick={() => startEdit(r)}
                              className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteLanding(r.id)}
                              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length===0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={8}>
                        No landing pages yet. Create your first landing page!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


