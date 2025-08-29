import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const rows = await db.productPurchase.findMany({
      include: {
        product: { include: { images: true, category: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load purchases' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, quantity } = body;
    if (!productId || !quantity) {
      return NextResponse.json({ error: 'productId and quantity required' }, { status: 400 });
    }
    const product = await db.product.findUnique({ where: { id: parseInt(productId) } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const row = await db.productPurchase.create({
      data: {
        productId: product.id,
        quantity: parseInt(quantity),
        unitPrice: product.buyPrice,
        currency: product.currency,
        status: 'PENDING'
      }
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
  }
}

