# Vercel Deployment Guide for Nexus Shop

## সমস্যা সমাধান সম্পন্ন ✅

### যে সমস্যাগুলি সমাধান করা হয়েছে:

1. **Prisma ডাটাবেস ইনিশিয়ালাইজেশন ব্যর্থ** ✅
   - Prisma ক্লায়েন্ট জেনারেট করা হয়েছে
   - ডাটাবেস সিঙ্ক করা হয়েছে

2. **landing/[slug]/page.js ফাইল নেই** ✅
   - বর্তমান প্রজেক্টে landing রাউট নেই, যা সঠিক
   - বিল্ড প্রক্রিয়া সফল হয়েছে

3. **Deprecated turbo কনফিগারেশন** ✅
   - next.config.js আপডেট করা হয়েছে
   - `experimental.turbo` থেকে `turbopack` এ পরিবর্তন

4. **Tailwind CSS স্টাইলিং সমস্যা** ✅
   - tailwind.config.js ফাইল তৈরি করা হয়েছে
   - globals.css আপডেট করা হয়েছে
   - সঠিক Tailwind CSS imports যোগ করা হয়েছে

## Vercel ডিপ্লয়মেন্ট স্টেপস:

### 1. Vercel প্রজেক্ট সেটআপ:
```bash
# Vercel CLI ইনস্টল
npm i -g vercel

# প্রজেক্ট ডিপ্লয়
vercel
```

### 2. এনভায়রনমেন্ট ভেরিয়েবল সেট করুন:

Vercel ড্যাশবোর্ডে গিয়ে নিচের এনভায়রনমেন্ট ভেরিয়েবলগুলি সেট করুন:

#### Database:
```
DATABASE_URL=your-production-database-url
```

#### App Configuration:
```
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

#### API Keys:
```
OPENAI_API_KEY=your-openai-api-key
STEADFAST_API_KEY=your-steadfast-api-key
STEADFAST_SECRET_KEY=your-steadfast-secret-key
```

#### Email Configuration:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### 3. ডাটাবেস সেটআপ:

#### Option A: PlanetScale (Recommended for Vercel)
1. PlanetScale.com এ অ্যাকাউন্ট তৈরি করুন
2. নতুন ডাটাবেস তৈরি করুন
3. DATABASE_URL কপি করে Vercel এ সেট করুন

#### Option B: Railway
1. Railway.app এ অ্যাকাউন্ট তৈরি করুন
2. MySQL ডাটাবেস তৈরি করুন
3. DATABASE_URL কপি করে Vercel এ সেট করুন

### 4. ডাটাবেস মাইগ্রেশন:
```bash
# প্রোডাকশন ডাটাবেসে স্কিমা পুশ করুন
npx prisma db push --schema=./prisma/schema.prisma
```

### 5. বিল্ড কমান্ড:
Vercel এ বিল্ড কমান্ড সেট করুন:
```bash
npm run build
```

### 6. ইনস্টল কমান্ড:
```bash
npm install
```

## স্টাইলিং সমস্যা সমাধান:

### যদি Tailwind CSS কাজ না করে:
1. **tailwind.config.js** ফাইল আছে কিনা চেক করুন
2. **globals.css** এ সঠিক imports আছে কিনা চেক করুন:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
3. **postcss.config.mjs** সঠিক কিনা চেক করুন

### যদি স্টাইলিং লোড হচ্ছে না:
1. Vercel এ **Build Cache** ক্লিয়ার করুন
2. **Redeploy** করুন
3. **Browser Cache** ক্লিয়ার করুন

## ট্রাবলশুটিং:

### যদি এখনও Prisma ত্রুটি আসে:
1. Vercel এ `PRISMA_GENERATE_DATAPROXY=true` এনভায়রনমেন্ট ভেরিয়েবল যোগ করুন
2. বিল্ড কমান্ডে `prisma generate` যোগ করুন:
   ```bash
   npx prisma generate && npm run build
   ```

### যদি ডাটাবেস কানেকশন ত্রুটি আসে:
1. DATABASE_URL সঠিক কিনা চেক করুন
2. ডাটাবেস সার্ভার অনলাইন কিনা চেক করুন
3. ফায়ারওয়াল সেটিংস চেক করুন

### যদি বিল্ড ব্যর্থ হয়:
1. লকফাইল কনফ্লিক্ট সমাধান করুন
2. node_modules ডিলিট করে আবার ইনস্টল করুন
3. TypeScript এররগুলি ফিক্স করুন

### যদি স্টাইলিং সমস্যা থাকে:
1. Tailwind CSS কনফিগারেশন চেক করুন
2. CSS imports সঠিক কিনা চেক করুন
3. Browser Developer Tools এ CSS লোড হচ্ছে কিনা চেক করুন

## সফল ডিপ্লয়মেন্টের লক্ষণ:
- ✅ বিল্ড সফল (Build successful)
- ✅ ডিপ্লয়মেন্ট কমপ্লিট (Deployment complete)
- ✅ ওয়েবসাইট লাইভ (Website live)
- ✅ স্টাইলিং সঠিকভাবে লোড হচ্ছে
- ✅ ডেটা সঠিকভাবে লোড হচ্ছে

## গুরুত্বপূর্ণ নোট:
- প্রোডাকশনে SQLite ব্যবহার করবেন না
- MySQL বা PostgreSQL ব্যবহার করুন
- সব এনভায়রনমেন্ট ভেরিয়েবল সেট করুন
- ডাটাবেস ব্যাকআপ নিয়মিত রাখুন
- Tailwind CSS কনফিগারেশন সঠিক রাখুন
