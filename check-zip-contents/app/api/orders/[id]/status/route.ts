import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, previousStatus } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Get the order with items to manage stock
    const order = await db.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Handle stock management based on status changes
    if (status === 'cancelled' || status === 'refunded') {
      // If order is cancelled/refunded, restore stock
      for (const item of order.items) {
        await db.inventory.update({
          where: { productId: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
        console.log(`Restored ${item.quantity} units of product ${item.productId} to stock`);
      }
    } else if (previousStatus === 'cancelled' || previousStatus === 'refunded') {
      // If order was previously cancelled/refunded and now being processed, reduce stock again
      for (const item of order.items) {
        await db.inventory.update({
          where: { productId: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
        console.log(`Reduced ${item.quantity} units of product ${item.productId} from stock`);
      }
    }
    // For new orders, stock is already reduced when order is created

    // Update order status
    const updatedOrder = await db.order.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    console.log(`Order ${id} status updated to: ${status}`);

    // Log admin activity
    try {
      const c = cookies();
      const actor = Number(c.get('session_user')?.value || '0') || null;
      if (actor) {
        await db.adminActivityLog.create({
          data: {
            actorId: actor,
            action: 'update_order_status',
            targetType: 'order',
            targetId: String(id),
            meta: { previousStatus: previousStatus || null, newStatus: status }
          }
        });
      }
    } catch (logErr) {
      console.warn('Activity log failed:', logErr);
    }

    // Auto-update Selling Targets when order moves to in-courier (real sale booked)
    try {
      if (status === 'in-courier' && previousStatus !== 'in-courier') {
        const now = new Date();
        const year = now.getFullYear();
        const monthName = now.toLocaleString('default', { month: 'long' });
        const date = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Aggregate quantities per product in case same product appears multiple times
        const productIdToQty: Record<number, number> = {};
        for (const item of updatedOrder.items) {
          productIdToQty[item.productId] = (productIdToQty[item.productId] || 0) + item.quantity;
        }

        const tasks: Promise<any>[] = [];
        for (const [productIdStr, qty] of Object.entries(productIdToQty)) {
          const productId = parseInt(productIdStr, 10);
          tasks.push((async () => {
            // Find matching AdProductEntry for this month/year
            let adEntry = await db.adProductEntry.findFirst({
              where: {
                productId: productId,
                month: monthName,
                year: year,
              }
            });
            // Fallback by productName if productId not set in AdProductEntry
            if (!adEntry) {
              const anyItem = updatedOrder.items.find(i => i.productId === productId);
              const productName = anyItem?.product?.name;
              if (productName) {
                adEntry = await db.adProductEntry.findFirst({
                  where: { productName: productName, month: monthName, year: year },
                });
              }
            }
            if (!adEntry) return;

            // Upsert selling target for today, increment soldUnits by qty
            await db.sellingTargetEntry.upsert({
              where: {
                adProductEntryId_date: {
                  adProductEntryId: adEntry.id,
                  date: date,
                }
              },
              update: {
                soldUnits: { increment: qty }
              },
              create: {
                adProductEntryId: adEntry.id,
                date: date,
                targetUnits: adEntry.requiredDailyUnits || 0,
                soldUnits: qty,
              }
            });
          })());
        }

        await Promise.all(tasks);
        console.log(`✅ Selling targets auto-updated for order ${id} on ${date}`);

        // Auto-create courier order when status changes to in-courier
        try {
          const courierOrderResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/courier/orders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: id,
              courierService: 'steadfast',
              orderType: 'website'
            })
          });

          if (courierOrderResponse.ok) {
            const courierOrderData = await courierOrderResponse.json();
            console.log(`✅ Courier order auto-created:`, courierOrderData);
          } else {
            console.error(`❌ Failed to auto-create courier order: ${courierOrderResponse.status}`);
          }
        } catch (courierErr) {
          console.error('⚠️ Failed to auto-create courier order:', courierErr);
          // Non-blocking failure; order status update already succeeded
        }
      }
    } catch (autoErr) {
      console.error('⚠️ Failed to auto-update selling targets for order status change:', autoErr);
      // Non-blocking failure; order status update already succeeded
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
