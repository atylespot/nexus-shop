import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SteadfastCourierService } from '@/lib/courier';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, trackingCode, consignmentId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get courier settings
    const courierSetting = await prisma.courierSetting.findFirst();
    if (!courierSetting || !courierSetting.isActive) {
      return NextResponse.json(
        { error: 'Courier service is not configured or not active' },
        { status: 400 }
      );
    }

    // Get courier order
    const courierOrder = await prisma.courierOrder.findUnique({
      where: { orderId: parseInt(orderId) }
    });

    if (!courierOrder) {
      return NextResponse.json(
        { error: 'Courier order not found' },
        { status: 404 }
      );
    }

    // Initialize courier service
    const courierService = new SteadfastCourierService(
      courierSetting.apiKey,
      courierSetting.secretKey,
      courierSetting.baseUrl
    );

    let statusResponse;

    // Try to get status by different methods
    if (consignmentId) {
      statusResponse = await courierService.getDeliveryStatusByConsignmentId(consignmentId);
    } else if (trackingCode) {
      statusResponse = await courierService.getDeliveryStatusByTrackingCode(trackingCode);
    } else if (courierOrder.consignmentId) {
      statusResponse = await courierService.getDeliveryStatusByConsignmentId(courierOrder.consignmentId);
    } else if (courierOrder.trackingCode) {
      statusResponse = await courierService.getDeliveryStatusByTrackingCode(courierOrder.trackingCode);
    } else {
      return NextResponse.json(
        { error: 'No tracking information available' },
        { status: 400 }
      );
    }

    if (statusResponse.status !== 200) {
      throw new Error('Failed to get delivery status');
    }

    // Update courier order status with timestamp
    const updatedCourierOrder = await prisma.courierOrder.update({
      where: { id: courierOrder.id },
      data: {
        courierStatus: statusResponse.delivery_status,
        courierNote: `Last updated: ${new Date().toISOString()} - Status: ${statusResponse.delivery_status}`,
        updatedAt: new Date()
      }
    });

    // Update order status based on courier status - Fixed mapping
    let orderStatus = 'processing'; // Default fallback
    
    // Map courier status to order status
    // This mapping ensures consistency between courier service and order system
    switch (statusResponse.delivery_status) {
      case 'delivered':
        orderStatus = 'delivered';
        break;
      case 'cancelled':
        orderStatus = 'cancelled';
        break;
      case 'hold':
        orderStatus = 'processing'; // Put on hold = back to processing
        break;
      case 'in_transit':
      case 'shipped':
        orderStatus = 'in-courier';
        break;
      case 'pending':
        orderStatus = 'processing';
        break;
      case 'returned':
        orderStatus = 'cancelled'; // Treat return as cancellation
        break;
      default:
        // For unknown courier statuses, keep current order status
        console.log(`Unknown courier status: ${statusResponse.delivery_status}, keeping current order status`);
        return NextResponse.json({ 
          message: 'Courier status updated but order status unchanged',
          data: {
            courierOrder: updatedCourierOrder,
            status: statusResponse.delivery_status,
            orderStatus: 'unchanged'
          }
        });
    }

    // Only update order status if it's different from current status
    const currentOrder = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      select: { status: true }
    });
    
    if (currentOrder && currentOrder.status !== orderStatus) {
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { status: orderStatus }
      });
      console.log(`Order ${orderId} status updated from ${currentOrder.status} to ${orderStatus}`);
    } else {
      console.log(`Order ${orderId} status unchanged: ${currentOrder?.status} (same as ${orderStatus})`);
    }

    return NextResponse.json({ 
      message: 'Courier status updated successfully',
      data: {
        courierOrder: updatedCourierOrder,
        status: statusResponse.delivery_status,
        orderStatus
      }
    });
  } catch (error) {
    console.error('Error updating courier status:', error);
    return NextResponse.json(
      { error: 'Failed to update courier status' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const testMapping = searchParams.get('testMapping');

    // Test status mapping endpoint
    if (testMapping === 'true') {
      const testCases = [
        { courierStatus: 'delivered', expectedOrderStatus: 'delivered' },
        { courierStatus: 'cancelled', expectedOrderStatus: 'cancelled' },
        { courierStatus: 'hold', expectedOrderStatus: 'processing' },
        { courierStatus: 'in_transit', expectedOrderStatus: 'in-courier' },
        { courierStatus: 'shipped', expectedOrderStatus: 'in-courier' },
        { courierStatus: 'pending', expectedOrderStatus: 'processing' },
        { courierStatus: 'returned', expectedOrderStatus: 'cancelled' },
        { courierStatus: 'unknown_status', expectedOrderStatus: 'unchanged' }
      ];

      return NextResponse.json({
        message: 'Courier to Order Status Mapping Test',
        mapping: testCases,
        note: 'Use POST /api/courier/status to test actual status updates'
      });
    }

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get courier order
    const courierOrder = await prisma.courierOrder.findUnique({
      where: { orderId: parseInt(orderId) },
      include: {
        order: true
      }
    });

    if (!courierOrder) {
      return NextResponse.json(
        { error: 'Courier order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Courier order status retrieved successfully',
      data: courierOrder 
    });
  } catch (error) {
    console.error('Error fetching courier order status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courier order status' },
      { status: 500 }
    );
  }
}
