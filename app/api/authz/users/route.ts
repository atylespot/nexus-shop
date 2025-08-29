import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Get single user by ID
      const user = await db.appUser.findUnique({
        where: { id: Number(id) },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          roleId: true,
          managerId: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          loginSlug: true,
          phone: true,
          avatarUrl: true,
          role: true
        }
      });
      return NextResponse.json(user);
    } else {
      // Get all users
      const users = await db.appUser.findMany({ 
        orderBy: { id: 'desc' }, 
        include: { role: true } 
      });
      return NextResponse.json(users);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, roleId, managerId, status } = await req.json();
    if (!name || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const created = await db.appUser.create({ data: { name, email, roleId: roleId || null, managerId: managerId || null, status: status || 'ACTIVE' } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


