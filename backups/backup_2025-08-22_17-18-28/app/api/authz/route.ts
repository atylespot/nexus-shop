import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/authz  { userId, resource, action } -> { allowed: boolean }
export async function POST(req: NextRequest) {
  try {
    const { userId, resource, action } = await req.json();
    if (!userId || !resource || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Super admin (user ID 1) gets all permissions
    if (Number(userId) === 1) {
      return NextResponse.json({ allowed: true });
    }

    // Find permission id
    const perm = await db.permission.findUnique({ where: { resource_action: { resource, action } } });
    if (!perm) return NextResponse.json({ allowed: false });

    // User direct override
    const up = await db.userPermission.findUnique({ where: { userId_permissionId: { userId: Number(userId), permissionId: perm.id } } });
    if (up) return NextResponse.json({ allowed: up.effect === 'ALLOW' });

    // Role permission
    const user = await db.appUser.findUnique({ where: { id: Number(userId) }, include: { role: true } });
    if (!user || !user.roleId) return NextResponse.json({ allowed: false });
    const rp = await db.rolePermission.findUnique({ where: { roleId_permissionId: { roleId: user.roleId, permissionId: perm.id } } });
    return NextResponse.json({ allowed: !!rp?.allowed });
  } catch (e: any) {
    console.error('Authorization error:', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


