import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const threshold = Number(searchParams.get('threshold') || 10);
    const limit = Number(searchParams.get('limit') || 5);

    const products = await db.product.findMany({
      include: { inventory: true },
    });

    const lows = products
      .map(p => ({
        id: p.id,
        name: p.name,
        currentStock: p.inventory?.quantity ?? 0,
        minStock: p.inventory?.lowStockThreshold ?? threshold,
        price: p.regularPrice || 0
      }))
      .filter(p => p.currentStock <= p.minStock && p.currentStock > 0)
      .slice(0, limit);

    return NextResponse.json(lows);
  } catch (e) {
    console.error('Low stock error:', e);
    return NextResponse.json([], { status: 200 });
  }
}


