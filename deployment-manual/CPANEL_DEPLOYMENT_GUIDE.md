# 🚀 cPanel Deployment Guide - Nexus Shop

## 📋 **প্রাক-প্রস্তুতি**

### 1. **প্রজেক্ট প্রোডাকশন বিল্ড**
```bash
npm run build
```

### 2. **প্রোডাকশন ফাইল প্রস্তুত**
- `.next` ফোল্ডার (বিল্ড আউটপুট)
- `package.json`
- `next.config.ts`
- `prisma` ফোল্ডার
- `public` ফোল্ডার
- `.env.production` ফাইল

## 🛠️ **cPanel সেটআপ**

### 1. **Node.js App তৈরি**
1. cPanel-এ লগইন করুন
2. **Node.js Apps** সেকশনে যান
3. **Create Application** ক্লিক করুন
4. নিম্নলিখিত তথ্য দিন:
   ```
   Node.js version: 18.x বা 20.x
   Application mode: Production
   Application root: /home/username/nexus-shop
   Application URL: yourdomain.com
   Application startup file: server.js
   ```

### 2. **ফাইল আপলোড**
1. **File Manager** খুলুন
2. `nexus-shop` ফোল্ডার তৈরি করুন
3. নিম্নলিখিত ফাইলগুলো আপলোড করুন:
   ```
   ├── .next/           (বিল্ড আউটপুট)
   ├── public/          (স্ট্যাটিক ফাইল)
   ├── prisma/          (ডেটাবেস স্কিমা)
   ├── package.json
   ├── package-lock.json
   ├── next.config.ts
   ├── server.js        (নতুন ফাইল)
   └── .env.production  (প্রোডাকশন এনভায়রনমেন্ট)
   ```

## 📁 **প্রোডাকশন ফাইল স্ট্রাকচার**

### 1. **server.js ফাইল তৈরি**
```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
```

### 2. **.env.production ফাইল**
```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/nexus_shop"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Courier APIs
STEADFAST_API_KEY="your-steadfast-api-key"
BD_COURIER_API_KEY="your-bd-courier-api-key"

# Payment Gateway
SSL_COMMERZ_STORE_ID="your-ssl-commerz-store-id"
SSL_COMMERZ_STORE_PASSWORD="your-ssl-commerz-store-password"

# Email Settings
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Facebook Pixel
FB_PIXEL_ID="your-facebook-pixel-id"
FB_ACCESS_TOKEN="your-facebook-access-token"
```

## 🗄️ **ডেটাবেস সেটআপ**

### 1. **MySQL ডেটাবেস তৈরি**
1. cPanel-এ **MySQL Databases** সেকশনে যান
2. নতুন ডেটাবেস তৈরি করুন: `nexus_shop`
3. নতুন ইউজার তৈরি করুন এবং ডেটাবেসে অ্যাসাইন করুন
4. **Remote MySQL** সেকশনে হোস্ট অ্যাড করুন

### 2. **Prisma সেটআপ**
```bash
# SSH-এ কানেক্ট করে
cd nexus-shop
npx prisma generate
npx prisma db push
npx prisma db seed
```

## 🔧 **cPanel কনফিগারেশন**

### 1. **Node.js App কনফিগারেশন**
```json
{
  "name": "nexus-shop",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "node server.js",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "next": "^15.4.6",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@prisma/client": "^5.x.x",
    "nodemailer": "^6.x.x",
    "next-auth": "^4.x.x"
  },
  "devDependencies": {
    "prisma": "^5.x.x",
    "@types/node": "^20.x.x",
    "typescript": "^5.x.x"
  }
}
```

### 2. **.htaccess ফাইল (যদি প্রয়োজন)**
```apache
RewriteEngine On
RewriteRule ^$ http://127.0.0.1:3000/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

## 🚀 **ডেপ্লয়মেন্ট স্টেপস**

### 1. **লোকাল প্রস্তুতি**
```bash
# প্রজেক্ট বিল্ড
npm run build

# প্রোডাকশন ডিপেন্ডেন্সি ইনস্টল
npm ci --production

# Prisma ক্লায়েন্ট জেনারেট
npx prisma generate
```

### 2. **ফাইল আপলোড**
1. **File Manager** দিয়ে ফাইল আপলোড করুন
2. **SSH** দিয়ে কমান্ড চালান:
```bash
cd nexus-shop
npm install
npx prisma generate
npx prisma db push
```

### 3. **Node.js App স্টার্ট**
1. cPanel-এ **Node.js Apps** সেকশনে যান
2. আপনার অ্যাপ সিলেক্ট করুন
3. **Start App** ক্লিক করুন

## 🔒 **সুরক্ষা সেটআপ**

### 1. **SSL সার্টিফিকেট**
1. **SSL/TLS** সেকশনে যান
2. **Let's Encrypt** সার্টিফিকেট ইনস্টল করুন
3. **Force HTTPS Redirect** এনাবল করুন

### 2. **ফায়ারওয়াল সেটআপ**
```bash
# SSH-এ কানেক্ট করে
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
```

## 📊 **মনিটরিং**

### 1. **লগ মনিটরিং**
```bash
# অ্যাপ লগ দেখুন
tail -f ~/logs/nexus-shop.log

# এরর লগ দেখুন
tail -f ~/logs/nexus-shop-error.log
```

### 2. **পারফরম্যান্স মনিটরিং**
- cPanel-এর **Metrics** সেকশন ব্যবহার করুন
- **Resource Usage** মনিটর করুন

## 🔧 **ট্রাবলশুটিং**

### 1. **সাধারণ সমস্যা**
```bash
# অ্যাপ রিস্টার্ট
pm2 restart nexus-shop

# লগ চেক
pm2 logs nexus-shop

# মেমরি ব্যবহার দেখুন
pm2 monit
```

### 2. **ডেটাবেস সমস্যা**
```bash
# Prisma স্ট্যাটাস চেক
npx prisma db pull
npx prisma generate
npx prisma db push
```

### 3. **পোর্ট সমস্যা**
```bash
# পোর্ট চেক
netstat -tulpn | grep :3000

# প্রসেস কিল
kill -9 <process_id>
```

## 📈 **অপটিমাইজেশন**

### 1. **Next.js অপটিমাইজেশন**
```typescript
// next.config.ts
const nextConfig = {
  output: 'standalone',
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react', 'react-dom']
  },
  images: {
    domains: ['yourdomain.com'],
    formats: ['image/webp', 'image/avif']
  }
};
```

### 2. **ডেটাবেস অপটিমাইজেশন**
```sql
-- ইনডেক্স তৈরি
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_products_category ON products(categoryId);
```

## 🔄 **অটোমেটিক ডেপ্লয়মেন্ট**

### 1. **GitHub Actions**
```yaml
name: Deploy to cPanel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to cPanel
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd nexus-shop
            git pull origin main
            npm install
            npm run build
            pm2 restart nexus-shop
```

## 📞 **সহায়তা**

### **সম্পর্কিত লিংক**
- [cPanel Node.js Documentation](https://docs.cpanel.net/cpanel/software/nodejs-apps/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

### **কন্টাক্ট**
- **ইমেইল**: support@yourdomain.com
- **ফোন**: +880-xxx-xxx-xxxx
- **WhatsApp**: +880-xxx-xxx-xxxx

---

**🎉 আপনার Nexus Shop সফলভাবে cPanel-এ ডেপ্লয় হয়েছে!**
