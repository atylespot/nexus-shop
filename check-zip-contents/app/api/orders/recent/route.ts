import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || 5);

    const orders = await db.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const data = orders.map(o => ({
      id: o.id,
      customerName: o.customerName || 'Unknown',
      amount: o.total || 0,
      status: o.status,
      date: o.createdAt
    }));

    return NextResponse.json(data);
  } catch (e) {
    console.error('Recent orders error:', e);
    return NextResponse.json([], { status: 200 });
  }
}


