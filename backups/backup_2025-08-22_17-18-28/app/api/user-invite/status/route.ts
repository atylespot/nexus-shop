import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  const configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  const details = {
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null,
    from: process.env.SMTP_FROM || null,
  };
  return NextResponse.json({ configured, details });
}


