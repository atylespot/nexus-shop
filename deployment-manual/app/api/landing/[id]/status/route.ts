import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    // Get the landing page order
    const order = await db.landingPageOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Landing page order not found' },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await db.landingPageOrder.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        product: true
      }
    });

    console.log(`Landing page order ${id} status updated to: ${status}`);

    // Auto-create courier order when status changes to in-courier
    if (status === 'in-courier' && previousStatus !== 'in-courier') {
      try {
        const courierOrderResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/courier/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: id,
            courierService: 'steadfast',
            orderType: 'landing_page'
          })
        });

        if (courierOrderResponse.ok) {
          const courierOrderData = await courierOrderResponse.json();
          console.log(`✅ Courier order auto-created for landing page order:`, courierOrderData);
        } else {
          console.error(`❌ Failed to auto-create courier order for landing page order: ${courierOrderResponse.status}`);
        }
      } catch (courierErr) {
        console.error('⚠️ Failed to auto-create courier order for landing page order:', courierErr);
        // Non-blocking failure; order status update already succeeded
      }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating landing page order status:', error);
    return NextResponse.json(
      { error: 'Failed to update landing page order status' },
      { status: 500 }
    );
  }
}
