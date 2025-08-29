"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

export const dynamic = 'force-dynamic';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setToken(searchParams.get('token'));
  }, [searchParams]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    try {
      const r = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      if (r.ok) {
        setMsg('Password reset successful. You can now login.');
        setTimeout(()=> router.push('/login/admin'), 1500);
      } else {
        const d = await r.json().catch(()=>({}));
        setErr(d?.error || 'Failed');
      }
    } catch { setErr('Failed'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-white shadow rounded p-6 space-y-4">
        <h1 className="text-xl font-semibold text-center">Reset Password</h1>
        {msg && <div className="text-sm text-green-700 text-center">{msg}</div>}
        {err && <div className="text-sm text-red-600 text-center">{err}</div>}
        {!token && <div className="text-sm text-red-600 text-center">Missing token</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input type="password" className="w-full px-3 py-2 border rounded" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button disabled={!token} type="submit" className="w-full py-2 rounded bg-emerald-600 text-white disabled:opacity-50">Reset</button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
