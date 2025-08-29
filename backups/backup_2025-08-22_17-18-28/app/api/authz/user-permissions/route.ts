import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/authz/user-permissions?userId=1 -> { grants: number[] }
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get('userId'));
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const rows = await db.userPermission.findMany({ where: { userId, effect: 'ALLOW' }, select: { permissionId: true } });
  return NextResponse.json({ grants: rows.map(r => r.permissionId) });
}

// POST /api/authz/user-permissions  { userId: number, grants: number[] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = Number(body.userId);
    const grants: number[] = Array.isArray(body.grants) ? body.grants : [];
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    // Remove previous permissions
    await db.userPermission.deleteMany({ where: { userId } });
    // Insert new ALLOW grants
    if (grants.length > 0) {
      await db.userPermission.createMany({ data: grants.map(pid => ({ userId, permissionId: pid, effect: 'ALLOW' })) });
    }
    return NextResponse.json({ ok: true, count: grants.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


