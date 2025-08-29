import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE() {
  try {
    console.log('🧹 Cleaning fake courier orders...');

    // Simple approach: delete all courier orders
    const result = await db.courierOrder.deleteMany({});

    console.log(`✅ Deleted ${result.count} courier orders`);

    return NextResponse.json({
      message: `Deleted ${result.count} courier orders`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('❌ Error cleaning courier orders:', error);
    return NextResponse.json(
      { error: 'Failed to clean courier orders' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Just return count of fake courier orders
    const courierOrders = await db.courierOrder.findMany({
      select: {
        id: true,
        courierResponse: true
      }
    });

    const fakeCount = courierOrders.filter(order => {
      const consignmentId = order.courierResponse?.consignment?.consignment_id;
      return consignmentId && String(consignmentId).startsWith('CO-');
    }).length;

    return NextResponse.json({
      message: `Found ${fakeCount} fake courier orders out of ${courierOrders.length} total`,
      totalOrders: courierOrders.length,
      fakeOrders: fakeCount,
      realOrders: courierOrders.length - fakeCount
    });
  } catch (error) {
    console.error('❌ Error getting courier order stats:', error);
    return NextResponse.json(
      { error: 'Failed to get courier order stats' },
      { status: 500 }
    );
  }
}
