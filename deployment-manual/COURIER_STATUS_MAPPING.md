# 🚚 Courier Status Mapping Documentation

## Overview
This document explains how courier service statuses are mapped to order statuses in the Nexus Shop system.

## 🔄 Status Mapping Table

| Courier Status | Order Status | Description | Action |
|----------------|--------------|-------------|---------|
| `delivered` | `delivered` | Package successfully delivered | Mark order as completed |
| `cancelled` | `cancelled` | Courier cancelled the delivery | Cancel order and restore stock |
| `hold` | `processing` | Delivery put on hold | Return order to processing state |
| `in_transit` | `in-courier` | Package in transit | Mark order as shipped |
| `shipped` | `in-courier` | Package shipped from courier | Mark order as shipped |
| `pending` | `processing` | Waiting for courier pickup | Keep order in processing |
| `returned` | `cancelled` | Package returned to sender | Cancel order and restore stock |
| `unknown_status` | `unchanged` | Unrecognized courier status | Keep current order status |

## 📡 API Endpoints

### 1. Update Courier Status
```http
POST /api/courier/status
Content-Type: application/json

{
  "orderId": "123",
  "trackingCode": "TRK123456",
  "consignmentId": "CON789"
}
```

### 2. Test Status Mapping
```http
GET /api/courier/status?testMapping=true
```

### 3. Get Courier Order Status
```http
GET /api/courier/status?orderId=123
```

## 🔧 Implementation Details

### Status Update Logic
1. **Fetch courier status** from external service
2. **Map courier status** to order status using switch statement
3. **Update courier order** with new status and timestamp
4. **Update main order** only if status changed
5. **Log changes** for audit trail

### Stock Management
- **Cancelled/Returned orders**: Stock is restored
- **Processing orders**: Stock remains reduced
- **Delivered orders**: Stock remains reduced (sale completed)

### Error Handling
- **Unknown courier statuses**: Order status remains unchanged
- **API failures**: Proper error responses with status codes
- **Validation**: Required fields checked before processing

## 🧪 Testing

### Test Status Mapping
```bash
curl -X GET "http://localhost:3000/api/courier/status?testMapping=true"
```

### Test Status Update
```bash
curl -X POST "http://localhost:3000/api/courier/status" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "123",
    "trackingCode": "TRK123456"
  }'
```

## 📝 Notes

- **Status consistency**: All order statuses now use lowercase format
- **No duplicate updates**: Order status only changes if different from current
- **Audit trail**: All status changes are logged with timestamps
- **Fallback handling**: Unknown courier statuses don't break the system

## 🔄 Flow Diagram

```
Courier API → Status Mapping → Order Update → Stock Management
     ↓              ↓              ↓              ↓
  delivered    →  delivered   →  Update     →  No change
  cancelled    →  cancelled   →  Update     →  Restore stock
  in_transit   →  in-courier  →  Update     →  No change
  hold         →  processing  →  Update     →  No change
  unknown      →  unchanged   →  No update  →  No change
```

## 🚨 Important Considerations

1. **Stock synchronization**: Always ensure stock changes match order status
2. **Status validation**: Only valid transitions should be allowed
3. **Audit logging**: All status changes must be logged
4. **Error handling**: Graceful degradation for unknown statuses
5. **Performance**: Minimize database calls during status updates
