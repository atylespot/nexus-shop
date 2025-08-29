import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const rows = await db.otherExpense.findMany({ orderBy: { date: 'desc' } });
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load expenses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, amount, currency, date, note, createdBy } = body;
    if (!title || amount === undefined || !createdBy) {
      return NextResponse.json({ error: 'title, amount and createdBy required' }, { status: 400 });
    }
    const row = await db.otherExpense.create({
      data: {
        title,
        category: category || null,
        amount: parseFloat(amount),
        currency: currency || 'BDT',
        date: date ? new Date(date) : new Date(),
        note: note || null,
        createdBy,
        status: 'PENDING'
      }
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}


