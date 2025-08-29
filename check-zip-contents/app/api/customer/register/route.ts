import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

function normalizeEmail(email?: string): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

function normalizeBDPhone(phone?: string): string | null {
  if (!phone) return null;
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('880')) p = p.slice(3);
  if (p.startsWith('0')) p = p.slice(1);
  // Ensure leading 0
  p = '0' + p;
  if (!/^01[3-9]\d{8}$/.test(p)) return null;
  return p;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name || '').trim();
    const email = normalizeEmail(body?.email || '');
    const phone = normalizeBDPhone(body?.phone || '');
    const password = String(body?.password || '');

    if (!name || (!email && !phone) || !password) {
      return NextResponse.json({ error: 'Name, password এবং email/phone দিন' }, { status: 400 });
    }

    // Uniqueness checks
    if (email) {
      const existingByEmail = await db.customer.findUnique({ where: { email } });
      if (existingByEmail) return NextResponse.json({ error: 'এই ইমেইলটি আগে ব্যবহার করা হয়েছে' }, { status: 409 });
    }
    if (phone) {
      const existingByPhone = await db.customer.findUnique({ where: { phone } });
      if (existingByPhone) return NextResponse.json({ error: 'এই ফোন নম্বরটি আগে ব্যবহার করা হয়েছে' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const customer = await db.customer.create({
      data: {
        name,
        email: email || `${Date.now()}@temp.local`,
        phone: phone || null,
        passwordHash,
      },
    });

    const res = NextResponse.json({ ok: true, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
    // Set customer session cookies (readable on client for UI)
    res.cookies.set('customer_id', String(customer.id), { httpOnly: false, path: '/', sameSite: 'lax' });
    res.cookies.set('customer_name', encodeURIComponent(customer.name), { httpOnly: false, path: '/', sameSite: 'lax' });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Registration failed' }, { status: 500 });
  }
}


