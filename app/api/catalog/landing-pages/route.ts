import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const lps = await db.landingPage.findMany({ select: { id: true, slug: true, title: true }, orderBy: { updatedAt: 'desc' } });
    return NextResponse.json(lps);
  } catch (e) {
    console.error('Landing pages GET error', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}



