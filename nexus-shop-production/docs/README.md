# Nexus Shop - Production Deployment Package

## 🚀 Quick Start Guide

### 1. Upload Files to cPanel
1. Extract this ZIP file
2. Upload all contents to your cPanel File Manager
3. Place in: `/home/username/nexus-shop`

### 2. Database Setup
1. Create MySQL database in cPanel
2. Import `database/nexus_shop.sql` via phpMyAdmin
3. Update database credentials in `config/production.env`

### 3. Node.js App Setup
1. Create Node.js App in cPanel
2. Set startup file: `server.js`
3. Set Node.js version: 18.x or higher

### 4. Environment Configuration
1. Edit `config/production.env`
2. Update all API keys and URLs
3. Set your domain name

### 5. Deploy
1. Run: `bash deployment/scripts/auto-deploy.sh`
2. Start your Node.js app in cPanel

## 📁 Package Contents

```
nexus-shop-production/
├── 📁 database/           # MySQL database files
├── 📁 app/               # Next.js application
├── 📁 config/            # Configuration files
├── 📁 deployment/        # Deployment scripts
├── 📁 docs/              # Documentation
├── 📁 backup/            # Sample data
├── 📁 components/        # React components
├── 📁 contexts/          # React contexts
├── 📁 lib/               # Utility functions
├── 📁 .next/             # Build output
├── 📁 public/            # Static files
└── 📁 prisma/            # Database schema
```

## 🔧 Features Included

- ✅ **Complete E-commerce Platform**
- ✅ **Admin Panel** with full management
- ✅ **AI Chat System** for customer support
- ✅ **Courier Integration** (Steadfast)
- ✅ **Facebook & TikTok Pixel** tracking
- ✅ **Landing Page System** for marketing
- ✅ **Analytics Dashboard** with insights
- ✅ **Inventory Management** with alerts
- ✅ **Order Processing** with status tracking
- ✅ **Customer Management** with profiles
- ✅ **Payment Integration** ready
- ✅ **Email System** with templates

## 🌐 Access Points

- **Main Website**: `https://yourdomain.com`
- **Admin Panel**: `https://yourdomain.com/admin`
- **Default Admin**: `admin@nexus-shop.com`

## 📞 Support

For deployment issues:
1. Check `docs/TROUBLESHOOTING.md`
2. Verify all environment variables
3. Check cPanel error logs
4. Contact your hosting provider

## 📖 Documentation

- `docs/DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- `docs/API_DOCUMENTATION.md` - API reference
- `docs/ADMIN_GUIDE.md` - Admin panel guide

---

**🎉 Your Nexus Shop is ready for production!**
