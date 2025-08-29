#!/bin/bash

# Production Deployment Script
echo "🚀 Starting production deployment..."

# Build the project
echo "📦 Building project..."
npm run build

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🔄 Pushing database schema..."
npx prisma db push

echo "✅ Deployment completed!"
echo "🌐 Your app is ready at: https://yourdomain.com"
