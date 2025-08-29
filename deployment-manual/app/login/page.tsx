"use client";
import { useState } from 'react';
import Link from 'next/link';
import SharedHeader from '@/components/SharedHeader';
import Footer from '@/components/Footer';

export default function CustomerLoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: any = { password };
      if (emailOrPhone.includes('@')) body.email = emailOrPhone; else body.phone = emailOrPhone;
      const res = await fetch('/api/customer/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      window.location.href = '/';
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedHeader />
      <div className="w-full max-w-md mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6 text-center">Customer Login</h1>
        <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow">
          <label className="block text-sm font-medium text-gray-700">Email or Phone</label>
          <input value={emailOrPhone} onChange={e=>setEmailOrPhone(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="example@mail.com or 01XXXXXXXXX" />
          <label className="block text-sm font-medium text-gray-700 mt-4">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="••••••••" />
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          <button disabled={loading} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">{loading ? 'Logging in…' : 'Login'}</button>
          <p className="text-center text-sm mt-4">New here? <Link href="/register" className="text-blue-600">Create account</Link></p>
        </form>
      </div>
      <Footer />
    </div>
  );
}



