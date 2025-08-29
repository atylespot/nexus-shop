// Currency utility functions for global currency management

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  locale: string;
}

// Currency configurations
export const CURRENCIES: Record<string, CurrencyConfig> = {
  BDT: {
    code: 'BDT',
    symbol: '৳',
    name: 'Bangladeshi Taka',
    decimals: 2,
    locale: 'bn-BD'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    locale: 'en-US'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    locale: 'de-DE'
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimals: 2,
    locale: 'en-IN'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
    locale: 'en-GB'
  }
};

// Get current global currency
export function getCurrentCurrency(): string {
  if (typeof window === 'undefined') return 'BDT'; // Default for SSR
  
  // Check multiple localStorage keys for currency
  const globalCurrency = localStorage.getItem('nexus-shop-global-currency');
  const generalSettings = localStorage.getItem('nexus-shop-general-settings');
  const currencySetting = localStorage.getItem('nexus-shop-currency');
  
  if (globalCurrency) return globalCurrency;
  
  if (generalSettings) {
    try {
      const parsed = JSON.parse(generalSettings);
      if (parsed.currency) return parsed.currency;
    } catch (e) {
      console.error('Error parsing general settings:', e);
    }
  }
  
  if (currencySetting) return currencySetting;
  
  return 'BDT'; // Default fallback
}

// Get currency configuration
export function getCurrencyConfig(currencyCode?: string): CurrencyConfig {
  const currency = currencyCode || getCurrentCurrency();
  return CURRENCIES[currency] || CURRENCIES.BDT;
}

// Format price with currency
export function formatPrice(amount: number, currencyCode?: string): string {
  const currency = currencyCode || getCurrentCurrency();
  const config = getCurrencyConfig(currency);
  
  try {
    // Use Intl.NumberFormat for proper localization
    const formatter = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    });
    
    return formatter.format(amount);
  } catch (e) {
    // Fallback formatting if Intl fails
    return `${config.symbol}${amount.toFixed(config.decimals)}`;
  }
}

// Format price with just the symbol (simple format)
export function formatPriceSimple(amount: number, currencyCode?: string): string {
  const currency = currencyCode || getCurrentCurrency();
  const config = getCurrencyConfig(currency);
  
  return `${config.symbol}${amount.toFixed(config.decimals)}`;
}

// Listen for currency changes
export function onCurrencyChange(callback: (currency: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (event: CustomEvent) => {
    callback(event.detail.currency);
  };
  
  window.addEventListener('currencyChanged', handler as EventListener);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('currencyChanged', handler as EventListener);
  };
}

// Set global currency
export function setGlobalCurrency(currency: string): void {
  if (typeof window === 'undefined') return;
  
  // Update all currency-related localStorage keys
  localStorage.setItem('nexus-shop-global-currency', currency);
  localStorage.setItem('nexus-shop-currency', currency);
  
  // Update general settings
  const generalSettings = localStorage.getItem('nexus-shop-general-settings');
  if (generalSettings) {
    try {
      const parsed = JSON.parse(generalSettings);
      parsed.currency = currency;
      localStorage.setItem('nexus-shop-general-settings', JSON.stringify(parsed));
    } catch (e) {
      console.error('Error updating general settings:', e);
    }
  }
  
  // Dispatch currency change event
  window.dispatchEvent(new CustomEvent('currencyChanged', { 
    detail: { currency } 
  }));
}

// Get currency symbol only
export function getCurrencySymbol(currencyCode?: string): string {
  const currency = currencyCode || getCurrentCurrency();
  const config = getCurrencyConfig(currency);
  return config.symbol;
}

// Currency conversion rates (placeholder - in real app, fetch from API)
export const CURRENCY_RATES: Record<string, number> = {
  BDT: 1,     // Base currency
  USD: 0.009, // 1 BDT = 0.009 USD
  EUR: 0.008, // 1 BDT = 0.008 EUR
  INR: 0.78,  // 1 BDT = 0.78 INR
  GBP: 0.007  // 1 BDT = 0.007 GBP
};

// Convert price from one currency to another
export function convertPrice(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === 'BDT') return amount;
  
  // Convert to BDT first (base currency)
  const bdtAmount = fromCurrency === 'BDT' ? amount : amount / (CURRENCY_RATES[fromCurrency] || 1);
  
  // Convert from BDT to target currency
  const convertedAmount = toCurrency === 'BDT' ? bdtAmount : bdtAmount * (CURRENCY_RATES[toCurrency] || 1);
  
  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
}

// Derive currency from settings (for API routes)
export function deriveCurrencyFromSettings(): string {
  if (typeof window === 'undefined') {
    // Server-side: return default currency
    return 'BDT';
  }
  
  // Client-side: get from localStorage
  return getCurrentCurrency();
}

// Normalize currency (ensure valid currency code)
export function normalizeCurrency(currency: string): string {
  const validCurrencies = Object.keys(CURRENCIES);
  return validCurrencies.includes(currency) ? currency : 'BDT';
}

// Get currency info for a specific currency code
export function getCurrencyInfo(currencyCode: string): CurrencyConfig | null {
  return CURRENCIES[currencyCode] || null;
}

// Check if currency is valid
export function isValidCurrency(currencyCode: string): boolean {
  return Object.keys(CURRENCIES).includes(currencyCode);
}