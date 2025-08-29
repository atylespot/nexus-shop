import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type SSLSettings = {
  enabled?: boolean;
  storeId?: string;
  storePass?: string;
  sandbox?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body || {};
    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const settings = await db.siteSetting.findFirst();
    const ssl: SSLSettings | undefined = (settings as any)?.payment?.online?.ssl;
    if (!ssl?.enabled) {
      return NextResponse.json({ error: "SSLCommerz not enabled" }, { status: 400 });
    }
    if (!ssl.storeId || !ssl.storePass) {
      return NextResponse.json({ error: "SSLCommerz credentials missing" }, { status: 400 });
    }

    const order = await db.order.findUnique({ where: { id: Number(orderId) } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const success_url = `${baseUrl}/api/payment/ssl/success?orderId=${order.id}`;
    const fail_url = `${baseUrl}/api/payment/ssl/fail?orderId=${order.id}`;
    const cancel_url = `${baseUrl}/api/payment/ssl/cancel?orderId=${order.id}`;
    const ipn_url = `${baseUrl}/api/payment/ssl/ipn`;

    const endpoint = ssl.sandbox
      ? "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
      : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

    const payload: Record<string, any> = {
      store_id: ssl.storeId,
      store_passwd: ssl.storePass,
      total_amount: order.total ?? 0,
      currency: order.currency || "BDT",
      tran_id: `ORD${order.id}_${Date.now()}`,
      success_url,
      fail_url,
      cancel_url,
      ipn_url,
      cus_name: order.customerName || "Customer",
      cus_email: "no-reply@nexus-shop.com",
      cus_add1: order.address || "",
      cus_city: order.district || "",
      cus_country: "Bangladesh",
      cus_phone: order.phone || "",
      shipping_method: "NO",
      product_name: "Cart Items",
      product_category: "ecommerce",
      product_profile: "general"
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(payload as any).toString()
    });

    const data = await res.json().catch(async () => ({ GatewayPageURL: await res.text() }));
    const url: string | undefined = data?.GatewayPageURL || data?.redirectGatewayURL || data?.url;
    if (!res.ok || !url) {
      return NextResponse.json({ error: "Failed to create SSL session", details: data }, { status: 500 });
    }

    // Optionally mark order paymentStatus as PENDING
    try {
      await db.order.update({ where: { id: order.id }, data: { paymentStatus: "PENDING" as any } });
    } catch {}

    return NextResponse.json({ url });
  } catch (e) {
    console.error("SSL initiate error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}


