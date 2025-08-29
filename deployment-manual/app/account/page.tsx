"use client";
import { useEffect, useState } from 'react';
import SharedHeader from '@/components/SharedHeader';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface Customer { id: number; name: string; email?: string; phone?: string }
interface Order { id: number; orderNo: string; status: string; total: number; createdAt?: string; orderDate?: string; orderType?: string }

export default function MyAccountPage() {
  const [me, setMe] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'dashboard' | 'orders' | 'licenses' | 'downloads'>('profile');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/customer/me');
        const d = await res.json();
        if (d?.loggedIn) setMe(d.customer);
        // Load orders (simple: reuse /api/orders and filter by customerId client-side if provided in payload later)
        const or = await fetch('/api/orders');
        const od = await or.json();
        const list = Array.isArray(od.orders) ? od.orders : [];
        setOrders(list.filter((o:any)=> true));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedHeader />
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">My Account</h1>

        {!me ? (
          <div className="bg-white p-6 rounded shadow">
            <p className="mb-4">You are not logged in.</p>
            <div className="flex gap-3">
              <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded">Login</Link>
              <Link href="/register" className="px-4 py-2 bg-green-600 text-white rounded">Register</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <aside className="bg-white rounded shadow divide-y">
              {[
                { key: 'profile', label: 'Profile' },
                { key: 'dashboard', label: 'Dashboard' },
                { key: 'orders', label: 'Orders' },
                { key: 'licenses', label: 'Licenses' },
                { key: 'downloads', label: 'Downloads' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key as any)}
                  className={`w-full text-left px-4 py-3 text-sm ${activeTab===item.key ? 'bg-emerald-50 text-emerald-700 font-medium' : 'hover:bg-gray-50'}`}
                >
                  {item.label}
                </button>
              ))}
              <button onClick={async()=>{ await fetch('/api/customer/logout',{method:'POST'}); window.location.href='/'; }} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50">Logout</button>
            </aside>

            {/* Content */}
            <section className="md:col-span-3">
              {activeTab === 'profile' && (
                <div className="bg-white p-6 rounded shadow">
                  <h2 className="font-semibold mb-3">Profile</h2>
                  <p><span className="text-gray-600">Name:</span> {me.name}</p>
                  {me.email && <p><span className="text-gray-600">Email:</span> {me.email}</p>}
                  {me.phone && <p><span className="text-gray-600">Phone:</span> {me.phone}</p>}
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div className="bg-white p-6 rounded shadow">
                  <h2 className="font-semibold mb-4">Dashboard</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="border rounded p-4">
                      <div className="text-sm text-gray-500">Total Orders</div>
                      <div className="text-2xl font-bold">{orders.length}</div>
                    </div>
                    <div className="border rounded p-4">
                      <div className="text-sm text-gray-500">Processing</div>
                      <div className="text-2xl font-bold">{orders.filter(o=>o.status==='processing').length}</div>
                    </div>
                    <div className="border rounded p-4">
                      <div className="text-sm text-gray-500">Pending</div>
                      <div className="text-2xl font-bold">{orders.filter(o=>o.status==='pending').length}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="bg-white p-6 rounded shadow">
                  <h2 className="font-semibold mb-3">Orders</h2>
                  {orders.length === 0 ? (
                    <p className="text-gray-600">No orders yet.</p>
                  ) : (
                    <div className="overflow-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="py-2 pr-4">Order No</th>
                            <th className="py-2 pr-4">Status</th>
                            <th className="py-2 pr-4">Total</th>
                            <th className="py-2 pr-4">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((o, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2 pr-4">{o.orderNo || `LP-${String(o.id).padStart(6,'0')}`}</td>
                              <td className="py-2 pr-4">{o.status}</td>
                              <td className="py-2 pr-4">৳{o.total}</td>
                              <td className="py-2 pr-4">{o.createdAt || o.orderDate || ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'licenses' && (
                <div className="bg-white p-6 rounded shadow">
                  <h2 className="font-semibold mb-3">Licenses</h2>
                  <p className="text-gray-600 text-sm">No digital licenses yet.</p>
                </div>
              )}

              {activeTab === 'downloads' && (
                <div className="bg-white p-6 rounded shadow">
                  <h2 className="font-semibold mb-3">Downloads</h2>
                  <p className="text-gray-600 text-sm">No downloadable items available.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}


