import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { status, title, category, amount, currency, date, note, createdBy } = body;
    const updated = await db.otherExpense.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(status && { status }),
        ...(title && { title }),
        ...(category !== undefined && { category }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(currency && { currency }),
        ...(date && { date: new Date(date) }),
        ...(note !== undefined && { note }),
        ...(createdBy && { createdBy }),
        approvedAt: status === 'APPROVED' ? new Date() : undefined
      }
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await db.otherExpense.delete({ where: { id: parseInt(id, 10) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}


