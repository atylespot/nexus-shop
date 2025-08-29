import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = params;
    const orderId = parseInt(id);

    console.log(`🗑️ Attempting to delete order ID: ${orderId}`);

    // First, check if it's a website order
    let order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (order) {
      console.log(`✅ Found website order: ${order.orderNo}`);
      
      // Delete order items first (due to foreign key constraints)
      if (order.items && order.items.length > 0) {
        await prisma.orderItem.deleteMany({
          where: { orderId: orderId }
        });
        console.log(`🗑️ Deleted ${order.items.length} order items`);
      }

      // Delete the order
      await prisma.order.delete({
        where: { id: orderId }
      });
      console.log(`✅ Website order deleted successfully`);

      return NextResponse.json({
        success: true,
        message: 'Website order deleted successfully'
      });
    }

    // If not a website order, check if it's a landing page order
    order = await prisma.landingPageOrder.findUnique({
      where: { id: orderId },
      include: { product: true, history: true }
    });

    if (order) {
      console.log(`✅ Found landing page order: ${order.customerName}`);
      
      // Delete order history first
      if (order.history && order.history.length > 0) {
        await prisma.orderHistory.deleteMany({
          where: { orderId: orderId }
        });
        console.log(`🗑️ Deleted ${order.history.length} order history records`);
      }

      // Delete the landing page order
      await prisma.landingPageOrder.delete({
        where: { id: orderId }
      });
      console.log(`✅ Landing page order deleted successfully`);

      return NextResponse.json({
        success: true,
        message: 'Landing page order deleted successfully'
      });
    }

    // If neither found, return 404
    console.log(`❌ Order not found: ${orderId}`);
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('❌ Order deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'স্ট্যাটাস প্রয়োজন' },
        { status: 400 }
      );
    }

    // Get current order
    const currentOrder = await prisma.landingPageOrder.findUnique({
      where: { id: parseInt(id) },
      include: { product: true }
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'অর্ডার পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.landingPageOrder.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    // Create order history
    await prisma.orderHistory.create({
      data: {
        orderId: parseInt(id),
        status,
        statusDate: new Date(),
        notes: notes || `স্ট্যাটাস পরিবর্তন: ${status}`
      }
    });

    // Handle inventory updates based on status
    if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
      // If order is being cancelled, increase inventory back
      await prisma.inventory.update({
        where: { productId: currentOrder.productId },
        data: {
          quantity: {
            increment: 1
          }
        }
      });
    } else if (status === 'processing' && currentOrder.status === 'cancelled') {
      // If order is being reactivated from cancelled, decrease inventory again
      await prisma.inventory.update({
        where: { productId: currentOrder.productId },
        data: {
          quantity: {
            decrement: 1
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'অর্ডার স্ট্যাটাস আপডেট হয়েছে',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { error: 'অর্ডার আপডেট করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = params;
    
    const order = await prisma.landingPageOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: true,
        history: {
          orderBy: {
            statusDate: 'desc'
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'অর্ডার পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { error: 'অর্ডার লোড করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
