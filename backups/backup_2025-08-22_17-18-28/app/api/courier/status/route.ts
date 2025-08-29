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

    // Update courier order status
    const updatedCourierOrder = await prisma.courierOrder.update({
      where: { id: courierOrder.id },
      data: {
        courierStatus: statusResponse.delivery_status
      }
    });

    // Update order status based on courier status
    let orderStatus = 'SHIPPED';
    if (statusResponse.delivery_status === 'delivered') {
      orderStatus = 'DELIVERED';
    } else if (statusResponse.delivery_status === 'cancelled') {
      orderStatus = 'CANCELLED';
    } else if (statusResponse.delivery_status === 'hold') {
      orderStatus = 'ON_HOLD';
    }

    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: orderStatus }
    });

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
