# BD Courier Integration System

## 🚀 Overview

এই সিস্টেমটি বিডি কুরিয়ার API এর সাথে ইন্টিগ্রেশন করে কাস্টমার পারফরম্যান্স ট্র্যাকিং এবং কুরিয়ার অ্যানালিটিক্স প্রদান করে।

## ✨ Features

### 1. **BD Courier Settings Page**
- API Key কনফিগারেশন
- API টেস্টিং ফাংশনালিটি
- ইন্টিগ্রেশন এনাবল/ডিসেবল অপশন

### 2. **Customer Tracking Modal**
- কাস্টমার পারফরম্যান্স ড্যাশবোর্ড
- কুরিয়ার পারফরম্যান্স টেবিল
- ডেলিভারি স্ট্যাটাস চার্ট
- অর্ডার হিস্টরি

### 3. **Smart Track Button**
- প্রতিটি অর্ডারে "Track" বাটন
- কাস্টমার ফোন নম্বর দিয়ে পারফরম্যান্স চেক
- রিয়েল-টাইম ডেটা আপডেট

## 🛠️ Installation & Setup

### 1. **Database Migration**
```bash
npx prisma migrate dev --name add_bd_courier_setting
npx prisma generate
```

### 2. **API Configuration**
- `/admin/settings/bd-courier` পেজে যান
- বিডি কুরিয়ার API Key দিন
- ইন্টিগ্রেশন এনাবল করুন

### 3. **API Key**
আপনার API Key: `8gkpXG1Lby8VzSzUOofAfmjJw1ZqvIVydfqRO7Oa6tysZeOqaANLHlOohiQZ`

## 📁 File Structure

```
app/
├── admin/
│   ├── settings/
│   │   └── bd-courier/
│   │       └── page.tsx          # BD Courier Settings Page
│   └── orders/
│       └── page.tsx              # Orders with Track Button
├── api/
│   ├── settings/
│   │   └── bd-courier/
│   │       └── route.ts          # Settings API
│   └── bd-courier/
│       ├── test/
│       │   └── route.ts          # API Test Endpoint
│       └── track/
│           └── route.ts          # Customer Tracking API
└── components/
    └── CustomerTrackingModal.tsx # Tracking Modal Component
```

## 🔧 API Endpoints

### 1. **Settings Management**
```typescript
// GET /api/settings/bd-courier
// Retrieve BD Courier settings

// POST /api/settings/bd-courier
// Save BD Courier settings
{
  "apiKey": "your_api_key",
  "isActive": true
}
```

### 2. **API Testing**
```typescript
// POST /api/bd-courier/test
// Test BD Courier API connection
{
  "phone": "017xxxxxxxx"
}
```

### 3. **Customer Tracking**
```typescript
// POST /api/bd-courier/track
// Get customer performance data
{
  "phone": "017xxxxxxxx"
}
```

## 📊 Data Structure

### Customer Performance
```typescript
{
  customer: {
    phone: string;
    totalOrders: number;
    successfulOrders: number;
    cancelledOrders: number;
    successRate: number;
  },
  courierPerformance: {
    pathao: { total: number; success: number; cancel: number };
    steadfast: { total: number; success: number; cancel: number };
    parceldex: { total: number; success: number; cancel: number };
    redx: { total: number; success: number; cancel: number };
    paperfly: { total: number; success: number; cancel: number };
  },
  orders: OrderHistory[]
}
```

## 🎯 Usage

### 1. **Configure BD Courier**
1. `/admin/settings/bd-courier` এ যান
2. API Key দিন
3. ইন্টিগ্রেশন এনাবল করুন
4. API টেস্ট করুন

### 2. **Track Customer Performance**
1. `/admin/orders` এ যান
2. যেকোনো অর্ডারের "Track" বাটনে ক্লিক করুন
3. কাস্টমার পারফরম্যান্স দেখুন

### 3. **View Analytics**
- মোট অর্ডার সংখ্যা
- সফল ডেলিভারি
- বাতিল অর্ডার
- সফলতার হার
- কুরিয়ার পারফরম্যান্স

## 🔍 Features Breakdown

### Dashboard Cards
- **Total Orders**: মোট অর্ডার সংখ্যা
- **Successful**: সফল ডেলিভারি
- **Cancelled**: বাতিল অর্ডার
- **Success Rate**: সফলতার শতকরা হার

### Courier Performance Table
- **Pathao**: পাথাও পারফরম্যান্স
- **SteadFast**: স্টেডফাস্ট পারফরম্যান্স
- **ParcelDex**: পারসেলডেক্স পারফরম্যান্স
- **REDX**: রেডএক্স পারফরম্যান্স
- **PAPERFLY**: পেপারফ্লাই পারফরম্যান্স

### Delivery Status Chart
- ডোনাট চার্টে সফল vs বাতিল অর্ডার
- ভিজ্যুয়াল রিপ্রেজেন্টেশন
- ইন্টারেক্টিভ লেজেন্ড

### Order History
- অর্ডার নম্বর
- স্ট্যাটাস
- টোটাল অ্যামাউন্ট
- তারিখ
- কনসাইনমেন্ট ID

## 🚨 Error Handling

### Common Issues
1. **API Key Invalid**: সঠিক API Key দিন
2. **API Not Active**: ইন্টিগ্রেশন এনাবল করুন
3. **Network Error**: ইন্টারনেট কানেকশন চেক করুন
4. **Phone Number Invalid**: সঠিক ফোন নম্বর দিন

### Troubleshooting
- API টেস্ট ফাংশন ব্যবহার করুন
- কনসোল লগ চেক করুন
- নেটওয়ার্ক ট্যাব চেক করুন

## 🔐 Security

- API Key এনক্রিপ্টেড স্টোরেজ
- Bearer Token অথেনটিকেশন
- HTTPS API কল
- ভ্যালিডেশন চেক

## 📱 Responsive Design

- মোবাইল ফ্রেন্ডলি
- ট্যাবলেট অপটিমাইজড
- ডেস্কটপ ভিউ
- টাচ ইন্টারফেস

## 🎨 UI Components

- **Modal**: কাস্টমার ট্র্যাকিং পপ-আপ
- **Cards**: পারফরম্যান্স মেট্রিক্স
- **Tables**: কুরিয়ার পারফরম্যান্স
- **Charts**: ডেলিভারি স্ট্যাটাস
- **Buttons**: ট্র্যাক, টেস্ট, সেভ

## 🔄 Real-time Updates

- অটোমেটিক ডেটা রিফ্রেশ
- লাইভ পারফরম্যান্স আপডেট
- ইনস্ট্যান্ট স্ট্যাটাস চেঞ্জ
- রিয়েল-টাইম কাউন্টার

## 📈 Future Enhancements

1. **Email Notifications**: পারফরম্যান্স রিপোর্ট
2. **SMS Alerts**: কাস্টমার আপডেট
3. **Advanced Analytics**: ট্রেন্ড অ্যানালিসিস
4. **Export Reports**: PDF/Excel রিপোর্ট
5. **API Rate Limiting**: রেট লিমিট ম্যানেজমেন্ট

## 🆘 Support

### Technical Issues
- কনসোল লগ চেক করুন
- API টেস্ট করুন
- ডেটাবেস কানেকশন ভেরিফাই করুন

### API Issues
- বিডি কুরিয়ার সাপোর্টে যোগাযোগ করুন
- API Key ভ্যালিডিটি চেক করুন
- নেটওয়ার্ক কানেকশন টেস্ট করুন

---

**Created by**: Nexus AI Assistant  
**Last Updated**: August 17, 2025  
**Version**: 1.0.0

