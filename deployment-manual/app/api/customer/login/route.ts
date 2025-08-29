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
  p = '0' + p;
  if (!/^01[3-9]\d{8}$/.test(p)) return null;
  return p;
}

export async function POST(req: NextRequest) {
  try {
    const { email, phone, password } = await req.json();
    if ((!email && !phone) || !password) {
      return NextResponse.json({ error: 'Email/phone এবং password দিন' }, { status: 400 });
    }

    const e = normalizeEmail(email);
    const p = normalizeBDPhone(phone);

    const customer = await db.customer.findFirst({ where: { OR: [{ email: e || '' }, { phone: p || '' }] } });
    if (!customer || !customer.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, customer.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const res = NextResponse.json({ ok: true, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
    res.cookies.set('customer_id', String(customer.id), { httpOnly: false, path: '/', sameSite: 'lax' });
    res.cookies.set('customer_name', encodeURIComponent(customer.name), { httpOnly: false, path: '/', sameSite: 'lax' });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Login failed' }, { status: 500 });
  }
}



