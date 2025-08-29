import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function toMonthName(date: Date): string {
  return date.toLocaleString('default', { month: 'long' });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');
    const includePending = searchParams.get('includePending') === 'true';

    // Default window: current month
    const now = new Date();
    const start = startParam ? new Date(startParam) : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = endParam ? new Date(endParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Load website orders within range
    const orderWhere: any = { createdAt: { gte: start, lte: end } };
    if (!includePending) {
      // Focus on realized revenue by default
      orderWhere.status = { in: ['delivered'] };
    }

    const orders = await db.order.findMany({
      where: orderWhere,
      include: {
        items: {
          include: {
            product: { select: { buyPrice: true } }
          }
        }
      }
    });

    const orderIds = orders.map(o => o.id);

    // Revenue
    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    // COGS from product buyPrice × quantity
    const cogs = orders.reduce((sum, o) => {
      const line = (o.items || []).reduce((s, it) => s + (it.quantity || 0) * (it.product?.buyPrice || 0), 0);
      return sum + line;
    }, 0);

    // Courier delivery costs (actual charge recorded)
    let deliveryCost = 0;
    if (orderIds.length > 0) {
      const courier = await db.courierOrder.findMany({
        where: { orderId: { in: orderIds } },
        select: { deliveryCharge: true }
      });
      deliveryCost = courier.reduce((sum, r) => sum + (r.deliveryCharge || 0), 0);
    }

    // Approved other expenses in range
    const otherExpensesRows = await db.otherExpense.findMany({
      where: { date: { gte: start, lte: end }, status: 'APPROVED' },
      select: { amount: true }
    });
    const otherExpenses = otherExpensesRows.reduce((s, r) => s + (r.amount || 0), 0);

    // Returns & damaged (from monthly AdProductEntry)
    const monthName = toMonthName(start);
    const monthYear = start.getFullYear();
    const adEntries = await db.adProductEntry.findMany({
      where: { month: monthName, year: monthYear },
      select: { returnCost: true, damagedCost: true }
    });
    const returnsDamages = adEntries.reduce((s, e) => s + (e.returnCost || 0) + (e.damagedCost || 0), 0);

    const grossProfit = revenue - cogs;
    const netProfit = revenue - (cogs + deliveryCost + otherExpenses + returnsDamages);

    return NextResponse.json({
      period: { start: start.toISOString(), end: end.toISOString() },
      revenue,
      cogs,
      deliveryCost,
      otherExpenses,
      returnsDamages,
      grossProfit,
      netProfit
    });
  } catch (e) {
    console.error('Profit summary error:', e);
    return NextResponse.json({ error: 'Failed to compute profit summary' }, { status: 500 });
  }
}


