# 🚀 Nexus Shop - cPanel Manual Deployment Instructions

## 📋 **প্রস্তুতি সম্পন্ন!**

এই folder এর সব files আপনার cPanel এ upload করতে হবে।

## 🔧 **Step 1: cPanel এ Node.js App তৈরি করুন**

1. **cPanel Login** করুন
2. **Node.js Apps** section এ যান  
3. **Create Application** ক্লিক করুন
4. নিম্নলিখিত তথ্য দিন:
   ```
   Node.js Version: 18.x বা 20.x
   Application Mode: Production  
   Application Root: /home/yourusername/nexus-shop
   Application URL: yourdomain.com
   Application Startup File: server.js
   ```

## 📁 **Step 2: Files Upload করুন**

1. **File Manager** খুলুন
2. `nexus-shop` folder তৈরি করুন (যদি না থাকে)
3. এই folder এর সব files upload করুন:
   - ✅ server.js
   - ✅ package.json  
   - ✅ next.config.ts
   - ✅ tsconfig.json
   - ✅ app/ (সম্পূর্ণ folder)
   - ✅ components/
   - ✅ contexts/
   - ✅ lib/
   - ✅ prisma/
   - ✅ public/

## 🗄️ **Step 3: Environment Variables সেটআপ**

cPanel এ `.env.production` file তৈরি করুন:

```env
# Database - আপনার cPanel MySQL তথ্য দিন
DATABASE_URL="mysql://username:password@localhost:3306/nexus_shop"

# NextAuth - আপনার ডোমেইন দিন  
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key-minimum-32-characters-long"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"

# OpenAI (Optional)
OPENAI_API_KEY="your-openai-api-key"

# Courier APIs (Optional)
STEADFAST_API_KEY="your-steadfast-api-key"
STEADFAST_SECRET_KEY="your-steadfast-secret-key" 
STEADFAST_BASE_URL="https://portal.packzy.com/api/v1"

# Payment Gateway (Optional)
SSL_COMMERZ_STORE_ID="your-ssl-commerz-store-id"
SSL_COMMERZ_STORE_PASSWORD="your-ssl-commerz-store-password"

# Email Settings (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com" 
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@yourdomain.com"

# Environment
NODE_ENV="production"
```

## 🗄️ **Step 4: MySQL Database তৈরি**

1. **MySQL Databases** section এ যান
2. Database তৈরি করুন: `nexus_shop`
3. Database user তৈরি করুন এবং permission দিন
4. **Remote MySQL** এ localhost add করুন

## ⚡ **Step 5: Dependencies Install**

SSH Terminal বা cPanel Terminal এ:

```bash
cd nexus-shop
npm install
npx prisma generate
npx prisma db push
```

## 🚀 **Step 6: Application Start**

1. **Node.js Apps** section এ ফিরে যান
2. আপনার app select করুন
3. **Start App** ক্লিক করুন

## 🔒 **Step 7: SSL Certificate (Optional)**

1. **SSL/TLS** section এ যান
2. **Let's Encrypt** certificate install করুন
3. **Force HTTPS Redirect** enable করুন

## ✅ **Step 8: Test Your Website**

- Browser এ আপনার domain visit করুন
- সব features test করুন:
  - ✅ Homepage load হচ্ছে
  - ✅ Products দেখাচ্ছে  
  - ✅ Cart কাজ করছে
  - ✅ Admin panel accessible
  - ✅ Database connection working

## 🛠️ **Troubleshooting**

### যদি App Start না হয়:
```bash
# Check logs
cd nexus-shop  
npm run start
# বা
node server.js
```

### Database Connection Error:
- DATABASE_URL সঠিক আছে কিনা check করুন
- MySQL user permissions check করুন

### Permission Errors:
```bash
chmod 755 nexus-shop
chmod 644 nexus-shop/server.js
```

## 📞 **Support**

যদি কোন সমস্যা হয়:
1. cPanel Error Logs check করুন
2. Node.js App Logs check করুন  
3. Database connection test করুন

---

## 🎉 **Deployment Successful!**

আপনার Nexus Shop এখন live! 🚀

**Important Files in this Package:**
- **server.js** - Main application server
- **package.json** - Dependencies and scripts
- **next.config.ts** - Next.js configuration
- **app/** - All application pages and API routes  
- **components/** - Reusable UI components
- **lib/** - Utility functions and services
- **prisma/** - Database schema and migrations
- **public/** - Static assets and uploads

**Next Steps:**
1. Configure your domain DNS
2. Set up SSL certificate
3. Configure payment gateways
4. Set up email services
5. Configure courier services
6. Add your products and categories

Good luck with your e-commerce business! 💪
