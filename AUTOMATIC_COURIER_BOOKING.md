# 🚚 Automatic Courier Booking System

## Overview
This system automatically creates courier orders when an order status is changed to "in-courier" in the Nexus Shop admin panel.

## 🔄 How It Works

### 1. **Order Status Change Trigger**
When an admin changes an order status from any status to "in-courier":
- Frontend calls `/api/courier/orders` to create courier order
- Backend automatically creates courier order in database
- Order status is updated to "in-courier"

### 2. **Automatic Courier Order Creation**
```typescript
// Triggered in app/admin/orders/page.tsx
if (newStatus === 'in-courier' && previousStatus !== 'in-courier') {
  const courierResponse = await fetch('/api/courier/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      note: 'Order automatically sent to courier via status change',
      deliveryType: 0 // Home delivery
    })
  });
}
```

### 3. **Backend Processing**
```typescript
// app/api/courier/orders/route.ts
export async function POST(request: NextRequest) {
  // 1. Validate order ID
  // 2. Check if courier order already exists
  // 3. Get courier settings
  // 4. Calculate delivery charge
  // 5. Create courier order
}
```

## 📡 API Endpoints

### **POST /api/courier/orders**
Creates a new courier order automatically.

**Request Body:**
```json
{
  "orderId": "123",
  "courierService": "steadfast"
}
```

**Response:**
```json
{
  "message": "Courier order created successfully",
  "data": {
    "id": 1,
    "orderId": 123,
    "courierStatus": "pending",
    "deliveryCharge": 80,
    "courierNote": "Auto-created when order status changed to in-courier"
  }
}
```

### **GET /api/courier/orders**
Retrieves all courier orders or a specific one.

**Query Parameters:**
- `orderId` (optional): Get specific courier order

## 🔧 Implementation Details

### **Frontend Integration**
- **File:** `app/admin/orders/page.tsx`
- **Function:** `updateOrderStatus()`
- **Trigger:** Status change to "in-courier"

### **Backend Processing**
- **File:** `app/api/courier/orders/route.ts`
- **Database:** Creates record in `CourierOrder` table
- **Validation:** Checks for existing orders, validates data

### **Error Handling**
- **API Failure:** Shows error message, doesn't update order status
- **Validation Error:** Returns 400 with error details
- **Database Error:** Returns 500 with generic error

## 📊 Database Schema

### **CourierOrder Table**
```sql
CREATE TABLE CourierOrder (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId INTEGER UNIQUE,
  courierStatus TEXT DEFAULT 'pending',
  courierNote TEXT,
  deliveryCharge REAL,
  courierResponse JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 Testing

### **1. Test API Endpoints**
```bash
node test-courier-api.js
```

### **2. Manual Testing**
1. Go to Admin Panel → Orders
2. Change any order status to "In Courier"
3. Check if courier order is created automatically
4. Verify in Courier Orders page

### **3. API Testing**
```bash
# Test GET endpoint
curl -X GET "http://localhost:3000/api/courier/orders"

# Test POST endpoint
curl -X POST "http://localhost:3000/api/courier/orders" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "123"}'
```

## 🚨 Troubleshooting

### **Common Issues**

#### **1. 404 Error - Courier Orders API**
**Problem:** `POST /api/courier/orders 404 (Not Found)`
**Solution:** Ensure `app/api/courier/orders/route.ts` exists

#### **2. Database Connection Error**
**Problem:** Failed to create courier order
**Solution:** Check database connection and CourierOrder table

#### **3. Validation Error**
**Problem:** Invalid order ID
**Solution:** Ensure orderId is a valid number

### **Debug Steps**
1. Check browser console for errors
2. Verify API endpoint exists
3. Check database connection
4. Validate request data
5. Check courier settings

## 📝 Configuration

### **Environment Variables**
```env
NEXTAUTH_URL=http://localhost:3000
```

### **Courier Settings**
Ensure `CourierSetting` table has active courier service:
```sql
INSERT INTO CourierSetting (apiKey, secretKey, baseUrl, isActive) 
VALUES ('your-api-key', 'your-secret', 'https://portal.packzy.com/api/v1', 1);
```

## 🔄 Flow Diagram

```
Order Status Change → Frontend Trigger → API Call → Backend Processing → Database Update
      ↓                    ↓              ↓              ↓                ↓
  "in-courier"    →  updateOrderStatus → POST /api/courier/orders → Create CourierOrder → Success Response
```

## ✅ Success Indicators

- ✅ Courier order created in database
- ✅ Order status updated to "in-courier"
- ✅ Success message shown to admin
- ✅ Redirect to courier orders page
- ✅ No error messages in console

## 🎯 Next Steps

1. **Test the system** with existing orders
2. **Configure courier settings** if not done
3. **Monitor logs** for any issues
4. **Customize delivery charges** based on requirements
5. **Add more courier services** if needed
