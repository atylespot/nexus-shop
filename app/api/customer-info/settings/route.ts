import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let s = await db.customerInfoSetting.findUnique({ where: { id: 1 } });
    if (!s) {
      s = await db.customerInfoSetting.create({ data: { id: 1 } });
    }
    return NextResponse.json(s);
  } catch (e) {
    console.error('Settings GET error', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await db.customerInfoSetting.upsert({
      where: { id: 1 },
      update: {
        retentionDays: typeof body.retentionDays === 'number' ? Math.max(0, Math.min(365, body.retentionDays)) : undefined,
        offerEnabled: typeof body.offerEnabled === 'boolean' ? body.offerEnabled : undefined,
        offerDelaySeconds: typeof body.offerDelaySeconds === 'number' ? Math.max(0, Math.min(3600, body.offerDelaySeconds)) : undefined,
        offerTitle: body.offerTitle ?? undefined,
        offerMessage: body.offerMessage ?? undefined,
        offerCtaText: body.offerCtaText ?? undefined
      },
      create: {
        id: 1,
        retentionDays: typeof body.retentionDays === 'number' ? Math.max(0, Math.min(365, body.retentionDays)) : 30,
        offerEnabled: typeof body.offerEnabled === 'boolean' ? body.offerEnabled : false,
        offerDelaySeconds: typeof body.offerDelaySeconds === 'number' ? Math.max(0, Math.min(3600, body.offerDelaySeconds)) : 10,
        offerTitle: body.offerTitle ?? null,
        offerMessage: body.offerMessage ?? null,
        offerCtaText: body.offerCtaText ?? null
      }
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Settings PUT error', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}



