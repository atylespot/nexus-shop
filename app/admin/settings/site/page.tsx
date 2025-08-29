"use client";
import { useState, useEffect } from "react";

// Toast notification component
const Toast = ({ message, type, isVisible, onClose }: { 
  message: string; 
  type: 'success' | 'error'; 
  isVisible: boolean; 
  onClose: () => void; 
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 transform ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
        {message}
      </div>
    </div>
  );
};

const siteSettingsTabs = ["Header", "Banner", "Footer"];

export default function SiteSettingsPage() {
  const [activeTab, setActiveTab] = useState("Header");
  
  // Toast notification state
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as 'success' | 'error'
  });
  
  // Defaults
  const defaultHeader = {
    topHeaderText: "🚚 Free delivery on orders above $50 • 🆕 New products arriving soon • 💰 Special discounts for first-time customers • 🎉 Limited time offers available",
    enableNewsTicker: true,
    autoScrollText: true,
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    topHeaderBgColor: "#2563eb",
    topHeaderTextColor: "#ffffff",
    logo: "",
    searchInputColor: "#111827",
    // New size controls (defaults)
    headerHeight: 64, // px
    headerMaxWidth: 1280, // px
    headerHorizontalPadding: 16, // px
    headerFullWidth: false // New
  } as any;
  // Header Settings State
  const [headerSettings, setHeaderSettings] = useState({ ...defaultHeader });

  const defaultBannerItem = {
    id: 1,
    title: "Welcome to Nexus Shop",
    subtitle: "Discover amazing products at unbeatable prices",
    image: "",
    buttonText: "Shop Now",
    buttonLink: "/products",
    secondaryButtonText: "Browse Categories",
    secondaryButtonLink: "/categories",
    backgroundColor: "from-blue-600 to-purple-600",
    textColor: "#ffffff",
    isActive: true,
    showOverlay: true
  };
  const defaultFlashSale = {
    isActive: false,
    title: "🔥 FLASH SALE",
    subtitle: "Up to 70% OFF on selected items",
    backgroundColor: "from-red-500 to-orange-500",
    textColor: "#ffffff",
    buttonText: "Shop Now",
    buttonLink: "/flash-sale",
    image: ""
  };
  const defaultBanner = {
    banners: [ { ...defaultBannerItem } ],
    autoSlide: true,
    slideInterval: 5000,
    matchImageSize: false,
    flashSaleBanner: { ...defaultFlashSale }
  };
  // Banner Settings State
  const [bannerSettings, setBannerSettings] = useState({ ...defaultBanner });

  // Footer Settings State
  const defaultFooter = {
    companyName: "Nexus Shop",
    tagline: "Your one-stop destination for quality products at great prices.",
    copyright: "© 2025 Nexus Shop. All rights reserved.",
    quickLinks: [
      { name: "Home", url: "/" },
      { name: "Products", url: "/products" },
      { name: "Categories", url: "/categories" },
      { name: "About", url: "/about" }
    ],
    customerService: [
      { name: "Contact Us", url: "/contact" },
      { name: "Shipping Info", url: "/shipping" },
      { name: "Returns", url: "/returns" },
      { name: "FAQ", url: "/faq" }
    ],
    socialLinks: {
      facebook: "",
      instagram: "",
      twitter: "",
      youtube: ""
    },
    contactInfo: {
      email: "info@nexusshop.com",
      phone: "+1 (555) 123-4567",
      whatsapp: "+880 1234-567890",
      address: "123 Commerce St, Business City, BC 12345"
    },
    backgroundColor: "#111827",
    textColor: "#ffffff",
    linkColor: "#9ca3af",
    linkHoverColor: "#ffffff"
  };
  const [footerSettings, setFooterSettings] = useState({ ...defaultFooter });

  // Load settings from server (if available) then localStorage with safe defaults
  useEffect(() => {
    // 1) Try server → hydrate localStorage for cross-browser consistency
    (async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          try {
            if (json.header) {
              localStorage.setItem('nexus-shop-header-settings', JSON.stringify(json.header));
            }
            if (json.banner) {
              localStorage.setItem('nexus-shop-banner-settings', JSON.stringify(json.banner));
            }
            if (json.footer) {
              localStorage.setItem('nexus-shop-footer-settings', JSON.stringify(json.footer));
            }
            localStorage.setItem('nexus-shop-settings-last-update', String(Date.now()));
          } catch {}
        }
      } catch {}
    })();

    const savedSettings = localStorage.getItem('nexus-shop-header-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setHeaderSettings({ ...defaultHeader, ...parsed });
      } catch {
        setHeaderSettings({ ...defaultHeader });
      }
    }
    
    const savedBannerSettings = localStorage.getItem('nexus-shop-banner-settings');
    if (savedBannerSettings) {
      try {
        const parsed = JSON.parse(savedBannerSettings) || {};
        const normalizedBanners = Array.isArray(parsed.banners) && parsed.banners.length > 0
          ? parsed.banners.map((b: any, idx: number) => ({
              ...defaultBannerItem,
              id: b?.id ?? Date.now() + idx,
              title: b?.title ?? defaultBannerItem.title,
              subtitle: b?.subtitle ?? defaultBannerItem.subtitle,
              image: b?.image ?? "",
              buttonText: b?.buttonText ?? defaultBannerItem.buttonText,
              buttonLink: b?.buttonLink ?? defaultBannerItem.buttonLink,
              secondaryButtonText: b?.secondaryButtonText ?? defaultBannerItem.secondaryButtonText,
              secondaryButtonLink: b?.secondaryButtonLink ?? defaultBannerItem.secondaryButtonLink,
              backgroundColor: b?.backgroundColor ?? defaultBannerItem.backgroundColor,
              textColor: b?.textColor ?? defaultBannerItem.textColor,
              isActive: typeof b?.isActive === 'boolean' ? b.isActive : true,
              showOverlay: typeof b?.showOverlay === 'boolean' ? b.showOverlay : true
            }))
          : [ { ...defaultBannerItem } ];

        const normalized = {
          ...defaultBanner,
          ...parsed,
          banners: normalizedBanners,
          autoSlide: typeof parsed.autoSlide === 'boolean' ? parsed.autoSlide : defaultBanner.autoSlide,
          slideInterval: Number.isFinite(parsed.slideInterval) ? parsed.slideInterval : defaultBanner.slideInterval,
          matchImageSize: typeof parsed.matchImageSize === 'boolean' ? parsed.matchImageSize : false,
          flashSaleBanner: { ...defaultFlashSale, ...(parsed.flashSaleBanner || {}) }
        };
        setBannerSettings(normalized);
      } catch {
        setBannerSettings({ ...defaultBanner });
      }
    }
    
    const savedFooterSettings = localStorage.getItem('nexus-shop-footer-settings');
    if (savedFooterSettings) {
      try {
        const parsed = JSON.parse(savedFooterSettings);
        setFooterSettings({ ...defaultFooter, ...parsed });
      } catch {
        setFooterSettings({ ...defaultFooter });
      }
    }
    
    // Load active tab from localStorage
    const savedTab = localStorage.getItem('nexus-shop-settings-active-tab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save active tab to localStorage
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem('nexus-shop-settings-active-tab', tab);
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  // Save header settings (server + local)
  const saveHeaderSettings = async () => {
    try {
      console.log('💾 Saving header settings:', headerSettings);
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ header: headerSettings })
      });
      if (!res.ok) throw new Error('Failed to save to server');
      // Persist locally as well
      localStorage.setItem('nexus-shop-header-settings', JSON.stringify(headerSettings));
      localStorage.setItem('nexus-shop-settings-last-update', Date.now().toString());
      showToast('Header settings saved successfully!', 'success');
    } catch (e) {
      console.error('Save header error:', e);
      showToast('Failed to save header. Please try again.', 'error');
    }
  };

  // Save banner settings (server + local)
  const saveBannerSettings = async () => {
    try {
      console.log('💾 Saving banner settings:', bannerSettings);
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner: bannerSettings })
      });
      if (!res.ok) throw new Error('Failed to save to server');
      localStorage.setItem('nexus-shop-banner-settings', JSON.stringify(bannerSettings));
      localStorage.setItem('nexus-shop-settings-last-update', Date.now().toString());
      showToast('Banner settings saved successfully!', 'success');
    } catch (e) {
      console.error('Save banner error:', e);
      showToast('Failed to save banner. Please try again.', 'error');
    }
  };

  // Save footer settings (server + local)
  const saveFooterSettings = async () => {
    try {
      console.log('💾 Saving footer settings:', footerSettings);
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ footer: footerSettings })
      });
      if (!res.ok) throw new Error('Failed to save to server');
      localStorage.setItem('nexus-shop-footer-settings', JSON.stringify(footerSettings));
      localStorage.setItem('nexus-shop-settings-last-update', Date.now().toString());
      showToast('Footer settings saved successfully!', 'success');
    } catch (e) {
      console.error('Save footer error:', e);
      showToast('Failed to save footer. Please try again.', 'error');
    }
  };

  // Force reload all frontend pages to show settings changes
  const forceReloadFrontend = () => {
    // Clear browser cache only, NOT localStorage settings
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('nexus-shop') || name.includes('localhost')) {
            caches.delete(name);
          }
        });
      });
    }
    
    showToast('Settings saved! Frontend will update automatically.', 'success');
  };

  // Clear all cache and force reload
  const clearCacheAndReload = () => {
    // Clear all localStorage settings
    localStorage.removeItem('nexus-shop-header-settings');
    localStorage.removeItem('nexus-shop-banner-settings');
    localStorage.removeItem('nexus-shop-footer-settings');
    localStorage.removeItem('nexus-shop-settings-active-tab');
    
    // Clear any other related cache
    if (typeof window !== 'undefined') {
      // Clear browser cache for this domain
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('nexus-shop') || name.includes('localhost')) {
              caches.delete(name);
            }
          });
        });
      }
      
      // Force reload the page
      window.location.reload();
    }
    
    showToast('Cache cleared! Page will reload...', 'success');
  };

  // Update header settings
  const updateHeaderSetting = (key: string, value: any) => {
    setHeaderSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  // Update banner settings
  const updateBannerSetting = (key: string, value: any) => {
    setBannerSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  // Update flash sale banner settings
  const updateFlashSaleBanner = (key: string, value: any) => {
    setBannerSettings((prev: any) => ({
      ...prev,
      flashSaleBanner: {
        ...prev.flashSaleBanner,
        [key]: value
      }
    }));
  };

  // Add new banner
  const addBanner = () => {
    const newBanner = {
      id: Date.now(),
      title: "New Banner",
      subtitle: "Enter subtitle here",
      image: "",
      buttonText: "Shop Now",
      buttonLink: "/products",
      secondaryButtonText: "Learn More",
      secondaryButtonLink: "/about",
      backgroundColor: "from-blue-600 to-purple-600",
      textColor: "#ffffff",
      isActive: true,
      showOverlay: true
    };
    setBannerSettings(prev => ({
      ...prev,
      banners: [...prev.banners, newBanner]
    }));
  };

  // Remove banner
  const removeBanner = (id: number) => {
    setBannerSettings(prev => ({
      ...prev,
      banners: prev.banners.filter(banner => banner.id !== id)
    }));
  };

  // Update specific banner
  const updateBanner = (id: number, key: string, value: any) => {
    setBannerSettings(prev => ({
      ...prev,
      banners: prev.banners.map(banner => 
        banner.id === id ? { ...banner, [key]: value } : banner
      )
    }));
  };

  // Update footer settings
  const updateFooterSetting = (key: string, value: any) => {
    setFooterSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Update footer link
  const updateFooterLink = (section: string, index: number, key: string, value: any) => {
    setFooterSettings((prev: any) => ({
      ...prev,
      [section]: prev[section].map((link: any, i: number) => 
        i === index ? { ...link, [key]: value } : link
      )
    }));
  };

  // Add footer link
  const addFooterLink = (section: string) => {
    setFooterSettings(prev => ({
      ...prev,
      [section]: [...(prev[section] as any[] || []), { name: "New Link", url: "/" }]
    }));
  };

  // Remove footer link
  const removeFooterLink = (section: string, index: number) => {
    setFooterSettings(prev => ({
      ...prev,
      [section]: (prev[section] as any[] || []).filter((_: any, i: number) => i !== index)
    }));
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Site Settings</h1>
        <button 
          onClick={clearCacheAndReload}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
          title="Clear all cache and reload page to fix browser display issues"
        >
          🗑️ Clear Cache & Reload
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow border">
        <div className="border-b border-gray-200">
          <div className="flex gap-1 p-4">
            {siteSettingsTabs.map(tab => (
              <button 
                key={tab} 
                onClick={() => handleTabChange(tab)} 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab 
                    ? "bg-blue-100 text-blue-700 border border-blue-200" 
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === "Header" && (
            <div>
              <h3 className="text-lg font-medium mb-4">Header Settings</h3>
              <div className="space-y-6">
                {/* Header Size Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Header Height (px)</label>
                    <input 
                      type="number" 
                      min={40} 
                      max={140}
                      value={Number((headerSettings as any).headerHeight ?? 64)}
                      onChange={(e) => updateHeaderSetting('headerHeight', parseInt(e.target.value || '0'))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Header Max Width (px)</label>
                    <input 
                      type="number" 
                      min={960} 
                      max={1920}
                      step={10}
                      value={Number((headerSettings as any).headerMaxWidth ?? 1280)}
                      onChange={(e) => updateHeaderSetting('headerMaxWidth', parseInt(e.target.value || '0'))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horizontal Padding (px)</label>
                    <input 
                      type="number" 
                      min={0} 
                      max={48}
                      value={Number((headerSettings as any).headerHorizontalPadding ?? 16)}
                      onChange={(e) => updateHeaderSetting('headerHorizontalPadding', parseInt(e.target.value || '0'))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Full width toggle */}
                <label className="mt-4 flex items-center">
                  <input
                    type="checkbox"
                    checked={Boolean((headerSettings as any).headerFullWidth)}
                    onChange={(e) => updateHeaderSetting('headerFullWidth', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Full Width (stretch colors edge-to-edge)</span>
                </label>

                {/* Existing controls below (ticker, colors, logo etc.) */}
                {/* Top Header Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Top Header Text (News Ticker)</label>
                  <div className="space-y-3">
                    <textarea 
                      rows={2}
                      value={headerSettings.topHeaderText}
                      onChange={(e) => updateHeaderSetting('topHeaderText', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter news ticker text (e.g., Free delivery on orders above $50, New products arriving soon...)"
                    />
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={headerSettings.enableNewsTicker}
                          onChange={(e) => updateHeaderSetting('enableNewsTicker', e.target.checked)}
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-600">Enable news ticker</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={headerSettings.autoScrollText}
                          onChange={(e) => updateHeaderSetting('autoScrollText', e.target.checked)}
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-600">
                          Auto-scroll text {headerSettings.autoScrollText && <span className="text-blue-600">🔄</span>}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Top Header Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Top Header Background Color</label>
                  <div className="flex items-center space-x-4">
                    <input 
                      type="color"
                      value={headerSettings.topHeaderBgColor}
                      onChange={(e) => updateHeaderSetting('topHeaderBgColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={headerSettings.topHeaderBgColor}
                      onChange={(e) => updateHeaderSetting('topHeaderBgColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#2563eb"
                    />
                    <button 
                      onClick={() => updateHeaderSetting('topHeaderBgColor', '#2563eb')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Top Header Text Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Top Header Text Color</label>
                  <div className="flex items-center space-x-4">
                    <input 
                      type="color"
                      value={headerSettings.topHeaderTextColor}
                      onChange={(e) => updateHeaderSetting('topHeaderTextColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={headerSettings.topHeaderTextColor}
                      onChange={(e) => updateHeaderSetting('topHeaderTextColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#ffffff"
                    />
                    <button 
                      onClick={() => updateHeaderSetting('topHeaderTextColor', '#ffffff')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Header Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Header Background Color</label>
                  <div className="flex items-center space-x-4">
                    <input 
                      type="color"
                      value={headerSettings.backgroundColor}
                      onChange={(e) => updateHeaderSetting('backgroundColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={headerSettings.backgroundColor}
                      onChange={(e) => updateHeaderSetting('backgroundColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#ffffff"
                    />
                    <button 
                      onClick={() => updateHeaderSetting('backgroundColor', '#ffffff')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Header Text Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Header Text Color</label>
                  <div className="flex items-center space-x-4">
                    <input 
                      type="color"
                      value={headerSettings.textColor}
                      onChange={(e) => updateHeaderSetting('textColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={headerSettings.textColor}
                      onChange={(e) => updateHeaderSetting('textColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#1f2937"
                    />
                    <button 
                      onClick={() => updateHeaderSetting('textColor', '#1f2937')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Search Input Text Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Input Text Color</label>
                  <div className="flex items-center space-x-4">
                    <input 
                      type="color"
                      value={(headerSettings as any).searchInputColor || '#111827'}
                      onChange={(e) => updateHeaderSetting('searchInputColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={(headerSettings as any).searchInputColor || ''}
                      onChange={(e) => updateHeaderSetting('searchInputColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#111827"
                    />
                    <button 
                      onClick={() => updateHeaderSetting('searchInputColor', '#111827')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  <div className="space-y-3">
                    {headerSettings.logo ? (
                      <div className="flex items-center space-x-4">
                        <img 
                          src={headerSettings.logo} 
                          alt="Header Logo" 
                          className="w-16 h-16 object-contain border border-gray-300 rounded-lg"
                        />
                        <button 
                          onClick={() => updateHeaderSetting('logo', '')}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors text-sm"
                        >
                          Remove Logo
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">Upload header logo</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                const result = e.target?.result as string;
                                updateHeaderSetting('logo', result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="mt-2 w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Menu (placeholder) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Navigation Menu</label>
                  <textarea 
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter navigation menu items..."
                  />
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button 
                    onClick={saveHeaderSettings}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save Header Settings
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "Banner" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Banner Settings</h3>
                <button 
                  onClick={addBanner}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  + Add New Banner
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Banner Settings */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">General Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={bannerSettings.autoSlide}
                        onChange={(e) => updateBannerSetting('autoSlide', e.target.checked)}
                        className="mr-2" 
                      />
                      <span className="text-sm text-gray-600">Auto-slide banners</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={Boolean((bannerSettings as any).matchImageSize)}
                        onChange={(e) => updateBannerSetting('matchImageSize', e.target.checked)}
                        className="mr-2" 
                      />
                      <span className="text-sm text-gray-600">Match image size (auto height)</span>
                    </label>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Slide Interval (ms)</label>
                      <input 
                        type="number"
                        value={bannerSettings.slideInterval}
                        onChange={(e) => updateBannerSetting('slideInterval', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1000"
                        max="10000"
                        step="500"
                      />
                    </div>
                  </div>
                </div>

                {/* Banners List */}
                <div className="space-y-4">
                  {bannerSettings.banners.map((banner, index) => (
                    <div key={banner.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-gray-700">Banner {index + 1}</h4>
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={banner.isActive}
                              onChange={(e) => updateBanner(banner.id, 'isActive', e.target.checked)}
                              className="mr-2" 
                            />
                            <span className="text-sm text-gray-600">Active</span>
                          </label>
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={banner.showOverlay !== false}
                              onChange={(e) => updateBanner(banner.id, 'showOverlay', e.target.checked)}
                              className="mr-2" 
                            />
                            <span className="text-sm text-gray-600">Show overlay (title/buttons)</span>
                          </label>
                          <button 
                            onClick={() => removeBanner(banner.id)}
                            className="px-2 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Banner Image */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
                          {banner.image ? (
                            <div className="flex items-center space-x-3">
                              <img 
                                src={banner.image} 
                                alt="Banner Preview" 
                                className="w-20 h-20 object-cover border border-gray-300 rounded-lg"
                              />
                              <button 
                                onClick={() => updateBanner(banner.id, 'image', '')}
                                className="px-2 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                      const result = e.target?.result as string;
                                      updateBanner(banner.id, 'image', result);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>

                        {/* Banner Content */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input 
                              type="text"
                              value={banner.title}
                              onChange={(e) => updateBanner(banner.id, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter banner title..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                            <input 
                              type="text"
                              value={banner.subtitle}
                              onChange={(e) => updateBanner(banner.id, 'subtitle', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter banner subtitle..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="text"
                              value={banner.buttonText}
                              onChange={(e) => updateBanner(banner.id, 'buttonText', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Button text..."
                            />
                            <input 
                              type="text"
                              value={banner.buttonLink}
                              onChange={(e) => updateBanner(banner.id, 'buttonLink', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="/products"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="text"
                              value={banner.secondaryButtonText}
                              onChange={(e) => updateBanner(banner.id, 'secondaryButtonText', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Button text..."
                            />
                            <input 
                              type="text"
                              value={banner.secondaryButtonLink}
                              onChange={(e) => updateBanner(banner.id, 'secondaryButtonLink', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="/categories"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Background Color */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Background Gradient</label>
                        <select 
                          value={banner.backgroundColor}
                          onChange={(e) => updateBanner(banner.id, 'backgroundColor', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="from-blue-600 to-purple-600">Blue to Purple</option>
                          <option value="from-green-600 to-blue-600">Green to Blue</option>
                          <option value="from-red-600 to-pink-600">Red to Pink</option>
                          <option value="from-yellow-600 to-orange-600">Yellow to Orange</option>
                          <option value="from-indigo-600 to-purple-600">Indigo to Purple</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Flash Sale Banner Settings */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-3">🔥 Flash Sale Banner</h4>
                  <div className="space-y-4">
                    {/* Enable/Disable */}
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={bannerSettings.flashSaleBanner.isActive}
                        onChange={(e) => updateFlashSaleBanner('isActive', e.target.checked)}
                        className="mr-2" 
                      />
                      <span className="text-sm text-orange-700">Enable Flash Sale Banner</span>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">Banner Title</label>
                      <input 
                        type="text"
                        value={bannerSettings.flashSaleBanner.title}
                        onChange={(e) => updateFlashSaleBanner('title', e.target.value)}
                        className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="🔥 FLASH SALE"
                      />
                    </div>

                    {/* Subtitle */}
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">Banner Subtitle</label>
                      <input 
                        type="text"
                        value={bannerSettings.flashSaleBanner.subtitle}
                        onChange={(e) => updateFlashSaleBanner('subtitle', e.target.value)}
                        className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Up to 70% OFF on selected items"
                      />
                    </div>

                    {/* Background Color */}
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">Background Gradient</label>
                      <select 
                        value={bannerSettings.flashSaleBanner.backgroundColor}
                        onChange={(e) => updateFlashSaleBanner('backgroundColor', e.target.value)}
                        className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="from-red-500 to-orange-500">Red to Orange</option>
                        <option value="from-red-600 to-pink-600">Red to Pink</option>
                        <option value="from-orange-500 to-yellow-500">Orange to Yellow</option>
                        <option value="from-purple-500 to-pink-500">Purple to Pink</option>
                        <option value="from-blue-500 to-purple-500">Blue to Purple</option>
                      </select>
                    </div>

                    {/* Button Text */}
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">Button Text</label>
                      <input 
                        type="text"
                        value={bannerSettings.flashSaleBanner.buttonText}
                        onChange={(e) => updateFlashSaleBanner('buttonText', e.target.value)}
                        className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Shop Now"
                      />
                    </div>

                                         {/* Button Link */}
                     <div>
                       <label className="block text-sm font-medium text-orange-700 mb-1">Button Link</label>
                       <input 
                         type="text"
                         value={bannerSettings.flashSaleBanner.buttonLink}
                         onChange={(e) => updateFlashSaleBanner('buttonLink', e.target.value)}
                         className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                         placeholder="/flash-sale"
                       />
                     </div>

                     {/* Background Image */}
                     <div>
                       <label className="block text-sm font-medium text-orange-700 mb-1">Background Image</label>
                       {bannerSettings.flashSaleBanner.image ? (
                         <div className="flex items-center space-x-3">
                           <img 
                             src={bannerSettings.flashSaleBanner.image} 
                             alt="Flash Sale Banner Background" 
                             className="w-20 h-20 object-cover border border-orange-300 rounded-lg"
                           />
                           <button 
                             onClick={() => updateFlashSaleBanner('image', '')}
                             className="px-2 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 transition-colors"
                           >
                             Remove Image
                           </button>
                         </div>
                       ) : (
                         <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 text-center">
                           <svg className="mx-auto h-12 w-12 text-orange-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                             <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                           </svg>
                           <p className="mt-2 text-sm text-orange-600">Upload background image</p>
                           <input
                             type="file"
                             accept="image/*"
                             onChange={(e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                 const reader = new FileReader();
                                 reader.onload = (e) => {
                                   const result = e.target?.result as string;
                                   updateFlashSaleBanner('image', result);
                                 };
                                 reader.readAsDataURL(file);
                               }
                             }}
                             className="mt-2 w-full"
                           />
                         </div>
                       )}
                     </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button 
                    onClick={saveBannerSettings}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save Banner Settings
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "Footer" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Footer Settings</h3>
                <button 
                  onClick={saveFooterSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Footer Settings
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Company Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Company Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Company Name</label>
                      <input 
                        type="text"
                        value={footerSettings.companyName}
                        onChange={(e) => updateFooterSetting('companyName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nexus Shop"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Tagline</label>
                      <input 
                        type="text"
                        value={footerSettings.tagline}
                        onChange={(e) => updateFooterSetting('tagline', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your one-stop destination..."
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Copyright Text</label>
                    <input 
                      type="text"
                      value={footerSettings.copyright}
                      onChange={(e) => updateFooterSetting('copyright', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="© 2025 Nexus Shop. All rights reserved."
                    />
                  </div>
                </div>

                {/* Quick Links */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700">Quick Links</h4>
                    <button 
                      onClick={() => addFooterLink('quickLinks')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      + Add Link
                    </button>
                  </div>
                  <div className="space-y-3">
                    {footerSettings.quickLinks.map((link, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input 
                          type="text"
                          value={link.name}
                          onChange={(e) => updateFooterLink('quickLinks', index, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Link name..."
                        />
                        <input 
                          type="text"
                          value={link.url}
                          onChange={(e) => updateFooterLink('quickLinks', index, 'url', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="/link"
                        />
                        <button 
                          onClick={() => removeFooterLink('quickLinks', index)}
                          className="px-2 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Service */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700">Customer Service</h4>
                    <button 
                      onClick={() => addFooterLink('customerService')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      + Add Link
                    </button>
                  </div>
                  <div className="space-y-3">
                    {footerSettings.customerService.map((link, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input 
                          type="text"
                          value={link.name}
                          onChange={(e) => updateFooterLink('customerService', index, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Link name..."
                        />
                        <input 
                          type="text"
                          value={link.url}
                          onChange={(e) => updateFooterLink('customerService', index, 'url', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="/link"
                        />
                        <button 
                          onClick={() => removeFooterLink('customerService', index)}
                          className="px-2 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Social Media Links</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Facebook</label>
                      <input 
                        type="url"
                        value={footerSettings.socialLinks.facebook}
                        onChange={(e) => updateFooterSetting('socialLinks', { ...footerSettings.socialLinks, facebook: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Instagram</label>
                      <input 
                        type="url"
                        value={footerSettings.socialLinks.instagram}
                        onChange={(e) => updateFooterSetting('socialLinks', { ...footerSettings.socialLinks, instagram: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Twitter</label>
                      <input 
                        type="url"
                        value={footerSettings.socialLinks.twitter}
                        onChange={(e) => updateFooterSetting('socialLinks', { ...footerSettings.socialLinks, twitter: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">YouTube</label>
                      <input 
                        type="url"
                        value={footerSettings.socialLinks.youtube}
                        onChange={(e) => updateFooterSetting('socialLinks', { ...footerSettings.socialLinks, youtube: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                      <input 
                        type="email"
                        value={footerSettings.contactInfo.email}
                        onChange={(e) => updateFooterSetting('contactInfo', { ...footerSettings.contactInfo, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="info@nexusshop.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                      <input 
                        type="tel"
                        value={footerSettings.contactInfo.phone}
                        onChange={(e) => updateFooterSetting('contactInfo', { ...footerSettings.contactInfo, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">WhatsApp Number</label>
                    <input 
                      type="tel"
                      value={footerSettings.contactInfo.whatsapp}
                      onChange={(e) => updateFooterSetting('contactInfo', { ...footerSettings.contactInfo, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+880 1234-567890"
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                    <textarea 
                      rows={2}
                      value={footerSettings.contactInfo.address}
                      onChange={(e) => updateFooterSetting('contactInfo', { ...footerSettings.contactInfo, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123 Commerce St, Business City, BC 12345"
                    />
                  </div>
                </div>

                {/* Footer Colors */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Footer Colors</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Background</label>
                      <input 
                        type="color"
                        value={footerSettings.backgroundColor}
                        onChange={(e) => updateFooterSetting('backgroundColor', e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Text Color</label>
                      <input 
                        type="color"
                        value={footerSettings.textColor}
                        onChange={(e) => updateFooterSetting('textColor', e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Link Color</label>
                      <input 
                        type="color"
                        value={footerSettings.linkColor}
                        onChange={(e) => updateFooterSetting('linkColor', e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Link Hover</label>
                      <input 
                        type="color"
                        value={footerSettings.linkHoverColor}
                        onChange={(e) => updateFooterSetting('linkHoverColor', e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Save Site Settings
        </button>
      </div>
      
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
