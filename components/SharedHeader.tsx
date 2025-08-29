"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { defaultHeaderSettings, HeaderSettings } from "@/lib/header-settings";
import { cachedApi } from "@/lib/data-service";
import { useCart } from '../contexts/CartContext';
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navigate = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    router.push(href);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Top Banner */}
      {finalHeaderSettings.enableNewsTicker && (
        <div className="top-banner">
          <div className="header-container">
            <div className="top-banner-content">
              <span style={{ marginRight: '32px' }}>
                {finalHeaderSettings.topHeaderText}
              </span>
              {finalHeaderSettings.autoScrollText && (
                <span style={{ marginRight: '32px' }}>
                  {finalHeaderSettings.topHeaderText}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="header">
        <div className="header-container">
          {/* Logo */}
          <div>
            <Link href="/" onClick={(e)=>navigate(e,'/')} className="logo">
              {finalHeaderSettings.logo ? (
                <img 
                  src={finalHeaderSettings.logo} 
                  alt="Nexus Shop Logo" 
                  style={{ height: '40px' }}
                />
              ) : (
                "Nexus Shop"
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="nav">
            <Link href="/" onClick={(e)=>navigate(e,'/')}>Home</Link>
            <Link href="/products" onClick={(e)=>navigate(e,'/products')}>Products</Link>
            <Link href="/categories" onClick={(e)=>navigate(e,'/categories')}>Categories</Link>
            <Link href="/about" onClick={(e)=>navigate(e,'/about')}>About</Link>
            <Link href="/contact" onClick={(e)=>navigate(e,'/contact')}>Contact</Link>
          </nav>

          {/* Search Bar */}
          <div className="search-container">
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
              placeholder="Search products, categories..."
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          {/* Header Actions */}
          <div className="header-actions">
            <button className="icon-button">❤️</button>
            
            <Link href="/cart" onClick={(e)=>navigate(e,'/cart')} className="cart-icon">
              🛒
              {finalCartCount > 0 && (
                <span className="cart-badge">
                  {finalCartCount}
                </span>
              )}
            </Link>

            <button onClick={() => setAccountOpen(v=>!v)} className="icon-button">
              👤
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
