import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function generateOrderNo(): string {
  return `ORD-${Date.now()}-${Math.floor(Math.random()*1000)}`;
}

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const evt = await db.customerJourneyEvent.findUnique({ where: { id: Number(id) } });
    if (!evt) return NextResponse.json({ error: 'Journey not found' }, { status: 404 });

    // Optional product
    let price = 0;
    let productId: number | null = evt.productId ?? null;
    if (productId) {
      const product = await db.product.findUnique({ where: { id: productId }, include: { images: true } });
      if (product) {
        price = (product.salePrice ?? product.regularPrice ?? 0);
      } else {
        productId = null;
      }
    }

    const order = await db.order.create({
      data: {
        orderNo: generateOrderNo(),
        customerName: evt.fullName || evt.customerName || null,
        phone: evt.phone || null,
        address: evt.address || null,
        district: evt.district || null,
        status: 'pending',
        paymentStatus: 'UNPAID',
        subtotal: price,
        total: price,
        currency: 'BDT'
      }
    });

    if (productId) {
      await db.orderItem.create({
        data: {
          orderId: order.id,
          productId: productId,
          quantity: 1,
          price: price
        }
      });
    }

    await db.customerJourneyEvent.update({ where: { id: evt.id }, data: { status: 'order_placed', orderId: order.id } });

    return NextResponse.json({ ok: true, orderId: order.id, orderNo: order.orderNo });
  } catch (e) {
    console.error('Convert journey error:', e);
    return NextResponse.json({ error: 'Failed to convert' }, { status: 500 });
  }
}


