import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      db.manualCourierPayment.findMany({
        orderBy: { date: 'desc' },
        skip,
        take: pageSize
      }),
      db.manualCourierPayment.count()
    ]);

    return NextResponse.json({
      data: items,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch manual payments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, amount, deliveryCharge, codCharge, adjustment, statementNo, note } = body || {};

    if (amount == null || isNaN(Number(amount))) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const created = await db.manualCourierPayment.create({
      data: {
        date: date ? new Date(date) : new Date(),
        amount: Number(amount),
        deliveryCharge: deliveryCharge != null ? Number(deliveryCharge) : null,
        codCharge: codCharge != null ? Number(codCharge) : null,
        adjustment: adjustment != null ? Number(adjustment) : null,
        statementNo: statementNo || null,
        note: note || null
      }
    });

    return NextResponse.json({ data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create manual payment' }, { status: 500 });
  }
}


