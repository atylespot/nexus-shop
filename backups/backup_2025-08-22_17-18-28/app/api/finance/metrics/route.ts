import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type MetricSet = {
  totalAmount: number;
  totalCount: number;
  categoryBreakdown: Record<string, { amount: number; count: number }>;
  timeMetrics: {
    today: number;
    yesterday: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
  };
};

function computeTimeMetrics<T>(items: T[], getDate: (i: T) => Date, getAmount: (i: T) => number) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const thisWeekStart = new Date(today);
  thisWeekStart.setHours(0, 0, 0, 0);
  thisWeekStart.setDate(today.getDate() - today.getDay());

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const thisYearStart = new Date(today.getFullYear(), 0, 1);

  const sum = (arr: T[]) => arr.reduce((s, it) => s + getAmount(it), 0);

  const todayItems = items.filter(i => getDate(i).toDateString() === today.toDateString());
  const yesterdayItems = items.filter(i => getDate(i).toDateString() === yesterday.toDateString());
  const thisWeekItems = items.filter(i => getDate(i) >= thisWeekStart);
  const thisMonthItems = items.filter(i => getDate(i) >= thisMonthStart);
  const lastMonthItems = items.filter(i => getDate(i) >= lastMonthStart && getDate(i) <= lastMonthEnd);
  const thisYearItems = items.filter(i => getDate(i) >= thisYearStart);

  return {
    today: sum(todayItems),
    yesterday: sum(yesterdayItems),
    thisWeek: sum(thisWeekItems),
    thisMonth: sum(thisMonthItems),
    lastMonth: sum(lastMonthItems),
    thisYear: sum(thisYearItems),
  } as MetricSet["timeMetrics"];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Other expenses (approved only)
    const opex = await db.otherExpense.findMany({
      where: {
        date: { gte: start, lte: end },
        status: 'APPROVED'
      },
      select: { amount: true, currency: true, category: true, date: true }
    });

    const opexTotal = opex.reduce((sum, e) => sum + e.amount, 0);
    const opexCategory = opex.reduce((acc, e) => {
      const key = e.category || 'Uncategorized';
      if (!acc[key]) acc[key] = { amount: 0, count: 0 };
      acc[key].amount += e.amount;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);
    const opexTime = computeTimeMetrics(opex, e => e.date, e => e.amount);

    const otherExpenses: MetricSet = {
      totalAmount: opexTotal,
      totalCount: opex.length,
      categoryBreakdown: opexCategory,
      timeMetrics: opexTime
    };

    // Product purchases (approved only), amount = quantity * unitPrice
    const purchases = await db.productPurchase.findMany({
      where: { approvedAt: { gte: start, lte: end }, status: 'APPROVED' },
      include: { product: { include: { category: true } } }
    });

    const purchaseAmount = (p: typeof purchases[number]) => p.quantity * p.unitPrice;
    const purchaseDate = (p: typeof purchases[number]) => p.approvedAt ?? p.createdAt;

    const purchaseTotal = purchases.reduce((sum, p) => sum + purchaseAmount(p), 0);
    const purchaseCategory = purchases.reduce((acc, p) => {
      const key = p.product?.category?.name || 'Uncategorized';
      if (!acc[key]) acc[key] = { amount: 0, count: 0 };
      acc[key].amount += purchaseAmount(p);
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);
    const purchaseTime = computeTimeMetrics(purchases, purchaseDate, purchaseAmount);

    const productPurchases: MetricSet = {
      totalAmount: purchaseTotal,
      totalCount: purchases.length,
      categoryBreakdown: purchaseCategory,
      timeMetrics: purchaseTime
    };

    // Combined view for backward compatibility with UI
    const mergeCategory = (a: Record<string, { amount: number; count: number }>, b: Record<string, { amount: number; count: number }>) => {
      const out: Record<string, { amount: number; count: number }> = { ...a };
      for (const [k, v] of Object.entries(b)) {
        if (!out[k]) out[k] = { amount: 0, count: 0 };
        out[k].amount += v.amount;
        out[k].count += v.count;
      }
      return out;
    };

    const combined: MetricSet = {
      totalAmount: otherExpenses.totalAmount + productPurchases.totalAmount,
      totalCount: otherExpenses.totalCount + productPurchases.totalCount,
      categoryBreakdown: mergeCategory(otherExpenses.categoryBreakdown, productPurchases.categoryBreakdown),
      timeMetrics: {
        today: otherExpenses.timeMetrics.today + productPurchases.timeMetrics.today,
        yesterday: otherExpenses.timeMetrics.yesterday + productPurchases.timeMetrics.yesterday,
        thisWeek: otherExpenses.timeMetrics.thisWeek + productPurchases.timeMetrics.thisWeek,
        thisMonth: otherExpenses.timeMetrics.thisMonth + productPurchases.timeMetrics.thisMonth,
        lastMonth: otherExpenses.timeMetrics.lastMonth + productPurchases.timeMetrics.lastMonth,
        thisYear: otherExpenses.timeMetrics.thisYear + productPurchases.timeMetrics.thisYear,
      }
    };

    return NextResponse.json({
      ...combined,
      details: {
        otherExpenses,
        productPurchases
      },
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching finance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finance metrics' },
      { status: 500 }
    );
  }
}
