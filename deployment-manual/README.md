# Nexus Shop - E-commerce Platform

A modern, feature-rich e-commerce platform built with Next.js, TypeScript, and Prisma.

## Features

### Core E-commerce
- **Product Management**: Create, edit, and manage products with categories
- **Inventory Management**: Track stock levels and set low stock alerts
- **Order Management**: Complete order lifecycle from placement to delivery
- **Customer Management**: Customer profiles and order history
- **Shopping Cart**: Persistent cart with real-time updates

### Advanced Features
- **AI Integration**: OpenAI-powered product descriptions and recommendations
- **Analytics Dashboard**: Sales metrics and business insights
- **Pixel Tracking**: Facebook and TikTok pixel integration for marketing
- **Responsive Design**: Mobile-first, modern UI/UX

### Courier Integration
- **Steadfast Courier API**: Full integration with Bangladesh's leading courier service
- **Automated Order Processing**: Send orders to courier automatically
- **Real-time Tracking**: Live delivery status updates
- **Bulk Operations**: Process multiple orders simultaneously
- **Balance Management**: Monitor courier account balance

## Courier Features

The platform includes comprehensive courier integration with Steadfast Courier Limited:

- **Order Creation**: Automatically create courier orders when processing
- **Status Tracking**: Real-time delivery status updates
- **Bulk Processing**: Handle up to 500 orders per request
- **Return Management**: Create and track return requests
- **Balance Checking**: Monitor courier account balance
- **API Management**: Secure API key and secret management

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production ready)
- **Authentication**: NextAuth.js
- **AI**: OpenAI API integration
- **Courier**: Steadfast Courier API integration

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Steadfast Courier API credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nexus-shop
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Configure your environment variables:
```env
# Database
DATABASE_URL="file:./dev.db"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Courier (Steadfast)
STEADFAST_API_KEY="your-steadfast-api-key"
STEADFAST_SECRET_KEY="your-steadfast-secret-key"
STEADFAST_BASE_URL="https://portal.packzy.com/api/v1"
```

5. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Courier Setup

1. **Get API Credentials**: Contact Steadfast Courier Limited for API access
2. **Configure Settings**: Go to Admin → Settings → Courier Settings
3. **Enter Credentials**: Add your API Key and Secret Key
4. **Activate Service**: Toggle the service to active
5. **Test Integration**: Create a test order and send to courier

## API Endpoints

### Courier API
- `POST /api/courier/orders` - Create courier order
- `GET /api/courier/orders` - Get all courier orders
- `POST /api/courier/status` - Update courier status
- `GET /api/courier/balance` - Check courier balance

### Settings API
- `GET /api/settings/courier` - Get courier settings
- `POST /api/settings/courier` - Save courier settings
- `PUT /api/settings/courier` - Update courier settings

## Admin Panel

Access the admin panel at `/admin` to manage:
- Products and categories
- Inventory levels
- Order processing
- Courier integration
- Site settings
- Analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in `/docs` folder
