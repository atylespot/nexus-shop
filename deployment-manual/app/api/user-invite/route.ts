import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import sgMail from "@sendgrid/mail";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { to, name, role, tempPassword } = body || {};
		if (!to || !name || !role) {
			return NextResponse.json({ error: "Missing fields" }, { status: 400 });
		}

        // Load settings
        const saved = await db.emailSetting.findFirst({ where: { isActive: true }, orderBy: { id: 'desc' } });
        const provider = (saved?.provider || 'SMTP').toUpperCase();
        const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const html = `
			<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111">
				<h2>Welcome to Nexus Shop</h2>
				<p>Hi ${name},</p>
				<p>Your account has been created with the role: <b>${role}</b>.</p>
				${tempPassword ? `<p>Temporary password: <code>${tempPassword}</code></p>` : ""}
				<p>Login: <a href="${siteUrl}/admin">${siteUrl}/admin</a></p>
				<p>Thank you.</p>
			</div>
		`;

        // SendGrid path
        if (provider === 'SENDGRID' && saved?.apiKey && saved?.from) {
          sgMail.setApiKey(saved.apiKey);
          const info = await sgMail.send({
            to,
            from: saved.from,
            subject: "Your Nexus Shop account",
            html,
          });
          return NextResponse.json({ ok: true, preview: null, usingTestAccount: false });
        }

        // SMTP fallback
        let transporter: nodemailer.Transporter;
        let usingTestAccount = false;
        const host = saved?.host || process.env.SMTP_HOST;
        const port = Number(saved?.port || process.env.SMTP_PORT || 587);
        const user = saved?.user || process.env.SMTP_USER;
        const pass = saved?.pass || process.env.SMTP_PASS;
        const fromAddr = saved?.from || process.env.SMTP_FROM || user || undefined;

        if (!host || !user || !pass) {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({ host: 'smtp.ethereal.email', port: 587, secure: false, auth: { user: testAccount.user, pass: testAccount.pass } });
            usingTestAccount = true;
        } else {
            transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
        }

		const info = await transporter.sendMail({ from: fromAddr, to, subject: "Your Nexus Shop account", html });
		const preview = nodemailer.getTestMessageUrl(info) || null;
		return NextResponse.json({ ok: true, preview, usingTestAccount });
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
	}
}


