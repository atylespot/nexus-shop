import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const setting = await db.pixelSetting.findFirst();
    return NextResponse.json(setting || {});
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load pixel settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fbPixelId, fbAccessToken, fbTestEventCode, ttPixelId, ttAccessToken, enableAdvancedTracking } = body;
    const existing = await db.pixelSetting.findFirst();
    const data = {
      fbPixelId: fbPixelId || null,
      fbAccessToken: fbAccessToken || null,
      fbTestEventCode: fbTestEventCode || null,
      ttPixelId: ttPixelId || null,
      ttAccessToken: ttAccessToken || null,
      enabled: enableAdvancedTracking || false,
    };
    const saved = existing
      ? await db.pixelSetting.update({ where: { id: existing.id }, data })
      : await db.pixelSetting.create({ data });
    return NextResponse.json(saved);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save pixel settings' }, { status: 500 });
  }
}


