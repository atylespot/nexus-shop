"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function UserLoginPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, userId, password }) });
      if (r.ok) {
        router.push('/admin');
      } else {
        const d = await r.json();
        setMsg(d?.error || 'Login failed');
      }
    } catch { setMsg('Login failed'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-white shadow rounded p-6 space-y-4">
        <h1 className="text-xl font-semibold text-center">User Login</h1>
        {msg && <div className="text-sm text-red-600 text-center">{msg}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
          <input className="w-full px-3 py-2 border rounded" value={userId} onChange={e=>setUserId(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" className="w-full px-3 py-2 border rounded" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="w-full py-2 rounded bg-emerald-600 text-white">Login</button>
        <div className="text-right text-sm">
          <a href="/forgot" className="text-emerald-700 hover:underline">Forgot password?</a>
        </div>
      </form>
    </div>
  );
}


