import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const record = await db.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await db.appUser.update({ where: { id: record.userId }, data: { passwordHash } });
    await db.passwordResetToken.delete({ where: { token } }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


