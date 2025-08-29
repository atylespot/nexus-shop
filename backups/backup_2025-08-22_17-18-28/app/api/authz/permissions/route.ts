import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const perms = await db.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
  return NextResponse.json(perms);
}


