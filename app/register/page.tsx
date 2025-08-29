"use client";
import { useState } from 'react';
import Link from 'next/link';
import SharedHeader from '@/components/SharedHeader';
import Footer from '@/components/Footer';

export default function CustomerRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/customer/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, phone, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      window.location.href = '/';
    } catch (e: any) {
      setError(e?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedHeader />
      <div className="w-full max-w-md mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
        <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow">
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="Your name" />
          <label className="block text-sm font-medium text-gray-700 mt-4">Email (optional)</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="example@mail.com" />
          <label className="block text-sm font-medium text-gray-700 mt-4">Phone (BD)</label>
          <input value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="01XXXXXXXXX" />
          <label className="block text-sm font-medium text-gray-700 mt-4">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="••••••••" />
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          <button disabled={loading} className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">{loading ? 'Creating…' : 'Create Account'}</button>
          <p className="text-center text-sm mt-4">Already have an account? <Link href="/login" className="text-blue-600">Login</Link></p>
        </form>
      </div>
      <Footer />
    </div>
  );
}



