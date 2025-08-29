import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = Number(searchParams.get("orderId"));
    if (orderId) {
      try { await db.order.update({ where: { id: orderId }, data: { paymentStatus: "FAILED" as any } }); } catch {}
    }
    return NextResponse.redirect(new URL(`/checkout/form?payment=failed`, req.url));
  } catch {
    return NextResponse.redirect(new URL("/checkout/form?payment=error", req.url));
  }
}


