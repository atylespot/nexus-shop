import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    if (!idNum) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    await db.userPermission.deleteMany({ where: { userId: idNum } });
    await db.appUser.delete({ where: { id: idNum } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


