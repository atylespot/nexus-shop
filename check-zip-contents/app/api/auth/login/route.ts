import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { slug, userId, password } = await req.json();
    
    // Support both slug-based and userId-based login
    if ((!slug && !userId) || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    let user;
    if (userId) {
      // Direct userId login (prioritize this)
      console.log('🔍 Looking for user with userId:', userId);
      user = await db.appUser.findFirst({ where: { userId: String(userId) } });
      console.log('👤 Found user:', user ? { id: user.id, name: user.name, userId: user.userId } : null);
    } else if (slug) {
      // Fallback to slug-based login
      console.log('🔍 Looking for user with slug:', slug);
      user = await db.appUser.findFirst({ where: { loginSlug: slug } });
      console.log('👤 Found user:', user ? { id: user.id, name: user.name, loginSlug: user.loginSlug } : null);
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    if (!user || !user.passwordHash) {
      console.log('❌ User not found or no password hash');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    console.log('🔐 Comparing password...');
    const ok = await bcrypt.compare(password, user.passwordHash);
    console.log('🔐 Password match result:', ok);
    
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name } });
    // httpOnly cookie for server checks + readable cookie for client UI
    res.cookies.set('session_user', String(user.id), { httpOnly: false, path: '/', sameSite: 'lax' });
    res.cookies.set('session_user_name', encodeURIComponent(user.name), { httpOnly: false, path: '/', sameSite: 'lax' });
    // Log login activity (non-blocking)
    try {
      await db.adminActivityLog.create({
        data: {
          actorId: user.id,
          action: 'login',
          targetType: null,
          targetId: null,
          meta: { slug: slug || null, userId: user.userId || null }
        }
      });
    } catch (logErr) {
      console.warn('Activity log failed (login):', logErr);
    }
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


