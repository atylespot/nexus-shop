import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const id = cookieStore.get('customer_id')?.value;
    if (!id) return NextResponse.json({ loggedIn: false });
    const customer = await db.customer.findUnique({ where: { id: Number(id) } });
    if (!customer) return NextResponse.json({ loggedIn: false });
    return NextResponse.json({ loggedIn: true, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, avatarUrl: customer.avatarUrl } });
  } catch (e: any) {
    return NextResponse.json({ loggedIn: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}



