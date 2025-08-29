import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function POST() {
  const res = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
  res.cookies.set('session_user', '', { path: '/', maxAge: 0 });
  res.cookies.set('session_user_name', '', { path: '/', maxAge: 0 });
  return res;
}


