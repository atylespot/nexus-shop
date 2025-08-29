import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

const sha256 = (s: string) => crypto.createHash("sha256").update(s, "utf8").digest("hex");

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { event_name, event_id, event_time, user_data, custom_data, pixelId: bodyPixelId, accessToken: bodyAccessToken, test_event_code: bodyTestCode } = body ?? {};

  try {
    const setting = await db.pixelSetting.findFirst();

    const pixelId = bodyPixelId || process.env.FB_PIXEL_ID || setting?.fbPixelId;
    const accessToken = bodyAccessToken || process.env.FB_ACCESS_TOKEN || setting?.fbAccessToken;
    const testCode = bodyTestCode || process.env.FB_TEST_EVENT_CODE || setting?.fbTestEventCode;

    if (!pixelId || !accessToken) {
      return NextResponse.json({ error: "Missing Pixel ID or Access Token" }, { status: 400 });
    }

    const url = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`;

    const clientIp = (req.headers.get('x-forwarded-for') || '').split(',')[0] || (user_data?.ip) || '127.0.0.1';
    const clientUa = user_data?.ua || req.headers.get('user-agent') || 'Mozilla/5.0';

    const payload: any = {
      data: [{
        event_name,
        event_time: event_time ?? Math.floor(Date.now() / 1000),
        event_id,
        user_data: {
          em: user_data?.email ? [sha256(user_data.email.trim().toLowerCase())] : undefined,
          ph: user_data?.phone ? [sha256(user_data.phone)] : undefined,
          client_ip_address: clientIp,
          client_user_agent: clientUa,
          fbp: user_data?.fbp,
          fbc: user_data?.fbc
        },
        custom_data: {
          ...custom_data,
          // Ensure required fields for better event match quality
          content_type: custom_data?.content_type || 'product',
          num_items: custom_data?.num_items || 1,
          event_source_url: custom_data?.event_source_url || 'http://localhost:3000'
        },
        action_source: "website"
      }]
    };
    if (testCode) payload.test_event_code = testCode;

    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await r.json();
    return NextResponse.json(json, { status: r.status });
  } catch (e) {
    return NextResponse.json({ error: "Failed to send event", details: String(e) }, { status: 500 });
  }
}
