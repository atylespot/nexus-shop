import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = params;
    const courierOrderId = parseInt(id);

    console.log(`🗑️ Attempting to delete courier order ID: ${courierOrderId}`);

    // Find the courier order
    const courierOrder = await prisma.courierOrder.findUnique({
      where: { id: courierOrderId }
    });

    if (!courierOrder) {
      console.log(`❌ Courier order not found: ${courierOrderId}`);
      return NextResponse.json(
        { error: 'Courier order not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Found courier order for order ID: ${courierOrder.orderId}`);

    // Delete the courier order
    await prisma.courierOrder.delete({
      where: { id: courierOrderId }
    });

    console.log(`✅ Courier order deleted successfully`);

    return NextResponse.json({
      success: true,
      message: 'Courier order deleted successfully'
    });

  } catch (error) {
    console.error('❌ Courier order deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete courier order' },
      { status: 500 }
    );
  }
}
