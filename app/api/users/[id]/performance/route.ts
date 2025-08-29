import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date): Date { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function startOfWeek(d: Date): Date { const x = new Date(d); const day = x.getDay(); x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x; }
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0); }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = Number(id);
    if (!userId) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });

    const url = new URL(req.url);
    const fromStr = url.searchParams.get('from') || '';
    const toStr = url.searchParams.get('to') || '';
    const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 200);

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    // Aggregate activity counts by action
    const [todayActs, weekActs, monthActs, totalActs] = await Promise.all([
      db.adminActivityLog.count({ where: { actorId: userId, createdAt: { gte: todayStart, lte: todayEnd } } }),
      db.adminActivityLog.count({ where: { actorId: userId, createdAt: { gte: weekStart, lte: todayEnd } } }),
      db.adminActivityLog.count({ where: { actorId: userId, createdAt: { gte: monthStart, lte: todayEnd } } }),
      db.adminActivityLog.count({ where: { actorId: userId } }),
    ]);

    const byAction = await db.adminActivityLog.groupBy({
      by: ['action'],
      where: {
        actorId: userId,
        ...(fromStr && toStr ? { createdAt: { gte: new Date(fromStr), lte: endOfDay(new Date(toStr)) } } : {})
      },
      _count: { action: true }
    }).catch(() => [] as any[]);

    // Status change breakdown (for order updates)
    const statusChanges = await db.adminActivityLog.findMany({
      where: { actorId: userId, action: 'update_order_status' },
      select: { meta: true }
    });
    const statusBreakdown: Record<string, number> = {};
    for (const row of statusChanges) {
      const to = (row as any)?.meta?.newStatus || 'unknown';
      statusBreakdown[to] = (statusBreakdown[to] || 0) + 1;
    }

    // Recent 20 activities
    const recent = await db.adminActivityLog.findMany({
      where: {
        actorId: userId,
        ...(fromStr && toStr ? { createdAt: { gte: new Date(fromStr), lte: endOfDay(new Date(toStr)) } } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({
      counts: {
        today: todayActs,
        thisWeek: weekActs,
        thisMonth: monthActs,
        total: totalActs
      },
      byAction,
      statusBreakdown,
      recent
    });
  } catch (e: any) {
    console.error('User performance error:', e);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}


