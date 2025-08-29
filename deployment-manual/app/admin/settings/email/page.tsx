"use client";
import { useEffect, useState } from "react";

type Provider = "SMTP" | "SENDGRID";

export default function EmailSettingsPage() {
  const [activeTab, setActiveTab] = useState<Provider>("SMTP");
  const [smtp, setSmtp] = useState({ host: "", port: 587 as number | string, user: "", pass: "", from: "", isActive: true });
  const [sg, setSg] = useState({ apiKey: "", from: "", isActive: false });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/settings/email');
        if (r.ok) {
          const s = await r.json();
          if (s?.provider === 'SENDGRID') {
            setActiveTab('SENDGRID');
            setSg({ apiKey: s.apiKey || "", from: s.from || "", isActive: !!s.isActive });
          } else if (s && (s.host || s.user)) {
            setActiveTab('SMTP');
            setSmtp({ host: s.host || "", port: s.port || 587, user: s.user || "", pass: s.pass || "", from: s.from || "", isActive: !!s.isActive });
          }
        }
      } catch {}
    })();
  }, []);

  const save = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const body = activeTab === 'SMTP'
        ? { provider: 'SMTP', ...smtp }
        : { provider: 'SENDGRID', apiKey: sg.apiKey, from: sg.from, isActive: sg.isActive };
      const r = await fetch('/api/settings/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (r.ok) setStatus('Saved.'); else setStatus('Failed to save');
    } catch { setStatus('Failed to save'); }
    setLoading(false);
  };

  const testEmail = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const r = await fetch('/api/settings/email/test', { method: 'POST' });
      const result = await r.json();
      if (r.ok) {
        setStatus(`Test email sent successfully! Check your inbox.`);
      } else {
        setStatus(`Test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus('Test failed: Network error');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Email Settings</h2>

      <div className="bg-white border rounded-lg">
        <div className="flex gap-2 p-3 border-b">
          <button className={`px-4 py-2 text-sm rounded-md ${activeTab==='SMTP' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'text-gray-600 hover:bg-gray-50'}`} onClick={()=>setActiveTab('SMTP')}>SMTP</button>
          <button className={`px-4 py-2 text-sm rounded-md ${activeTab==='SENDGRID' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'text-gray-600 hover:bg-gray-50'}`} onClick={()=>setActiveTab('SENDGRID')}>SendGrid Easy</button>
        </div>

        {activeTab === 'SMTP' && (
          <div className="p-4 grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Host</label>
              <input value={smtp.host} onChange={e=>setSmtp({...smtp, host:e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="smtp.example.com" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Port</label>
              <input type="number" value={smtp.port} onChange={e=>setSmtp({...smtp, port:e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="587" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">User</label>
              <input value={smtp.user} onChange={e=>setSmtp({...smtp, user:e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Password / App Password</label>
              <input type="password" value={smtp.pass} onChange={e=>setSmtp({...smtp, pass:e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="********" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">From</label>
              <input value={smtp.from} onChange={e=>setSmtp({...smtp, from:e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="you@example.com" />
            </div>
            <div className="flex items-center gap-2">
              <input id="active" type="checkbox" checked={smtp.isActive} onChange={(e)=>setSmtp({...smtp, isActive:e.target.checked})} />
              <label htmlFor="active" className="text-sm text-gray-700">Active</label>
            </div>
          </div>
        )}

        {activeTab === 'SENDGRID' && (
          <div className="p-4 grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">API Key</label>
              <input value={sg.apiKey} onChange={e=>setSg({...sg, apiKey:e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="SG.xxxxx" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">From</label>
              <input value={sg.from} onChange={e=>setSg({...sg, from:e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="you@domain.com" />
            </div>
            <div className="flex items-center gap-2">
              <input id="sgactive" type="checkbox" checked={sg.isActive} onChange={(e)=>setSg({...sg, isActive:e.target.checked})} />
              <label htmlFor="sgactive" className="text-sm text-gray-700">Active</label>
            </div>
            <div className="text-xs text-gray-500">SendGrid-এ API Key এবং Verified Sender ডোমেইন/ইমেইল থাকতে হবে।</div>
          </div>
        )}

        <div className="p-4 border-t flex justify-end gap-2">
          <button disabled={loading} onClick={testEmail} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">{loading? 'Testing...' : 'Test Email'}</button>
          <button disabled={loading} onClick={save} className="px-4 py-2 bg-emerald-600 text-white rounded-md disabled:opacity-50">{loading? 'Saving...' : 'Save'}</button>
        </div>
        {status && <div className="px-4 pb-4 text-sm text-emerald-700">{status}</div>}
      </div>
    </div>
  );
}


