"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { defaultHeaderSettings, HeaderSettings } from "@/lib/header-settings";
import { cachedApi } from "@/lib/data-service";
import { useCart } from '../contexts/CartContext';

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
  const { cartCount: contextCartCount } = useCart();

  // Use external props if provided, otherwise use internal state
  const finalHeaderSettings = externalHeaderSettings || headerSettings;
  const finalIsMobileMenuOpen = externalIsMobileMenuOpen !== undefined ? externalIsMobileMenuOpen : isMobileMenuOpen;
  const finalSetIsMobileMenuOpen = externalSetIsMobileMenuOpen || setIsMobileMenuOpen;
  const finalSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : searchQuery;
  const finalSetSearchQuery = externalSetSearchQuery || setSearchQuery;
  const finalCartCount = externalCartCount !== undefined ? externalCartCount : contextCartCount;

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
    } catch {}

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Don't render header settings until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <header className="sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="shadow-sm bg-white">
            <div className="flex justify-between items-center h-16 px-6">
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center space-x-2 text-gray-900">
                  <span className="text-2xl font-bold">Nexus Shop</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const navigate = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <>
      {/* Top Header News Ticker */}
      {finalHeaderSettings.enableNewsTicker && (
        <div className="sticky top-0 z-50">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="shadow-sm"
            style={{ backgroundColor: finalHeaderSettings.backgroundColor }}
          >
            <div className="flex justify-between items-center h-16 px-4 md:px-6">
              <div className="flex-shrink-0">
                <Link href="/" onClick={(e)=>navigate(e,'/')} className="flex items-center space-x-2 mr-3 md:mr-6" style={{ color: finalHeaderSettings.textColor }}>
                  {finalHeaderSettings.logo ? (
                    <img 
                      src={finalHeaderSettings.logo} 
                      alt="Nexus Shop Logo" 
                      className="h-8 w-auto object-contain"
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
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button className="hover:text-blue-600" style={{ color: finalHeaderSettings.textColor }}>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                                            <Link href="/checkout" className="hover:text-blue-600 relative" style={{ color: finalHeaderSettings.textColor }}>
                              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                              </svg>
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {finalCartCount}
                              </span>
                            </Link>

                <button
                  onClick={() => finalSetIsMobileMenuOpen(!finalIsMobileMenuOpen)}
                  className="md:hidden hover:text-blue-600"
                  style={{ color: finalHeaderSettings.textColor }}
                >
                  {finalIsMobileMenuOpen ? (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
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
