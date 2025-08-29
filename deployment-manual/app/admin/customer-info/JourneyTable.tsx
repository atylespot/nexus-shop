"use client";

import { useEffect, useMemo, useState } from "react";

interface Row {
  id: string;
  source: string; // WEB | LP
  customerName?: string;
  phone?: string;
  address?: string;
  district?: string;
  thana?: string;
  productName?: string;
  productImage?: string;
  status: string; // view | checkout_form | checkout_filled | order_placed
  eventTime: string;
  abandoned?: boolean;
}

export default function JourneyTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [totals, setTotals] = useState<{ views: number; checkout_form: number; checkout_filled: number; abandoned: number } | null>(null);
  const [convertedCount, setConvertedCount] = useState<number>(0);
  // Stats (Converted pending orders via Journey)
  const [statsStatus, setStatsStatus] = useState<string>('pending');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [stats, setStats] = useState<{ today: number; yesterday: number; thisWeek: number; thisMonth: number; total: number; rangeCount: number | null } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/customer-journey?range=60&page=${page}&pageSize=${pageSize}`);
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        if (!abort) {
          setRows(json.rows || []);
          setTotals(json.totals || null);
          setTotalPages(json.totalPages || 1);
          setConvertedCount((json.rows || []).filter((r: any) => r.status === 'order_placed').length);
        }
      } catch {}
      finally { if (!abort) setLoading(false); }
    })();
    return () => { abort = true; };
  }, [page]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => (
      (r.customerName || '').toLowerCase().includes(q) ||
      (r.phone || '').toLowerCase().includes(q) ||
      (r.productName || '').toLowerCase().includes(q) ||
      (r.district || '').toLowerCase().includes(q) ||
      (r.thana || '').toLowerCase().includes(q) ||
      (r.source || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q)
    ));
  }, [rows, query]);

  useEffect(() => {
    // Live updates every 3s
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/customer-journey?range=60&page=${page}&pageSize=${pageSize}`);
        if (res.ok) {
          const json = await res.json();
          setRows(json.rows || []);
          setTotals(json.totals || null);
          setTotalPages(json.totalPages || 1);
          setConvertedCount((json.rows || []).filter((r: any) => r.status === 'order_placed').length);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(t);
  }, [page]);

  // Fetch converted orders stats
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (statsStatus) params.set('status', statsStatus);
        if (fromDate) params.set('from', fromDate);
        if (toDate) params.set('to', toDate);
        params.set('onlyJourney', 'true');
        const res = await fetch(`/api/orders/stats?${params.toString()}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!abort) setStats({ today: json.today || 0, yesterday: json.yesterday || 0, thisWeek: json.thisWeek || 0, thisMonth: json.thisMonth || 0, total: json.total || 0, rangeCount: json.rangeCount ?? null });
      } catch {}
    })();
    return () => { abort = true; };
  }, [statsStatus, fromDate, toDate]);

  if (loading) return <div className="text-sm text-gray-500">Loading journey…</div>;

  return (
    <div className="space-y-3">
      {/* Converted orders stats (from Journey conversions) */}
      <div className="p-3 bg-white/60 rounded border">
        <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Status</label>
            <select value={statsStatus} onChange={e => setStatsStatus(e.target.value)} className="border rounded px-2 py-1 text-sm w-36">
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          </div>
          <div className="ml-auto text-xs text-gray-500">Converted from Customer Journey</div>
        </div>
        {stats && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat title="Today" value={stats.today} color="bg-emerald-50 text-emerald-700" />
            <Stat title="Yesterday" value={stats.yesterday} color="bg-emerald-50 text-emerald-700" />
            <Stat title="This Week" value={stats.thisWeek} color="bg-emerald-50 text-emerald-700" />
            <Stat title="This Month" value={stats.thisMonth} color="bg-emerald-50 text-emerald-700" />
            <Stat title="Total" value={stats.total} color="bg-emerald-50 text-emerald-700" />
          </div>
        )}
        {stats?.rangeCount != null && (
          <div className="mt-2 text-xs"><span className="font-medium">Range Count:</span> {stats.rangeCount}</div>
        )}
      </div>
      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Stat title="Views" value={totals.views} color="bg-blue-100 text-blue-700" />
          <Stat title="Checkout Form" value={totals.checkout_form} color="bg-purple-100 text-purple-700" />
          <Stat title="Checkout Filled" value={totals.checkout_filled} color="bg-indigo-100 text-indigo-700" />
          <Stat title="Abandoned" value={totals.abandoned} color="bg-red-100 text-red-700" />
          <Stat title="Converted (This Page)" value={convertedCount} color="bg-emerald-100 text-emerald-700" />
        </div>
      )}
      <div className="flex items-center justify-between">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name/phone/product/district/status"
          className="w-full md:w-96 px-3 py-2 border rounded-md text-sm"
        />
        <div className="flex items-center gap-2 ml-3">
          <button className="px-2 py-1 border rounded text-xs" disabled={page<=1} onClick={() => setPage(1)}>First</button>
          <button className="px-2 py-1 border rounded text-xs" disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>Prev</button>
          <span className="text-xs text-gray-500">Page {page} / {totalPages}</span>
          <button className="px-2 py-1 border rounded text-xs" disabled={page>=totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>Next</button>
          <button className="px-2 py-1 border rounded text-xs" disabled={page>=totalPages} onClick={() => setPage(totalPages)}>Last</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-3 py-2 text-left">Source</th>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Address</th>
              <th className="px-3 py-2 text-left">District</th>
              <th className="px-3 py-2 text-left">Thana</th>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Abandoned</th>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Convert</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{r.source}</td>
                <td className="px-3 py-2">{r.customerName || '-'}</td>
                <td className="px-3 py-2">{r.phone || '-'}</td>
                <td className="px-3 py-2">{r.address || '-'}</td>
                <td className="px-3 py-2">{r.district || '-'}</td>
                <td className="px-3 py-2">{r.thana || '-'}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {r.productImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.productImage} alt="" className="w-8 h-8 rounded object-cover" />
                    )}
                    <span>{r.productName || '-'}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    r.status === 'order_placed' ? 'bg-green-100 text-green-700' :
                    r.status?.startsWith('checkout') ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{r.status}</span>
                </td>
                <td className="px-3 py-2">{r.abandoned ? <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">Yes</span> : '-'}</td>
                <td className="px-3 py-2 text-gray-600">{new Date(r.eventTime).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <button
                    className="px-3 py-1 text-xs rounded bg-emerald-600 text-white disabled:opacity-50"
                    disabled={updatingId === r.id || r.status === 'order_placed'}
                    onClick={async () => {
                      try {
                        setUpdatingId(r.id);
                        const res = await fetch('/api/customer-journey/convert', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: r.id.replace('evt_','') }) });
                        const data = await res.json();
                        if (res.ok) {
                          alert(`Order created: ${data.orderNo}`);
                          setRows(prev => prev.map(x => x.id === r.id ? { ...x, status: 'order_placed' } : x));
                        } else {
                          alert(data?.error || 'Failed to convert');
                        }
                      } finally { setUpdatingId(null); }
                    }}
                  >Create Pending Order</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-gray-500">No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className={`p-3 rounded border ${color} border-transparent`}> 
      <div className="text-xs text-gray-600">{title}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function StatusDropdown({ row, disabled, onChange }: { row: Row; disabled?: boolean; onChange: (status: string) => void }) {
  const options = [
    { value: 'view', label: 'View' },
    { value: 'checkout_form', label: 'Checkout Form' },
    { value: 'checkout_filled', label: 'Checkout Filled' },
    // no 'order_placed' here by design
  ];
  return (
    <select disabled={disabled} value={row.status} onChange={e => onChange(e.target.value)} className="border rounded px-2 py-1 text-sm">
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}


