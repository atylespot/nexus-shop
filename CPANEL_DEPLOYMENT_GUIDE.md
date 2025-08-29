# cPanel Deployment Guide for Nexus Shop

## 🚀 Step-by-Step Deployment

### 1. Database Setup (MySQL)

#### A. Create Database
1. Login to cPanel
2. Go to **MySQL Databases**
3. Create Database: `nexus_shop`
4. Create User: `nexus_user`
5. Add User to Database
6. Grant **ALL PRIVILEGES**

#### B. Database Connection String
```env
DATABASE_URL="mysql://nexus_user:password@localhost:3306/nexus_shop"
```

### 2. Node.js App Setup

#### A. Create Node.js App
1. cPanel → **Node.js Apps**
2. **Create Application**
3. Node.js version: **18.x** or higher
4. Application mode: **Production**
5. Application root: `/home/username/nexus-shop`
6. Application URL: `yourdomain.com`
7. Application startup file: `server.js`
8. Passenger port: `3000`

#### B. Environment Variables
```env
# Database
DATABASE_URL="mysql://nexus_user:password@localhost:3306/nexus_shop"

# Next.js
NODE_ENV="production"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://yourdomain.com"

# OpenAI
OPENAI_API_KEY="your-openai-key"

# Courier
STEADFAST_API_KEY="your-courier-key"
STEADFAST_SECRET_KEY="your-courier-secret"

# Email
SENDGRID_API_KEY="your-sendgrid-key"
```

### 3. File Upload

#### A. Upload Files
1. cPanel → **File Manager**
2. Navigate to `/home/username/nexus-shop`
3. Upload these files:
   - `.next/` (build folder)
   - `public/` (static files)
   - `prisma/` (database schema)
   - `package.json`
   - `package-lock.json`
   - `next.config.ts`
   - `server.js`
   - `.env` (production variables)

#### B. File Permissions
```bash
# Set permissions
chmod 755 /home/username/nexus-shop
chmod 644 /home/username/nexus-shop/.env
```

### 4. Build and Deploy

#### A. Install Dependencies
```bash
# SSH to server or use Terminal in cPanel
cd /home/username/nexus-shop
npm install --production
```

#### B. Build Project
```bash
npm run build
npx prisma generate
npx prisma db push
```

#### C. Start Application
```bash
# In Node.js App settings
npm start
```

### 5. Domain and SSL

#### A. Domain Configuration
1. cPanel → **Domains**
2. Add domain: `yourdomain.com`
3. Point to: `/home/username/nexus-shop`

#### B. SSL Certificate
1. cPanel → **SSL/TLS**
2. Install SSL certificate
3. Force HTTPS redirect

### 6. Performance Optimization

#### A. Caching
```bash
# Enable caching in .htaccess
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

#### B. Compression
```bash
# Enable gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### 7. Monitoring and Maintenance

#### A. Logs
- Check error logs: `/home/username/nexus-shop/logs/`
- Monitor application logs in cPanel

#### B. Backups
1. Database backup: cPanel → **Backup**
2. File backup: Download entire project folder

#### C. Updates
```bash
# Update dependencies
npm update
npm run build
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Errors
```bash
# Clear cache
rm -rf .next
npm run build
```

#### 2. Database Connection
```bash
# Test connection
npx prisma db pull
```

#### 3. Port Issues
- Check if port 3000 is available
- Update passenger port in Node.js app settings

#### 4. Memory Issues
- Increase Node.js memory limit in cPanel
- Optimize images and assets

## 📞 Support

For issues:
1. Check cPanel error logs
2. Verify environment variables
3. Test database connection
4. Contact hosting provider

## ✅ Checklist

- [ ] Database created and configured
- [ ] Node.js app created
- [ ] Files uploaded
- [ ] Dependencies installed
- [ ] Project built successfully
- [ ] Database schema pushed
- [ ] Application started
- [ ] Domain configured
- [ ] SSL installed
- [ ] Performance optimized
- [ ] Monitoring set up
