import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const prods = await db.product.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
    return NextResponse.json(prods);
  } catch (e) {
    console.error('Products GET error', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}



