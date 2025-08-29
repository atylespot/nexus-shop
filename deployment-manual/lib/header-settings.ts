export interface HeaderSettings {
  topHeaderText: string;
  enableNewsTicker: boolean;
  autoScrollText: boolean;
  backgroundColor: string;
  textColor: string;
  topHeaderBgColor: string;
  topHeaderTextColor: string;
  logo: string;
  searchInputColor?: string;
  headerHeight?: number;
  headerMaxWidth?: number;
  headerHorizontalPadding?: number;
  headerFullWidth?: boolean;
}

export const defaultHeaderSettings: HeaderSettings = {
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
};

export function getHeaderSettings(): HeaderSettings {
  if (typeof window === 'undefined') {
    return defaultHeaderSettings;
  }
  
  const savedSettings = localStorage.getItem('nexus-shop-header-settings');
  if (savedSettings) {
    try {
      return { ...defaultHeaderSettings, ...JSON.parse(savedSettings) } as HeaderSettings;
    } catch {
      return defaultHeaderSettings;
    }
  }
  
  return defaultHeaderSettings;
}

export function saveHeaderSettings(settings: HeaderSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nexus-shop-header-settings', JSON.stringify(settings));
}
