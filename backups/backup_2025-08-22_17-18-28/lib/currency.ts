export const SUPPORTED_CURRENCIES = [
	"BDT",
	"USD",
	"EUR",
	"INR",
	"GBP",
];

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number];

// Fallback default
export const DEFAULT_CURRENCY: CurrencyCode = "BDT";

export function normalizeCurrency(input?: string | null): CurrencyCode {
	if (!input) return DEFAULT_CURRENCY;
	const code = input.toUpperCase();
	return (SUPPORTED_CURRENCIES as readonly string[]).includes(code) ? (code as CurrencyCode) : DEFAULT_CURRENCY;
}

// Reads general site setting currency from DB payload shape
// Pass in settings.general?.currency if available; otherwise uses DEFAULT_CURRENCY
export function deriveCurrencyFromSettings(settings?: { general?: any } | null, fallback?: string): CurrencyCode {
	const fromSettings = settings?.general?.currency as string | undefined;
	return normalizeCurrency(fromSettings || fallback || DEFAULT_CURRENCY);
}


