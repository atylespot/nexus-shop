import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date): Date { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function startOfWeek(d: Date): Date {
	const x = startOfDay(d);
	const day = x.getDay(); // 0=Sun, 1=Mon
	const diff = (day === 0 ? 6 : day - 1); // make Monday start
	x.setDate(x.getDate() - diff);
	return x;
}
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0); }

export async function GET(req: NextRequest) {
	try {
		const url = new URL(req.url);
		const status = (url.searchParams.get('status') || 'pending').toLowerCase();
		const fromStr = url.searchParams.get('from') || '';
		const toStr = url.searchParams.get('to') || '';
		const onlyJourney = (url.searchParams.get('onlyJourney') || 'true') === 'true';

		const now = new Date();
		const todayStart = startOfDay(now);
		const todayEnd = endOfDay(now);
		const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(todayStart.getDate() - 1);
		const yesterdayEnd = endOfDay(new Date(yesterdayStart));
		const weekStart = startOfWeek(now);
		const monthStart = startOfMonth(now);

		// Helper to count orders by range with optional journey-origin filter
		const countInRange = async (from?: Date, to?: Date) => {
			const where: any = { status: status };
			if (from && to) where.createdAt = { gte: from, lte: to };
			if (!from && to) where.createdAt = { lte: to };
			if (from && !to) where.createdAt = { gte: from };
			if (onlyJourney) {
				// Find orderIds that originated from journey conversion
				const evtOrderIds = await db.customerJourneyEvent.findMany({
					where: { orderId: { not: null } },
					select: { orderId: true }
				});
				const ids = Array.from(new Set(evtOrderIds.map(e => e.orderId!).filter(Boolean)));
				if (ids.length === 0) return 0;
				where.id = { in: ids };
			}
			return db.order.count({ where });
		};

		const [today, yesterday, thisWeek, thisMonth, total] = await Promise.all([
			countInRange(todayStart, todayEnd),
			countInRange(yesterdayStart, yesterdayEnd),
			countInRange(weekStart, todayEnd),
			countInRange(monthStart, todayEnd),
			countInRange()
		]);

		let rangeCount: number | null = null;
		let byDay: Array<{ date: string; count: number }> = [];
		if (fromStr && toStr) {
			const from = startOfDay(new Date(fromStr));
			const to = endOfDay(new Date(toStr));
			rangeCount = await countInRange(from, to);
			// Build per-day counts in the range (simple loop; fine for short admin ranges)
			const cursor = new Date(from);
			while (cursor <= to) {
				const dayStart = startOfDay(new Date(cursor));
				const dayEnd = endOfDay(new Date(cursor));
				// eslint-disable-next-line no-await-in-loop
				const c = await countInRange(dayStart, dayEnd);
				byDay.push({ date: dayStart.toISOString().slice(0,10), count: c });
				cursor.setDate(cursor.getDate() + 1);
			}
		}

		return NextResponse.json({ today, yesterday, thisWeek, thisMonth, total, rangeCount, byDay });
	} catch (e) {
		console.error('Orders stats error:', e);
		return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
	}
}



