import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Optional collection-level status change via body { id, status }
export async function PATCH(request: NextRequest) {
  try {
    const { id, status, previousStatus } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    // Delegate to the same logic as [id]/status by reproducing minimal stock handling
    const order = await db.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true,
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (status === 'cancelled' || status === 'refunded') {
      for (const item of order.items) {
        await db.inventory.update({
          where: { productId: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }
    } else if (previousStatus === 'cancelled' || previousStatus === 'refunded') {
      for (const item of order.items) {
        await db.inventory.update({
          where: { productId: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }
    }

    const updated = await db.order.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    // Auto-update Selling Targets when order moves to in-courier
    try {
      if (status === 'in-courier' && previousStatus !== 'in-courier') {
        const now = new Date();
        const year = now.getFullYear();
        const monthName = now.toLocaleString('default', { month: 'long' });
        const date = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Aggregate qty per product
        const productIdToQty: Record<number, number> = {};
        for (const item of order.items) {
          productIdToQty[item.productId] = (productIdToQty[item.productId] || 0) + item.quantity;
        }

        const tasks: Promise<any>[] = [];
        for (const [productIdStr, qty] of Object.entries(productIdToQty)) {
          const productId = parseInt(productIdStr, 10);
          tasks.push((async () => {
            let adEntry = await db.adProductEntry.findFirst({
              where: { productId, month: monthName, year }
            });
            if (!adEntry) {
              const anyItem = order.items.find(i => i.productId === productId);
              const productName = anyItem?.product?.name;
              if (productName) {
                adEntry = await db.adProductEntry.findFirst({ where: { productName, month: monthName, year } });
              }
            }
            if (!adEntry) return;
            await db.sellingTargetEntry.upsert({
              where: {
                adProductEntryId_date: {
                  adProductEntryId: adEntry.id,
                  date
                }
              },
              update: { soldUnits: { increment: qty } },
              create: {
                adProductEntryId: adEntry.id,
                date,
                targetUnits: adEntry.requiredDailyUnits || 0,
                soldUnits: qty
              }
            });
          })());
        }

        await Promise.all(tasks);
        console.log(`✅ Selling targets auto-updated for order ${id} on ${date} (collection route)`);
      }
    } catch (autoErr) {
      console.error('⚠️ Failed to auto-update selling targets (collection route):', autoErr);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
