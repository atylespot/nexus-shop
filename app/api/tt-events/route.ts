import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { event, event_id, timestamp, context, properties } = await req.json();
  
  const url = "https://business-api.tiktok.com/open_api/v1.3/pixel/track/";
  
  const r = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "Access-Token": process.env.TT_ACCESS_TOKEN! 
    },
    body: JSON.stringify({
      pixel_code: process.env.TT_PIXEL_ID!,
      event, 
      event_id,
      timestamp: timestamp ?? Math.floor(Date.now() / 1000),
      context, 
      properties
    })
  });
  
  const json = await r.json();
  return NextResponse.json(json, { status: r.status });
}
