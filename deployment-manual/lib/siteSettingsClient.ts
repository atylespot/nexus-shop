export interface SiteSettings {
  id?: number;
  header?: any;
  banner?: any;
  general?: any;
  payment?: any;
  shipping?: any;
  footer?: any;
  [key: string]: any;
}

/**
 * Fetch site settings from server and persist to localStorage so that
 * settings are consistent across browsers/devices on first load.
 */
export async function fetchAndCacheSiteSettings(): Promise<SiteSettings | null> {
  try {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (!res.ok) return null;
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
    } catch {}

    return json;
  } catch {
    return null;
  }
}

export function readCached<T = any>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? { ...fallback, ...JSON.parse(val) } : fallback;
  } catch {
    return fallback;
  }
}




