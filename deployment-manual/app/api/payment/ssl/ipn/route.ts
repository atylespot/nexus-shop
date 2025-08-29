import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData().catch(async () => null);
    const data = form ? Object.fromEntries(form.entries()) : await req.json().catch(() => ({}));
    const status = String((data as any).status || '').toUpperCase();
    const valId = (data as any).val_id || null;
    const tranId = (data as any).tran_id || '';
    const orderId = Number(String(tranId).split('ORD')[1]?.split('_')[0]) || null;
    if (!orderId) return NextResponse.json({ ok: true });

    if (status === 'VALID' || status === 'PAID') {
      try { await db.order.update({ where: { id: orderId }, data: { paymentStatus: 'PAID' as any } }); } catch {}
    }
    return NextResponse.json({ ok: true, orderId, status, valId });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}


