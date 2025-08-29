"use client";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSent(null);
    try {
      const r = await fetch('/api/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        setSent(d.preview ? `Sent (preview: ${d.preview})` : 'Reset link sent if the email exists');
      } else {
        const d = await r.json().catch(() => ({}));
        setErr(d?.error || 'Failed');
      }
    } catch (e) { setErr('Failed'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-white shadow rounded p-6 space-y-4">
        <h1 className="text-xl font-semibold text-center">Forgot Password</h1>
        {sent && <div className="text-sm text-green-700 text-center">{sent}</div>}
        {err && <div className="text-sm text-red-600 text-center">{err}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" className="w-full px-3 py-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <button type="submit" className="w-full py-2 rounded bg-emerald-600 text-white">Send reset link</button>
      </form>
    </div>
  );
}
