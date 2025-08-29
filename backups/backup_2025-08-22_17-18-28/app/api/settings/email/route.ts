import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const s = await db.emailSetting.findFirst({ orderBy: { id: 'desc' } });
    return NextResponse.json(s || {});
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provider = (body.provider || 'SMTP').toUpperCase();

    let data: any = { provider, isActive: !!body.isActive };
    if (provider === 'SENDGRID') {
      data = {
        ...data,
        host: null,
        port: null,
        user: null,
        pass: null,
        from: body.from || null,
        apiKey: body.apiKey || null,
      };
    } else {
      data = {
        ...data,
        host: body.host || null,
        port: body.port ? Number(body.port) : null,
        user: body.user || null,
        pass: body.pass || null,
        from: body.from || null,
        apiKey: null,
      };
    }

    const created = await db.emailSetting.create({ data });
    return NextResponse.json(created);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


