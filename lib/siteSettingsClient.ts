export interface SiteSettings {
  id?: number;
  header?: Record<string, unknown>;
  banner?: Record<string, unknown>;
  general?: Record<string, unknown>;
  payment?: Record<string, unknown>;
  shipping?: Record<string, unknown>;
  footer?: Record<string, unknown>;
  [key: string]: unknown;
}

// Production fallback settings
const productionFallbackSettings: SiteSettings = {
  header: {
    topHeaderText: "🚚 Free delivery on orders above $50 • 🆕 New products arriving soon • 💰 Special discounts for first-time customers • 🎉 Limited time offers available",
    enableNewsTicker: true,
    autoScrollText: true,
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    topHeaderBgColor: "#2563eb",
    topHeaderTextColor: "#ffffff",
    logo: "",
    searchInputColor: "#111827",
    headerHeight: 64,
    headerMaxWidth: 1280,
    headerHorizontalPadding: 16,
    headerFullWidth: false
  },
  banner: {
    banners: [
      {
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
      }
    ],
    autoSlide: true,
    slideInterval: 5000,
    matchImageSize: false,
    flashSaleBanner: {
      isActive: true,
      title: "🔥 FLASH SALE",
      subtitle: "Up to 70% OFF on selected items",
      backgroundColor: "from-red-500 to-orange-500",
      textColor: "#ffffff",
      buttonText: "Shop Now",
      buttonLink: "/products",
      image: ""
    }
  },
  footer: {
    companyName: "Nexus Shop",
    tagline: "Your one-stop destination for quality products at great prices",
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
    socialLinks: [
      { name: "Facebook", url: "#", icon: "facebook" },
      { name: "Instagram", url: "#", icon: "instagram" }
    ]
  }
};

/**
 * Fetch site settings from server and persist to localStorage so that
 * settings are consistent across browsers/devices on first load.
 */
export async function fetchAndCacheSiteSettings(): Promise<SiteSettings | null> {
  try {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (!res.ok) {
      // Return fallback settings if API fails
      return productionFallbackSettings;
    }
    const json: SiteSettings = await res.json();

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
    } catch {
      // Ignore localStorage errors
    }

    return json;
  } catch {
    // Return fallback settings if fetch fails
    return productionFallbackSettings;
  }
}

export function readCached<T = Record<string, unknown>>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? { ...fallback, ...JSON.parse(val) } : fallback;
  } catch {
    return fallback;
  }
}




