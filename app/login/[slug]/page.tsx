"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { defaultHeaderSettings } from "@/lib/header-settings";

export default function UserLoginPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Load site logo and user avatar/name by slug
  useEffect(() => {
    const load = async () => {
      try {
        // Fetch site settings for logo
        const s = await fetch('/api/settings', { cache: 'no-store' });
        if (s.ok) {
          const json = await s.json();
          const header = json?.header || {};
          setLogoUrl(header.logo || defaultHeaderSettings.logo || null);
        } else {
          setLogoUrl(defaultHeaderSettings.logo || null);
        }
      } catch {
        setLogoUrl(defaultHeaderSettings.logo || null);
      }

      try {
        // Fetch user by slug to show avatar
        if (slug) {
          const r = await fetch(`/api/auth/users?slug=${encodeURIComponent(String(slug))}`, { cache: 'no-store' });
          if (r.ok) {
            const u = await r.json();
            setUserAvatar(u?.avatarUrl || null);
            setUserName(u?.name || null);
          }
        }
      } catch {}
    };
    load();
  }, [slug]);

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
        {/* Company Logo */}
        <div className="flex flex-col items-center space-y-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Company Logo" className="h-10 object-contain" />
          ) : (
            <span className="text-xl font-bold">Nexus Shop</span>
          )}
          {/* User Avatar */}
          {userAvatar && (
            <img src={userAvatar} alt="User Avatar" className="h-16 w-16 rounded-full object-cover border" />
          )}
          {userName && <div className="text-sm text-gray-600">{userName}</div>}
        </div>
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


