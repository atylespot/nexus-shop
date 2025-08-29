import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('session_user')?.value;
    
    if (!sessionUserId) {
      return NextResponse.json({ loggedIn: false });
    }
    
    const user = await db.appUser.findUnique({
      where: { id: Number(sessionUserId) },
      include: { role: true }
    });
    
    if (!user) {
      return NextResponse.json({ loggedIn: false });
    }
    
    return NextResponse.json({
      loggedIn: true,
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ loggedIn: false, error: 'Failed to check session' });
  }
}

