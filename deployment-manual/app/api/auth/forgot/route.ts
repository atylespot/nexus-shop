import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const user = await db.appUser.findUnique({ where: { email } });
    if (!user) {
      // do not leak existence
      return NextResponse.json({ ok: true });
    }

    // create token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    // delete old tokens for user
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await db.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${siteUrl}/reset?token=${token}`;

    // simple transport (Ethereal fallback)
    let transporter: nodemailer.Transporter;
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const userName = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const fromAddr = process.env.SMTP_FROM || userName || undefined;
    if (!host || !userName || !pass) {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({ host: 'smtp.ethereal.email', port: 587, secure: false, auth: { user: testAccount.user, pass: testAccount.pass } });
    } else {
      transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: userName, pass } });
    }

    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
      <h3>Password Reset</h3>
      <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
    </div>`;
    const info = await transporter.sendMail({ from: fromAddr, to: email, subject: 'Reset your password', html });
    const preview = nodemailer.getTestMessageUrl(info) || null;
    return NextResponse.json({ ok: true, preview });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


