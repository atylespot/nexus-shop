"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { defaultHeaderSettings, HeaderSettings } from "@/lib/header-settings";
import { cachedApi } from "@/lib/data-service";
import { useCart } from '../contexts/CartContext';
import SearchBar from './SearchBar';
import { trackEvent } from '@/lib/pixelTracking';

interface CustomerInfo { id: number; name: string; email?: string; phone?: string; avatarUrl?: string }

interface SharedHeaderProps {
  headerSettings?: HeaderSettings;
  setIsMobileMenuOpen?: (value: boolean) => void;
  isMobileMenuOpen?: boolean;
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  cartCount?: number;
}

export default function SharedHeader({ 
  headerSettings: externalHeaderSettings,
  setIsMobileMenuOpen: externalSetIsMobileMenuOpen,
  isMobileMenuOpen: externalIsMobileMenuOpen,
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery,
  cartCount: externalCartCount
}: SharedHeaderProps = {}) {
  const router = useRouter();
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>(defaultHeaderSettings);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const { cartCount: contextCartCount } = useCart();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  // Use external props if provided, otherwise use internal state
  const finalHeaderSettings = externalHeaderSettings || headerSettings;
  const finalIsMobileMenuOpen = externalIsMobileMenuOpen !== undefined ? externalIsMobileMenuOpen : isMobileMenuOpen;
  const finalSetIsMobileMenuOpen = externalSetIsMobileMenuOpen || setIsMobileMenuOpen;
  const finalSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : searchQuery;
  const finalSetSearchQuery = externalSetSearchQuery || setSearchQuery;
  const finalCartCount = externalCartCount !== undefined ? externalCartCount : contextCartCount;

  // Debounced search function
  useEffect(() => {
    const searchProducts = async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setSearchSuggestions(data.products || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Search suggestions error:', error);
        setSearchSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (finalSearchQuery !== externalSearchQuery) {
        searchProducts(finalSearchQuery);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [finalSearchQuery, externalSearchQuery]);

  useEffect(() => {
    setIsMounted(true);

    const applyHeaderSettings = () => {
      const savedSettings = localStorage.getItem('nexus-shop-header-settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          const normalizedSettings = {
            ...defaultHeaderSettings,
            ...parsed,
            backgroundColor: parsed.backgroundColor || defaultHeaderSettings.backgroundColor,
            textColor: parsed.textColor || defaultHeaderSettings.textColor,
            topHeaderBgColor: parsed.topHeaderBgColor || defaultHeaderSettings.topHeaderBgColor,
            topHeaderTextColor: parsed.topHeaderTextColor || defaultHeaderSettings.topHeaderTextColor
          };
          setHeaderSettings(normalizedSettings);
        } catch (error) {
          console.error('Error parsing header settings:', error);
        }
      }
    };

    // Initial apply
    applyHeaderSettings();

    // Listen for settings changes from Admin tab and re-apply without reload
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === 'nexus-shop-header-settings' || e.key === 'nexus-shop-settings-last-update') {
        applyHeaderSettings();
      }
    };
    window.addEventListener('storage', onStorage);

    // Warm up route bundles and API caches for instant navigation
    try {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(async () => {
          try {
            await Promise.allSettled([
              cachedApi.getProducts(),
              cachedApi.getCategories(),
            ]);
          } catch {}
        });
      } else {
        Promise.allSettled([
          cachedApi.getProducts(),
          cachedApi.getCategories(),
        ]);
      }
    } catch {}

    try {
      router.prefetch('/');
      router.prefetch('/products');
      router.prefetch('/categories');
      router.prefetch('/about');
      router.prefetch('/contact');
      router.prefetch('/login');
      router.prefetch('/register');
    } catch {}

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Load customer session (for header account menu)
  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch('/api/customer/me');
        const data = await res.json();
        if (data?.loggedIn) setCustomer(data.customer);
        else setCustomer(null);
      } catch {}
    };
    loadMe();
  }, []);

  // Always render a stable header; we only delay dynamic settings application
  // to avoid layout shift, not the header itself

  const navigate = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    try {
      const label = href.replace('/', '') || 'home';
      trackEvent('NavClick', {
        content_name: `nav_${label}`,
        content_category: 'navigation',
        content_ids: [`nav_${label}`],
        content_type: 'link',
        value: 0,
        currency: 'BDT',
        num_items: 1
      }, { enableClientTracking: true, enableServerTracking: true });
    } catch {}
    router.push(href);
  };

  return (
    <>
      {/* Top Header News Ticker */}
      {finalHeaderSettings.enableNewsTicker && (
        <div className="sticky top-0 z-50">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8" style={finalHeaderSettings.headerFullWidth ? undefined : { maxWidth: (finalHeaderSettings.headerMaxWidth || 1280) + 'px' }}>
            <div 
              className="py-2 overflow-hidden"
              style={{ backgroundColor: finalHeaderSettings.topHeaderBgColor, color: finalHeaderSettings.topHeaderTextColor }}
            >
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">📢</span>
                <div className="flex-1 overflow-hidden relative">
                  {finalHeaderSettings.autoScrollText && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs opacity-60 animate-pulse">
                      🔄
                    </div>
                  )}
                  <div className={`whitespace-nowrap ${finalHeaderSettings.autoScrollText ? 'animate-marquee' : ''}`}>
                    <span className="inline-block mr-8">
                      {finalHeaderSettings.topHeaderText}
                    </span>
                    {finalHeaderSettings.autoScrollText && (
                      <span className="inline-block mr-8">
                        {finalHeaderSettings.topHeaderText}
                      </span>
                    )}
                    {finalHeaderSettings.autoScrollText && (
                      <span className="inline-block mr-8">
                        {finalHeaderSettings.topHeaderText}
                      </span>
                    )}
                    {finalHeaderSettings.autoScrollText && (
                      <span className="inline-block mr-8">
                        {finalHeaderSettings.topHeaderText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-50 -mt-1">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8" style={finalHeaderSettings.headerFullWidth ? undefined : { maxWidth: (finalHeaderSettings.headerMaxWidth || 1280) + 'px' }}>
          <div 
            className="shadow-sm"
            style={{ backgroundColor: finalHeaderSettings.backgroundColor }}
          >
            <div 
              className="flex justify-between items-center"
              style={{ height: (finalHeaderSettings.headerHeight || 64) + 'px', paddingLeft: (finalHeaderSettings.headerHorizontalPadding || 16) + 'px', paddingRight: (finalHeaderSettings.headerHorizontalPadding || 16) + 'px' }}
            >
              <div className="flex-shrink-0">
                <Link href="/" onClick={(e)=>navigate(e,'/')} className="flex items-center space-x-2 mr-3 md:mr-6" style={{ color: finalHeaderSettings.textColor }}>
                  {finalHeaderSettings.logo ? (
                    <img 
                      src={finalHeaderSettings.logo} 
                      alt="Nexus Shop Logo" 
                      className="w-auto object-contain"
                      style={{ height: Math.max(24, Math.min(48, (finalHeaderSettings.headerHeight || 64) - 24)) + 'px' }}
                    />
                  ) : (
                    <span className="text-2xl font-bold">Nexus Shop</span>
                  )}
                </Link>
              </div>

              <nav className="hidden md:flex space-x-8 ml-4 md:ml-8">
                <Link href="/" onClick={(e)=>navigate(e,'/')} className="hover:text-blue-600 px-3 py-2 text-sm font-medium" style={{ color: finalHeaderSettings.textColor }}>
                  Home
                </Link>
                <Link href="/products" onClick={(e)=>navigate(e,'/products')} className="hover:text-blue-600 px-3 py-2 text-sm font-medium" style={{ color: finalHeaderSettings.textColor }}>
                  Products
                </Link>
                <Link href="/categories" onClick={(e)=>navigate(e,'/categories')} className="hover:text-blue-600 px-3 py-2 text-sm font-medium" style={{ color: finalHeaderSettings.textColor }}>
                  Categories
                </Link>
                <Link href="/about" onClick={(e)=>navigate(e,'/about')} className="hover:text-blue-600 px-3 py-2 text-sm font-medium" style={{ color: finalHeaderSettings.textColor }}>
                  About
                </Link>
                <Link href="/contact" onClick={(e)=>navigate(e,'/contact')} className="hover:text-blue-600 px-3 py-2 text-sm font-medium" style={{ color: finalHeaderSettings.textColor }}>
                  Contact
                </Link>
              </nav>

              {/* Search Bar */}
              <div className="flex-1 max-w-lg mx-4">
                <div className="relative">
                  <input
                    type="text"
                    value={finalSearchQuery}
                    onChange={(e) => finalSetSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && finalSearchQuery.trim()) {
                        setShowSuggestions(false);
                        router.push(`/search?q=${encodeURIComponent(finalSearchQuery.trim())}`);
                      }
                    }}
                    onFocus={() => {
                      if (finalSearchQuery.trim() && searchSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding suggestions to allow clicking on them
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="Search products, categories..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                    style={{ color: finalHeaderSettings.searchInputColor || '#111827', caretColor: finalHeaderSettings.searchInputColor || '#111827' }}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-lg">🔍</span>
                  </div>
                  {finalSearchQuery.trim() && (
                    <button
                      onClick={() => {
                        if (finalSearchQuery.trim()) {
                          router.push(`/search?q=${encodeURIComponent(finalSearchQuery.trim())}`);
                        }
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      title="Search"
                    >
                      <span className="text-blue-600 hover:text-blue-800 cursor-pointer text-lg">➡️</span>
                    </button>
                  )}
                  
                  {/* Search Suggestions Dropdown */}
                  {showSuggestions && finalSearchQuery.trim().length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                      {searchLoading ? (
                        <div className="p-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-sm text-gray-600">Searching...</p>
                        </div>
                      ) : searchSuggestions.length > 0 ? (
                        <>
                          <div className="p-3 border-b border-gray-100">
                            <div className="text-sm font-medium text-gray-700">
                              Search Results for "{finalSearchQuery}"
                            </div>
                          </div>
                          {searchSuggestions.map((product: any, index: number) => (
                            <div
                              key={product.id || index}
                              onClick={() => {
                                setShowSuggestions(false);
                                router.push(`/products/${product.slug}`);
                              }}
                              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                            >
                              {/* Product Image */}
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                    📦
                                  </div>
                                )}
                              </div>
                              
                              {/* Product Info */}
                              <div className="ml-3 flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm truncate">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {product.categoryName}
                                </div>
                                <div className="flex items-center mt-1">
                                  {product.salePrice && product.salePrice < product.regularPrice ? (
                                    <>
                                      <span className="text-sm font-bold text-red-600">
                                        {new Intl.NumberFormat('en-US', {
                                          style: 'currency',
                                          currency: product.currency || 'BDT',
                                        }).format(product.salePrice)}
                                      </span>
                                      <span className="text-xs text-gray-500 line-through ml-2">
                                        {new Intl.NumberFormat('en-US', {
                                          style: 'currency',
                                          currency: product.currency || 'BDT',
                                        }).format(product.regularPrice)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-sm font-bold text-gray-900">
                                      {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: product.currency || 'BDT',
                                      }).format(product.regularPrice)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Arrow Icon */}
                              <div className="ml-2 text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          ))}
                          
                          {/* View All Results */}
                          <div 
                            onClick={() => {
                              setShowSuggestions(false);
                              router.push(`/search?q=${encodeURIComponent(finalSearchQuery.trim())}`);
                            }}
                            className="p-3 text-center border-t border-gray-100 cursor-pointer hover:bg-blue-50 text-blue-600 font-medium text-sm"
                          >
                            View All Results ({searchSuggestions.length}+)
                          </div>
                        </>
                      ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No products found for "{finalSearchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button className="hover:text-blue-600" style={{ color: finalHeaderSettings.textColor }}>
                  <span className="text-xl">❤️</span>
                </button>
                <Link href="/cart" onClick={(e)=>navigate(e,'/cart')} className="hover:text-blue-600 relative" style={{ color: finalHeaderSettings.textColor }}>
                  <span className="text-xl">🛒</span>
                              {finalCartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {finalCartCount}
                                </span>
                              )}
                            </Link>

                {/* Account menu */}
                <div className="relative">
                  <button onClick={() => setAccountOpen(v=>!v)} className="hover:text-blue-600 focus:outline-none" style={{ color: finalHeaderSettings.textColor }}>
                    <span className="text-xl">👤</span>
                  </button>
                  {accountOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-md z-50">
                      {customer ? (
                        <div className="py-2">
                          <div className="px-3 py-2 text-sm text-gray-700">Hello, <span className="font-medium">{customer.name}</span></div>
                          <Link href="/account" prefetch className="block px-3 py-2 text-sm hover:bg-gray-50">My Account</Link>
                          <button
                            onClick={async()=>{ try { await fetch('/api/customer/logout',{method:'POST'}); setCustomer(null); setAccountOpen(false); } catch {} }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                          >Logout</button>
                        </div>
                      ) : (
                        <div className="py-2">
                          <Link href="/login" className="block px-3 py-2 text-sm hover:bg-gray-50">Login</Link>
                          <Link href="/register" className="block px-3 py-2 text-sm hover:bg-gray-50">Register</Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => finalSetIsMobileMenuOpen(!finalIsMobileMenuOpen)}
                  className="md:hidden p-2 rounded-md hover:bg-emerald-50"
                  aria-label="Toggle Menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {finalIsMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t" style={{ backgroundColor: finalHeaderSettings.backgroundColor }}>
              <Link href="/" onClick={(e)=>navigate(e,'/')} className="block px-3 py-2 hover:text-blue-600 text-base font-medium" style={{ color: finalHeaderSettings.textColor }}>
                Home
              </Link>
              <Link href="/products" onClick={(e)=>navigate(e,'/products')} className="block px-3 py-2 hover:text-blue-600 text-base font-medium" style={{ color: finalHeaderSettings.textColor }}>
                Products
              </Link>
              <Link href="/categories" onClick={(e)=>navigate(e,'/categories')} className="block px-3 py-2 hover:text-blue-600 text-base font-medium" style={{ color: finalHeaderSettings.textColor }}>
                Categories
              </Link>
              <Link href="/about" onClick={(e)=>navigate(e,'/about')} className="block px-3 py-2 hover:text-blue-600 text-base font-medium" style={{ color: finalHeaderSettings.textColor }}>
                About
              </Link>
              <Link href="/contact" onClick={(e)=>navigate(e,'/contact')} className="block px-3 py-2 hover:text-blue-600 text-base font-medium" style={{ color: finalHeaderSettings.textColor }}>
                Contact
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
