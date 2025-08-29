# Database Setup Guide for Nexus Shop

## 🚀 Quick Start

### 1. Environment Variables
Create a `.env.local` file in your project root:

```bash
# Database
DATABASE_URL="file:./dev.db"

# OpenAI
OPENAI_API_KEY="your-openai-api-key-here"

# App
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database with sample data
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

## 📊 Database Schema

The project uses Prisma ORM with the following main models:

- **Category**: Product categories with hierarchical support
- **Product**: Products with images, pricing, and inventory
- **Inventory**: Stock management for products
- **Order**: Customer orders with items
- **OrderItem**: Individual items in orders
- **ProductImage**: Product images with ordering
- **SiteSetting**: Configurable site settings
- **PixelSetting**: Analytics and tracking pixels

## 🔧 Available Scripts

- `npm run db:seed` - Populate database with sample data
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio for database management

## 📝 Sample Data

The seeding script creates:

- 4 main categories (Electronics, Clothing, Books, Home & Garden)
- 6 sample products with images and inventory
- 2 sample orders
- Default site settings and header configuration

## 🗄️ Database Management

### Prisma Studio
```bash
npm run db:studio
```
Opens a web interface to view and edit your database.

### Manual Database Reset
```bash
# Delete the database file
rm prisma/dev.db

# Recreate and seed
npm run db:push
npm run db:seed
```

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Use strong, unique secrets for production
- Regularly rotate API keys
- Monitor database access logs

## 🚨 Troubleshooting

### Common Issues

1. **Database locked error**
   - Close Prisma Studio
   - Restart development server

2. **Schema sync issues**
   - Run `npm run db:generate` first
   - Then `npm run db:push`

3. **Seeding fails**
   - Ensure database is created first
   - Check for duplicate data constraints

### Reset Everything
```bash
# Complete reset
rm -rf prisma/dev.db
rm -rf .next
npm run db:push
npm run db:seed
npm run dev
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Database Integration](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [SQLite Best Practices](https://www.sqlite.org/bestpractices.html)
