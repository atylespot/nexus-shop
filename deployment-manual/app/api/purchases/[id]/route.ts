import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, quantity, note } = body;

    const purchase = await db.productPurchase.findUnique({ 
      where: { id: parseInt(id) },
      include: { product: true }
    });
    if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });

    console.log('Current purchase status:', purchase.status, 'New status:', status);

    // On approve, increase inventory
    if (status === 'APPROVED' && purchase.status !== 'APPROVED') {
      console.log('Approving purchase:', purchase.id, 'for product:', purchase.productId, 'quantity:', purchase.quantity);
      
      try {
        await db.inventory.upsert({
          where: { productId: purchase.productId },
          update: { quantity: { increment: purchase.quantity } },
          create: { 
            productId: purchase.productId, 
            quantity: purchase.quantity, 
            lowStockThreshold: 10 
          }
        });
        console.log('Inventory updated successfully');
      } catch (error) {
        console.error('Error updating inventory:', error);
        throw error;
      }
    }

    // On reject from approved, optionally decrement (not required now)

    const updated = await db.productPurchase.update({
      where: { id: purchase.id },
      data: {
        status: status || purchase.status,
        quantity: quantity !== undefined ? parseInt(quantity) : purchase.quantity,
        note: note !== undefined ? note : purchase.note,
        approvedAt: status === 'APPROVED' ? new Date() : purchase.approvedAt
      }
    });

    console.log('Purchase updated successfully:', updated.id, 'Status:', updated.status);
    
    return NextResponse.json({
      success: true,
      message: `Purchase ${status === 'APPROVED' ? 'approved' : 'updated'} successfully`,
      purchase: updated
    });
  } catch (e) {
    console.error('Error in PATCH /api/purchases/[id]:', e);
    return NextResponse.json({ 
      error: 'Failed to update purchase', 
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.productPurchase.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete purchase' }, { status: 500 });
  }
}


