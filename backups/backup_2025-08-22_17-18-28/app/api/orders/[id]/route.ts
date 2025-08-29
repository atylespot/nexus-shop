import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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
  { params }: { params: { id: string } }
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
