// Lightweight Bangladesh district/thana detector
// - First, tries to parse from provided address text
// - Then, falls back to approximate IP geolocation (city/region)

export interface LocationInput {
	address?: string | null;
	district?: string | null;
	thana?: string | null;
	ip?: string | null;
}

export interface LocationResult {
	district?: string | null;
	thana?: string | null;
}

const DISTRICTS = [
	'Dhaka','Gazipur','Narayanganj','Narsingdi','Manikganj','Munshiganj','Kishoreganj','Tangail',
	'Faridpur','Gopalganj','Madaripur','Rajbari','Shariatpur',
	'Chattogram','Coxs Bazar','Cox\'s Bazar','Cumilla','Comilla','Brahmanbaria','Chandpur','Feni','Noakhali','Lakshmipur','Khagrachari','Bandarban','Rangamati',
	'Sylhet','Moulvibazar','Habiganj','Sunamganj',
	'Rajshahi','Natore','Chapainawabganj','Naogaon','Bogura','Bogra','Joypurhat','Pabna','Sirajganj',
	'Rangpur','Dinajpur','Thakurgaon','Panchagarh','Nilphamari','Kurigram','Gaibandha','Lalmonirhat',
	'Khulna','Jashore','Jessore','Satkhira','Bagerhat','Jhenaidah','Magura','Narail','Kushtia','Chuadanga','Meherpur',
	'Barishal','Barisal','Patuakhali','Bhola','Pirojpur','Jhalokathi','Barguna',
	'Mymensingh','Jamalpur','Netrokona','Sherpur'
];

// Common Bangla transliterations/synonyms
const DISTRICT_SYNONYMS: Record<string,string> = {
	'ঢাকা': 'Dhaka', 'গাজীপুর': 'Gazipur', 'নারায়ণগঞ্জ': 'Narayanganj', 'নরসিংদী':'Narsingdi', 'মানিকগঞ্জ':'Manikganj', 'মুন্সিগঞ্জ':'Munshiganj', 'কিশোরগঞ্জ':'Kishoreganj', 'টাঙ্গাইল':'Tangail',
	'ফরিদপুর':'Faridpur','গোপালগঞ্জ':'Gopalganj','মাদারীপুর':'Madaripur','রাজবাড়ী':'Rajbari','শরীয়তপুর':'Shariatpur',
	'চট্টগ্রাম':'Chattogram','কক্সবাজার':'Coxs Bazar','কুমিল্লা':'Cumilla','ব্রাহ্মণবাড়িয়া':'Brahmanbaria','চাঁদপুর':'Chandpur','ফেনী':'Feni','নোয়াখালী':'Noakhali','লক্ষ্মীপুর':'Lakshmipur','খাগড়াছড়ি':'Khagrachari','বান্দরবান':'Bandarban','রাঙ্গামাটি':'Rangamati',
	'সিলেট':'Sylhet','মৌলভীবাজার':'Moulvibazar','হবিগঞ্জ':'Habiganj','সুনামগঞ্জ':'Sunamganj',
	'রাজশাহী':'Rajshahi','নাটোর':'Natore','চাঁপাইনবাবগঞ্জ':'Chapainawabganj','নওগাঁ':'Naogaon','বগুড়া':'Bogura','জয়পুরহাট':'Joypurhat','পাবনা':'Pabna','সিরাজগঞ্জ':'Sirajganj',
	'রংপুর':'Rangpur','দিনাজপুর':'Dinajpur','ঠাকুরগাঁও':'Thakurgaon','পঞ্চগড়':'Panchagarh','নীলফামারী':'Nilphamari','কুড়িগ্রাম':'Kurigram','গাইবান্ধা':'Gaibandha','লালমনিরহাট':'Lalmonirhat',
	'খুলনা':'Khulna','যশোর':'Jashore','সাতক্ষীরা':'Satkhira','বাগেরহাট':'Bagerhat','ঝিনাইদহ':'Jhenaidah','মাগুরা':'Magura','নড়াইল':'Narail','কুষ্টিয়া':'Kushtia','চুয়াডাঙ্গা':'Chuadanga','মেহেরপুর':'Meherpur',
	'বরিশাল':'Barishal','পটুয়াখালী':'Patuakhali','ভোলা':'Bhola','পিরোজপুর':'Pirojpur','ঝালকাঠি':'Jhalokathi','বরগুনা':'Barguna',
	'ময়মনসিংহ':'Mymensingh','জামালপুর':'Jamalpur','নেত্রকোনা':'Netrokona','শেরপুর':'Sherpur'
};

// Heuristic areas for Dhaka to infer thana/police station
const DHAKA_AREA_TO_THANA: Record<string,string> = {
	'uttara': 'Uttara', 'banani': 'Banani', 'gulshan': 'Gulshan', 'mohakhali': 'Mohakhali',
	'mirpur': 'Mirpur', 'pallabi': 'Pallabi', 'dhanmondi': 'Dhanmondi', 'tejgaon': 'Tejgaon', 'farmgate': 'Tejgaon',
	'motijheel': 'Motijheel', 'ramna': 'Ramna', 'khilgaon': 'Khilgaon', 'jatrabari': 'Jatrabari', 'demra': 'Demra',
	'savar': 'Savar', 'keraniganj': 'Keraniganj', 'turag': 'Turag', 'badda': 'Badda', 'kafrul': 'Kafrul'
};

function normalize(input?: string | null): string {
	return (input || '')
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,' ')
		.trim();
}

function detectDistrictFromText(text?: string | null): string | null {
	const n = normalize(text);
	if (!n) return null;
	// Direct English matches
	for (const d of DISTRICTS) {
		const dn = d.toLowerCase();
		if (n.includes(dn)) return canonicalizeDistrict(d);
	}
	// Bangla synonyms
	for (const [key, val] of Object.entries(DISTRICT_SYNONYMS)) {
		if (n.includes(normalize(key))) return val;
	}
	// Special cases
	if (n.includes('dhaka city')) return 'Dhaka';
	return null;
}

function canonicalizeDistrict(input: string): string {
	// Map legacy names
	if (/\bbogra\b/i.test(input)) return 'Bogura';
	if (/\bbarisal\b/i.test(input)) return 'Barishal';
	if (/\bcomilla|cumilla\b/i.test(input)) return 'Cumilla';
	if (/\bjessore|jashore\b/i.test(input)) return 'Jashore';
	if (/\bcoxs? bazar\b/i.test(input)) return "Coxs Bazar";
	return input.replace(/\s+/g,' ').trim();
}

function detectThanaFromText(text?: string | null, district?: string | null): string | null {
	const n = normalize(text);
	if (!n) return null;
	// Explicit markers
	const markers = ['thana', 'উপজেলা', 'থানা', 'upazila'];
	for (const marker of markers) {
		const idx = n.indexOf(marker);
		if (idx > -1) {
			// capture previous or next word
			const parts = n.split(' ');
			const mParts = marker.split(' ');
			for (let i = 0; i < parts.length; i++) {
				if (parts[i] === marker) {
					const prev = parts[i-1] || '';
					const next = parts[i+1] || '';
					// Keep only English letters and Bangla letters; drop everything else
					const raw = (prev.length > 2 ? prev : next);
					const cand = raw.replace(/[^A-Za-z\u0980-\u09FF-]/g, '');
					if (cand) return titleCase(cand);
				}
			}
		}
	}
	// Dhaka area heuristics
	if ((district || '').toLowerCase() === 'dhaka') {
		for (const [k, v] of Object.entries(DHAKA_AREA_TO_THANA)) {
			if (n.includes(k)) return v;
		}
	}
	return null;
}

function titleCase(s: string): string { return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s; }

async function detectFromIP(ip?: string | null): Promise<{ city?: string | null; region?: string | null; country?: string | null } | null> {
	try {
		// ipapi: if IP not provided, it will infer from the request
		const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
		const res = await fetch(url, { cache: 'no-store' });
		if (!res.ok) return null;
		const json: any = await res.json();
		return { city: json?.city || null, region: json?.region || null, country: json?.country || json?.country_code || null };
	} catch {
		return null;
	}
}

export async function detectDistrictThana(input: LocationInput): Promise<LocationResult> {
	let district = input.district || detectDistrictFromText(input.address) || null;
	let thana = input.thana || detectThanaFromText(input.address, district) || null;

	if (!district) {
		const ipData = await detectFromIP(input.ip);
		if (ipData && (ipData.country === 'BD' || ipData.country === 'Bangladesh')) {
			const fromCity = detectDistrictFromText(ipData.city || '') || detectDistrictFromText(ipData.region || '');
			if (fromCity) district = fromCity;
		}
	}

	return { district: district ? canonicalizeDistrict(district) : null, thana: thana ? titleCase(thana) : null };
}

// Fast, address-only detection without any external IP lookup
export function detectDistrictThanaFromAddress(address?: string | null, existingDistrict?: string | null, existingThana?: string | null): LocationResult {
	let district = existingDistrict || detectDistrictFromText(address) || null;
	let thana = existingThana || detectThanaFromText(address, district) || null;
	return { district: district ? canonicalizeDistrict(district) : null, thana: thana ? titleCase(thana) : null };
}


