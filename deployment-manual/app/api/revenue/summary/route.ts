import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date): Date { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function startOfWeek(d: Date): Date { const x = startOfDay(d); const day = x.getDay(); const diff = (day === 0 ? 6 : day - 1); x.setDate(x.getDate()-diff); return x; }
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1, 0,0,0,0); }

export async function GET() {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    // Helper to sum totals for website orders only (landing revenue is tracked separately in this app)
    const sumInRange = async (from?: Date, to?: Date) => {
      const where: any = {};
      if (from && to) where.createdAt = { gte: from, lte: to };
      const orders = await db.order.findMany({ where, select: { total: true } });
      return orders.reduce((sum, o) => sum + (o.total || 0), 0);
    };

    const [today, thisWeek, thisMonth, total] = await Promise.all([
      sumInRange(todayStart, todayEnd),
      sumInRange(weekStart, todayEnd),
      sumInRange(monthStart, todayEnd),
      sumInRange()
    ]);

    return NextResponse.json({ today, thisWeek, thisMonth, total });
  } catch (e) {
    console.error('Revenue summary error:', e);
    return NextResponse.json({ error: 'Failed to load revenue summary' }, { status: 500 });
  }
}


