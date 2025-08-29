import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = Number(searchParams.get("orderId"));
    if (!orderId) return NextResponse.redirect(new URL("/checkout/form?payment=invalid", req.url));

    try {
      await db.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID" as any, status: "processing" as any } });
    } catch {}

    return NextResponse.redirect(new URL(`/thank-you?orderId=${orderId}&status=paid`, req.url));
  } catch (e) {
    return NextResponse.redirect(new URL("/checkout/form?payment=error", req.url));
  }
}


