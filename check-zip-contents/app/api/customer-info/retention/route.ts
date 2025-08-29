import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Try via Prisma Client model (if generated)
    // @ts-ignore
    if (db.journeyRetentionSetting?.findUnique) {
      // @ts-ignore
      let r = await db.journeyRetentionSetting.findUnique({ where: { id: 1 } });
      // @ts-ignore
      if (!r) r = await db.journeyRetentionSetting.create({ data: { id: 1 } });
      return NextResponse.json(r);
    }
  } catch {}
  try {
    // Fallback via raw SQL (works even if client not regenerated)
    const rows: any[] = await db.$queryRaw`SELECT id, retentionDays FROM JourneyRetentionSetting WHERE id = 1`;
    if (rows && rows.length > 0) return NextResponse.json(rows[0]);
    await db.$executeRaw`INSERT INTO JourneyRetentionSetting (id, retentionDays, createdAt, updatedAt) VALUES (1, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
    return NextResponse.json({ id: 1, retentionDays: 30 });
  } catch (e) {
    console.error('Retention GET error', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const days = Math.max(0, Math.min(365, Number(body.retentionDays ?? 30)));
    // Try via Prisma Client model (if generated)
    // @ts-ignore
    if (db.journeyRetentionSetting?.upsert) {
      // @ts-ignore
      const r = await db.journeyRetentionSetting.upsert({ where: { id: 1 }, update: { retentionDays: days }, create: { id: 1, retentionDays: days } });
      return NextResponse.json(r);
    }
  } catch {}
  try {
    await db.$executeRaw`INSERT INTO JourneyRetentionSetting (id, retentionDays, createdAt, updatedAt) VALUES (1, ${Number.NaN}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
  } catch {}
  try {
    await db.$executeRaw`INSERT INTO JourneyRetentionSetting (id, retentionDays, createdAt, updatedAt) VALUES (1, ${0}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET retentionDays = ${Number(0)}`;
  } catch {}
  try {
    // Proper upsert
    await db.$executeRaw`INSERT INTO JourneyRetentionSetting (id, retentionDays, createdAt, updatedAt) VALUES (1, ${days}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET retentionDays = ${days}, updatedAt = CURRENT_TIMESTAMP`;
    return NextResponse.json({ id: 1, retentionDays: days });
  } catch (e) {
    console.error('Retention PUT error', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}


