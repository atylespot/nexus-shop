import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/authz/role-permissions?roleId=1 -> { permissions: Array<{permissionId: number}> }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roleId = Number(searchParams.get('roleId'));
    
    if (!roleId) {
      return NextResponse.json({ error: 'roleId required' }, { status: 400 });
    }

    // Get all permissions for this role
    const rolePermissions = await db.rolePermission.findMany({
      where: { 
        roleId,
        allowed: true 
      },
      select: { 
        permissionId: true 
      }
    });

    return NextResponse.json({ 
      permissions: rolePermissions,
      count: rolePermissions.length 
    });
  } catch (e: any) {
    console.error('Role permissions error:', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
