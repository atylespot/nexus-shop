import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/customer-journey/status { id, status }
export async function POST(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const allowed = ['view', 'checkout_form', 'checkout_filled'];
    if (!allowed.includes(String(status))) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const updated = await db.customerJourneyEvent.update({ where: { id: Number(id) }, data: { status: String(status) } });
    return NextResponse.json({ ok: true, id: updated.id, status: updated.status });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}



