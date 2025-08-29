import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [total, inStock, lowStock, outOfStock] = await Promise.all([
      db.product.count(),
      db.inventory.count({ where: { quantity: { gt: 10 } } }),
      db.inventory.count({ where: { quantity: { lte: 10, gt: 0 } } }),
      db.inventory.count({ where: { quantity: 0 } })
    ]);

    return NextResponse.json({ total, inStock, lowStock, outOfStock });
  } catch (e) {
    console.error('Product stats error:', e);
    return NextResponse.json({ error: 'Failed to load product stats' }, { status: 500 });
  }
}


