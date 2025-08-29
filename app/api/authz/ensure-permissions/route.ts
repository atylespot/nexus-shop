import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/authz/ensure-permissions
// { items: [{ resource: string, action: string }] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: { resource: string; action: string }[] = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) return NextResponse.json([]);

    const results = [] as any[];
    for (const it of items) {
      if (!it?.resource || !it?.action) continue;
      const p = await db.permission.upsert({
        where: { resource_action: { resource: it.resource, action: it.action } },
        update: {},
        create: { resource: it.resource, action: it.action }
      });
      results.push({ id: p.id, resource: p.resource, action: p.action });
    }
    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


