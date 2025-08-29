# API Documentation for Nexus Shop

## 🔗 Base URL
```
http://localhost:3000/api
```

## 📊 Products API

### Get All Products
```http
GET /api/products
```

**Response:**
```json
[
  {
    "id": "1",
    "name": "Wireless Bluetooth Headphones",
    "slug": "wireless-bluetooth-headphones",
    "description": "High-quality wireless headphones...",
    "regularPrice": 99.99,
    "salePrice": 79.99,
    "buyPrice": 45.00,
    "currency": "USD",
    "categoryName": "Electronics",
    "images": ["image1.jpg", "image2.jpg"],
    "stock": 25,
    "status": "ACTIVE"
  }
]
```

### Get Product by Slug
```http
GET /api/products/{slug}
```

### Create Product
```http
POST /api/products
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product description",
  "regularPrice": 99.99,
  "salePrice": 79.99,
  "buyPrice": 45.00,
  "categoryId": 1,
  "currency": "USD",
  "images": ["image1.jpg", "image2.jpg"]
}
```

## 📂 Categories API

### Get All Categories
```http
GET /api/categories
```

**Response:**
```json
[
  {
    "id": "1",
    "name": "Electronics",
    "slug": "electronics",
    "imageUrl": "electronics.jpg",
    "productCount": 15,
    "children": []
  }
]
```

### Get Category by Slug
```http
GET /api/categories/{slug}
```

**Response includes products:**
```json
{
  "id": "1",
  "name": "Electronics",
  "products": [
    {
      "id": "1",
      "name": "Product Name",
      "regularPrice": 99.99,
      "images": ["image1.jpg"]
    }
  ]
}
```

### Create Category
```http
POST /api/categories
Content-Type: application/json

{
  "name": "Category Name",
  "imageUrl": "category.jpg",
  "parentId": null
}
```

## 📋 Orders API

### Get All Orders
```http
GET /api/orders
```

**Response:**
```json
[
  {
    "id": 1,
    "orderNo": "ORD-1234567890-ABC123",
    "customerName": "John Doe",
    "userEmail": "john@example.com",
    "phone": "+1234567890",
    "status": "PENDING",
    "paymentStatus": "UNPAID",
    "total": 129.97,
    "currency": "USD",
    "items": [
      {
        "productId": 1,
        "productName": "Product Name",
        "quantity": 2,
        "price": 64.99
      }
    ]
  }
]
```

### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "customerName": "John Doe",
  "userEmail": "john@example.com",
  "phone": "+1234567890",
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 64.99
    }
  ],
  "shippingMethod": "Standard Shipping",
  "shippingCost": 10.00,
  "subtotal": 129.98,
  "total": 139.98,
  "currency": "USD"
}
```

### Update Order Status
```http
PATCH /api/orders/{id}/status
Content-Type: application/json

{
  "status": "PROCESSING"
}
```

**Valid statuses:** `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`

## ⚙️ Settings API

### Get Site Settings
```http
GET /api/settings
```

**Response:**
```json
{
  "id": 1,
  "header": {
    "logo": "",
    "backgroundColor": "#ffffff",
    "textColor": "#000000",
    "enableNewsTicker": true,
    "topHeaderText": "Free shipping on orders over $50!"
  },
  "banner": {
    "banners": [],
    "autoSlide": true,
    "slideInterval": 5000
  },
  "general": {
    "siteName": "Nexus Shop",
    "currency": "USD"
  }
}
```

### Update Site Settings
```http
POST /api/settings
Content-Type: application/json

{
  "header": {
    "backgroundColor": "#000000",
    "textColor": "#ffffff"
  },
  "general": {
    "siteName": "New Shop Name"
  }
}
```

## 🤖 AI API

### Generate Product Description
```http
POST /api/ai
Content-Type: application/json

{
  "name": "Product Name",
  "category": "Electronics",
  "keyPoints": ["Feature 1", "Feature 2"],
  "tone": "concise",
  "language": "bn",
  "apiKey": "your-openai-api-key"
}
```

## 🔐 Authentication

Currently, the API endpoints are public. For production use, implement:

1. **JWT Authentication** for user endpoints
2. **API Key Authentication** for admin endpoints
3. **Rate Limiting** to prevent abuse
4. **CORS Configuration** for security

## 📝 Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## 🚀 Rate Limiting

Consider implementing rate limiting:

```typescript
// Example rate limiting middleware
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};
```

## 📊 Data Validation

All input data is validated using:

1. **TypeScript interfaces** for compile-time validation
2. **Runtime validation** in API endpoints
3. **Prisma schema validation** for database constraints

## 🔄 Caching

The API implements intelligent caching:

- **Product data**: 2 minutes cache
- **Category data**: 5 minutes cache
- **Settings**: No cache (always fresh)

## 📱 Mobile Optimization

All endpoints are optimized for mobile:

- **Lightweight responses**
- **Efficient data structures**
- **Minimal payload size**
- **Fast response times**

## 🧪 Testing

Test the API endpoints using:

```bash
# Test products endpoint
curl http://localhost:3000/api/products

# Test categories endpoint
curl http://localhost:3000/api/categories

# Test orders endpoint
curl http://localhost:3000/api/orders
```

## 📚 Additional Resources

- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
