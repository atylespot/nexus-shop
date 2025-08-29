import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get('days') || 30);
    const limit = Number(searchParams.get('limit') || 5);
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Load delivered order items within window
    const items = await db.orderItem.findMany({
      where: {
        order: {
          status: 'delivered',
          createdAt: { gte: since }
        }
      },
      include: {
        product: {
          include: { inventory: true, images: true }
        }
      }
    });

    // Aggregate by product
    const map = new Map<number, { id: number; name: string; soldCount: number; revenue: number }>();
    for (const it of items) {
      const pid = it.productId;
      const name = it.product?.name || `#${pid}`;
      const prev = map.get(pid) || { id: pid, name, soldCount: 0, revenue: 0 };
      prev.soldCount += it.quantity || 0;
      prev.revenue += (it.quantity || 0) * (it.price || 0);
      map.set(pid, prev);
    }

    const list = Array.from(map.values()).sort((a, b) => b.soldCount - a.soldCount).slice(0, limit);

    return NextResponse.json(list);
  } catch (e) {
    console.error('Top selling products error:', e);
    return NextResponse.json([], { status: 200 });
  }
}


