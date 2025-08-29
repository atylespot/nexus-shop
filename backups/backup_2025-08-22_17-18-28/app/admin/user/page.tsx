"use client";
import { useEffect, useMemo, useState } from "react";

type Role =
  | "Super Admin"
  | "Admin"
  | "Manager"
  | "Salesman"
  | "Sales Manager"
  | "Purchase Manager"
  | "Inventory Manager"
  | "Finance Manager"
  | "Support"
  | "Editor"
  | "Viewer";

type AppUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  phone?: string;
  avatarUrl?: string | null;
  userId?: string;
  invitedAt?: string;
  invitePreviewUrl?: string | null;
  inviteUsingTest?: boolean;
  lastInvite?: {
    name: string;
    email: string;
    role: Role;
    tempPassword?: string;
    loginUrl: string;
  };
};

const ROLES: Role[] = [
  "Super Admin",
  "Admin",
  "Manager",
  "Salesman",
  "Sales Manager",
  "Purchase Manager",
  "Inventory Manager",
  "Finance Manager",
  "Support",
  "Editor",
  "Viewer",
];

export default function UserPage() {
  const [activeTab, setActiveTab] = useState<"create" | "permission">("permission");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Admin" as Role, status: "ACTIVE" as const, userId: "", phone: "", avatarUrl: "" });
  const [viewUser, setViewUser] = useState<AppUser | null>(null);
  const [inviteInfo, setInviteInfo] = useState<{ email: string; preview?: string | null; usingTest?: boolean } | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ configured: boolean; details?: { host: string | null; port: number | null; from: string | null } } | null>(null);
  const [roles, setRoles] = useState<{ id:number; name:string }[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
  const [allPermissions, setAllPermissions] = useState<{id:number; resource:string; action:string}[]>([]);
  const [roleMap, setRoleMap] = useState<Record<string, boolean>>({});
  const [userList, setUserList] = useState<AppUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [loginLink, setLoginLink] = useState<string | null>(null);
  const [recentCreds, setRecentCreds] = useState<Record<string, { tempPassword?: string; loginUrl?: string }>>({});
  const allSectionsLabel: { key: string; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'categories', label: 'Categories' },
    { key: 'products', label: 'Products' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'orders', label: 'Orders' },
    { key: 'courier', label: 'Courier Orders' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'finance', label: 'Finance' },
    { key: 'users', label: 'Users' },
    { key: 'settings:general', label: 'Settings - General' },
    { key: 'settings:site', label: 'Settings - Site' },
    { key: 'settings:pixels', label: 'Settings - Pixels' },
    { key: 'settings:courier', label: 'Settings - Courier' },
    { key: 'settings:bd-courier', label: 'Settings - BD Courier' },
    { key: 'settings:email', label: 'Settings - Email' },
    { key: 'purchases', label: 'Purchases' },
    { key: 'expenses', label: 'Expenses' },
  ];

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/user-invite/status');
        if (r.ok) setEmailStatus(await r.json());
      } catch {}
      try {
        // auto-seed default permissions/roles if empty
        await fetch('/api/seed/permissions', { method: 'POST' });
      } catch {}
      try {
        const loadRoles = async () => {
          const rr = await fetch('/api/authz/roles');
          if (rr.ok) {
            const data = await rr.json();
            if (Array.isArray(data) && data.length > 0) { setRoles(data); return; }
          }
          // retry by seeding once more
          await fetch('/api/seed/permissions', { method: 'POST' });
          const rr2 = await fetch('/api/authz/roles');
          if (rr2.ok) {
            const d2 = await rr2.json();
            if (Array.isArray(d2) && d2.length > 0) { setRoles(d2); return; }
          }
          // fallback local
          setRoles([
            { id: 1, name: 'Super Admin' },
            { id: 2, name: 'Admin' },
            { id: 3, name: 'Manager' },
            { id: 4, name: 'Sales Manager' },
            { id: 5, name: 'Salesman' },
            { id: 6, name: 'Purchase Manager' },
            { id: 7, name: 'Inventory Manager' },
            { id: 8, name: 'Finance Manager' },
            { id: 9, name: 'Support' },
            { id: 10, name: 'Editor' },
            { id: 11, name: 'Viewer' },
          ]);
        };
        const loadPerms = async () => {
          const pr = await fetch('/api/authz/permissions');
          if (pr.ok) {
            const pdata = await pr.json();
            if (Array.isArray(pdata) && pdata.length > 0) { setAllPermissions(pdata); return; }
          }
          await fetch('/api/seed/permissions', { method: 'POST' });
          const pr2 = await fetch('/api/authz/permissions');
          if (pr2.ok) {
            const pd2 = await pr2.json();
            if (Array.isArray(pd2) && pd2.length > 0) { setAllPermissions(pd2); return; }
          }
          // minimal fallback
          setAllPermissions([
            { id: 101, resource: 'orders', action: 'view' },
            { id: 102, resource: 'orders', action: 'create' },
            { id: 103, resource: 'products', action: 'view' },
          ]);
        };
        // Load server users only (avoid duplicates from local storage)
        await refreshUsers();
        await Promise.all([loadRoles(), loadPerms()]);
      } catch {}
    })();
  }, []);

  // Persist recent temp creds so View modal can show after reloads
  useEffect(() => {
    try {
      const raw = localStorage.getItem('nexus-temp-creds');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setRecentCreds(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('nexus-temp-creds', JSON.stringify(recentCreds)); } catch {}
  }, [recentCreds]);

  const refreshUsers = async () => {
    try {
      console.log('🔄 Refreshing users from server...');
      const ur = await fetch('/api/authz/users');
      if (ur.ok) {
        const data = await ur.json();
        console.log('📥 Raw user data from server:', data);
        if (Array.isArray(data)) {
          const byEmail: Record<string, any> = {};
          data.sort((a:any,b:any)=> (b.id||0)-(a.id||0)).forEach((u:any)=>{ if (!byEmail[u.email]) byEmail[u.email] = u; });
          const arr = Object.values(byEmail).map((u:any)=>({ id: u.id, name: u.name, email: u.email, role: (u.role?.name || 'No Role') as Role, status: (u.status || 'ACTIVE') as any, createdAt: new Date().toISOString(), phone: u.phone, avatarUrl: u.avatarUrl, userId: u.userId, loginSlug: u.loginSlug }));
          console.log('📋 Processed user array:', arr);
          setUserList(arr as any);
          setUsers(arr as any);
          console.log('✅ User list updated, count:', arr.length);
        }
      } else {
        console.error('❌ Failed to fetch users:', ur.status, ur.statusText);
      }
    } catch (error) {
      console.error('❌ Error refreshing users:', error);
    }
  };

  // Remember active tab across reloads
  useEffect(() => {
    try {
      const t = localStorage.getItem('nexus-user-active-tab');
      if (t === 'create' || t === 'permission') setActiveTab(t as any);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('nexus-user-active-tab', activeTab); } catch {}
  }, [activeTab]);

  // Auto-select first user and load permissions
  useEffect(() => {
    (async () => {
      if (userList.length > 0 && selectedUserId === "") {
        const id = userList[0].id;
        setSelectedUserId(id);
        try { const r = await fetch(`/api/authz/user-permissions?userId=${id}`); if (r.ok){ const d=await r.json(); const map:Record<string,boolean>={}; (d.grants||[]).forEach((pid:number)=>{map[`${pid}`]=true}); setRoleMap(map);} } catch {}
      }
    })();
  }, [userList]);

  const openCreate = () => {
    setEditingId(null);
    const defaultRoleId = roles[0]?.id ?? "";
    const defaultRoleName = roles[0]?.name ?? "Viewer";
    setForm({ name: "", email: "", password: "", role: defaultRoleName as Role, status: "ACTIVE", userId: "", phone: "", avatarUrl: "" });
    setSelectedRoleId(defaultRoleId as any);
    setModalOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setEditingId(u.id);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, status: u.status, userId: (u as any).userId || "", phone: (u as any).phone || "", avatarUrl: (u as any).avatarUrl || "" });
    const match = roles.find(r => r.name === u.role);
    setSelectedRoleId((match?.id ?? "") as any);
    setModalOpen(true);
  };

  const sendInvite = async (email: string, name: string, role: Role, tempPassword?: string) => {
    try {
      const r = await fetch('/api/user-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, name, role, tempPassword })
      });
      if (r.ok) return await r.json();
      return null;
    } catch {}
  };

  const saveUser = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editingId !== null) {
      setUsers(prev => prev.map(u => (u.id === editingId ? { ...u, name: form.name, email: form.email, role: form.role, status: form.status } : u)));
    } else {
      try {
        const r = await fetch('/api/auth/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          roleId: selectedRoleId || null,
          status: form.status,
          userId: form.userId || undefined,
          password: form.password || undefined,
          phone: form.phone || undefined,
          avatarUrl: form.avatarUrl || undefined,
        })});
        if (r.ok) {
          const data = await r.json();
          console.log('✅ User created successfully:', data);
          setLoginLink(data.loginUrl);
          setRecentCreds(prev => ({ ...prev, [form.email.trim()]: { tempPassword: form.password || undefined, loginUrl: data.loginUrl } }));
          const roleName = (roles.find(x => x.id === selectedRoleId)?.name || 'Viewer') as Role;
          const newUser: AppUser = {
            id: data.id ?? (users.length ? Math.max(...users.map(u=>u.id))+1 : 1),
            name: data.name ?? form.name.trim(),
            email: data.email ?? form.email.trim(),
            role: roleName,
            status: (data.status ?? form.status) as 'ACTIVE' | 'INACTIVE',
            createdAt: new Date().toISOString(),
            phone: ((data as any)?.phone ?? form.phone) || undefined,
            avatarUrl: ((data as any)?.avatarUrl ?? form.avatarUrl) || undefined,
            userId: ((data as any)?.userId ?? form.userId) || undefined,
            lastInvite: { name: form.name.trim(), email: form.email.trim(), role: roleName, tempPassword: form.password || undefined, loginUrl: data.loginUrl },
          };
          console.log('👤 New user object created:', newUser);
          setUsers(prev => [newUser, ...prev]);
          
          // Auto-set role-based permissions for new user
          try {
            const roleId = selectedRoleId;
            if (roleId) {
              console.log('🔐 Setting role permissions for new user...');
              // Get role permissions
              const rolePermsRes = await fetch(`/api/authz/role-permissions?roleId=${roleId}`);
              if (rolePermsRes.ok) {
                const rolePerms = await rolePermsRes.json();
                if (rolePerms.permissions && rolePerms.permissions.length > 0) {
                  // Set user permissions based on role
                  const userPermsRes = await fetch('/api/authz/user-permissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: data.id,
                      grants: rolePerms.permissions.map((p: any) => p.permissionId)
                    })
                  });
                  if (userPermsRes.ok) {
                    console.log('✅ Role permissions auto-set for new user');
                  }
                }
              }
            }
          } catch (error) {
            console.error('❌ Failed to auto-set role permissions:', error);
          }
        } else {
          console.error('❌ Failed to create user:', r.status, r.statusText);
          const errorData = await r.json().catch(() => ({}));
          console.error('Error details:', errorData);
        }
        // Refresh user list from server
        console.log('🔄 Refreshing user list after creation...');
        await refreshUsers();
      } catch {}
    }
    setModalOpen(false);
  };

  const deleteUser = (id: number) => setUsers(prev => prev.filter(u => u.id !== id));

  const resendInvite = async (u: AppUser) => {
    const res = await sendInvite(u.email, u.name, u.role);
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, invitedAt: new Date().toISOString(), invitePreviewUrl: res?.preview || null, inviteUsingTest: !!res?.usingTestAccount } : x));
    setInviteInfo({ email: u.email, preview: res?.preview || null, usingTest: !!res?.usingTestAccount });
    if (res?.preview) {
      try { window.open(res.preview, '_blank'); } catch {}
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="flex gap-2 p-3 border-b">
        <button
          className={`px-4 py-2 text-sm rounded-md ${activeTab === 'create' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('create')}
        >
          Create User
        </button>
        <button
          className={`px-4 py-2 text-sm rounded-md ${activeTab === 'permission' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('permission')}
        >
          Permission
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Users</h3>
            <div className="flex items-center gap-2">
              {emailStatus && (
                <span className={`px-2 py-1 text-xs rounded-full ${emailStatus.configured ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-800'}`}>
                  Email: {emailStatus.configured ? 'Live (SMTP configured)' : 'Test mode (Preview only)'}
                </span>
              )}
              <button onClick={openCreate} className="px-3 py-2 bg-emerald-600 text-white rounded-md">+ Add User</button>
            </div>
          </div>
          {inviteInfo && (
            <div className="mb-3 p-3 border rounded-md bg-emerald-50 text-sm text-emerald-800">
              <div>Invite sent to <b>{inviteInfo.email}</b>.</div>
              {inviteInfo.preview && (
                <div>Preview email: <a className="underline" href={inviteInfo.preview} target="_blank">Open</a> {inviteInfo.usingTest ? '(test inbox)' : ''}</div>
              )}
            </div>
          )}

          {/* Users Table (server list) */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No users yet</td>
                  </tr>
                )}
                {userList.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover border" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 border" />
                      )}
                    </td>
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.phone || '-'}</td>
                    <td className="px-4 py-2">{(u as any)?.role?.name || (u as any)?.role || 'No Role'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex gap-2">
                        <button onClick={() => setViewUser(u as any)} className="px-3 py-1 rounded border text-gray-700">View</button>
                        <button onClick={() => resendInvite(u as any)} className="px-3 py-1 rounded bg-blue-600 text-white">Send Invite</button>
                        <button onClick={() => openEdit(u as any)} className="px-3 py-1 rounded bg-emerald-600 text-white">Edit</button>
                        <button onClick={async () => { try { await fetch(`/api/authz/users/${u.id}`, { method: 'DELETE' }); await refreshUsers(); } catch {} }} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
              <div className="bg-white rounded-lg shadow-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b">
                  <h3 className="text-lg font-medium">{editingId ? 'Edit User' : 'Create User'}</h3>
                </div>
                <div className="p-4 space-y-4 relative z-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="Full name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="email@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                      <input value={form.userId} onChange={(e)=>setForm({...form, userId:e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="unique id (optional)" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="Mobile number" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={selectedRoleId}
                        onChange={(e)=>{
                          const val = e.target.value;
                          const id = val === '' ? '' : Number(val);
                          setSelectedRoleId(id as any);
                          const rname = roles.find(r=>r.id === id)?.name || form.role;
                          setForm(prev=>({ ...prev, role: rname as any }));
                        }}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Select role</option>
                        {roles.map(r=> (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                      <div className="flex items-center gap-3">
                        {form.avatarUrl ? (
                          <img src={form.avatarUrl} alt="avatar" className="w-12 h-12 rounded-full border object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full border bg-gray-100" />
                        )}
                        <input type="file" accept="image/*" onChange={async (e)=>{
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const fd = new FormData();
                          fd.append('file', f);
                          try {
                            const r = await fetch('/api/upload', { method: 'POST', body: fd });
                            if (r.ok) {
                              const d = await r.json();
                              setForm(prev => ({ ...prev, avatarUrl: d.url }));
                            }
                          } catch {}
                        }} />
                      </div>
                    </div>
                    {!editingId && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="••••••••" />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={form.status} onChange={(e)=>setForm({...form, status: e.target.value as 'ACTIVE' | 'INACTIVE'})} className="w-full px-3 py-2 border rounded-md">
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>
                  {loginLink && (
                    <div className="text-sm text-emerald-700">Login URL: <a className="underline" href={loginLink} target="_blank">{loginLink}</a></div>
                  )}
                </div>
                <div className="p-4 border-t flex justify-end gap-2">
                  <button onClick={()=>setModalOpen(false)} className="px-4 py-2 rounded-md border">Cancel</button>
                  <button onClick={saveUser} className="px-4 py-2 bg-emerald-600 text-white rounded-md">{editingId ? 'Save' : 'Create'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setViewUser(null)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">User Info</h3>
              <button onClick={() => setViewUser(null)} className="text-gray-500">✕</button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Name</span><span className="font-medium">{viewUser.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Email</span><span className="font-medium">{viewUser.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">User ID</span><span className="font-medium">{viewUser.userId || (recentCreds[viewUser.email]?.loginUrl ? (viewUser.email.split('@')[0]) : '-') }</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Phone</span><span className="font-medium">{viewUser.phone || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Role</span><span className="font-medium">{viewUser.role}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Status</span><span className="font-medium">{viewUser.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Temporary Password</span><span className="font-medium">{viewUser.lastInvite?.tempPassword || recentCreds[viewUser.email]?.tempPassword || '-'}</span></div>
              {viewUser.lastInvite?.loginUrl && (
                <div className="flex justify-between"><span className="text-gray-600">Login URL</span><a className="font-medium text-emerald-700 underline" href={viewUser.lastInvite.loginUrl} target="_blank">{viewUser.lastInvite.loginUrl}</a></div>
              )}
              { (()=>{
                  const url = viewUser.lastInvite?.loginUrl || recentCreds[viewUser.email]?.loginUrl || (viewUser as any)?.loginSlug ? `${window.location.origin}/login/${(viewUser as any).loginSlug}` : loginLink;
                  return url ? (
                    <div className="flex justify-between"><span className="text-gray-600">Login URL</span><a className="font-medium text-emerald-700 underline" href={url} target="_blank">{url}</a></div>
                  ) : null;
                })()
              }
              {viewUser.invitePreviewUrl && (
                <div className="flex justify-between"><span className="text-gray-600">Email Preview</span><a className="font-medium text-emerald-700 underline" href={viewUser.invitePreviewUrl} target="_blank">Open preview</a></div>
              )}
              <div className="flex justify-between"><span className="text-gray-600">Created At</span><span className="font-medium">{new Date(viewUser.createdAt).toLocaleString()}</span></div>
              {viewUser.invitedAt && <div className="flex justify-between"><span className="text-gray-600">Invited At</span><span className="font-medium">{new Date(viewUser.invitedAt).toLocaleString()}</span></div>}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button onClick={() => setViewUser(null)} className="px-4 py-2 rounded-md border">Close</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'permission' && (
        <div className="p-4">
          <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* User list as cards */}
            <div className="md:col-span-1">
              <div className="border rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b text-sm font-medium bg-gray-50">Users</div>
                <div className="max-h-80 overflow-auto">
                  {userList.length === 0 && <div className="p-3 text-sm text-gray-500">No users yet</div>}
                  {userList.map(u => (
                    <button key={u.id} onClick={async ()=>{
                      setSelectedUserId(u.id);
                      try {
                        const matrix = [] as any[];
                        const actions = ['view','create','update','delete'];
                        allSectionsLabel.forEach(sec => actions.forEach(a => matrix.push({ resource: sec.key, action: a })));
                        await fetch('/api/authz/ensure-permissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: matrix }) });
                        const pr = await fetch('/api/authz/permissions');
                        if (pr.ok) setAllPermissions(await pr.json());
                      } catch {}
                      try { const r = await fetch(`/api/authz/user-permissions?userId=${u.id}`); if (r.ok){ const d=await r.json(); const map:Record<string,boolean>={}; (d.grants||[]).forEach((pid:number)=>{map[`${pid}`]=true}); setRoleMap(map);} } catch {}
                      setPermModalOpen(true);
                    }} className={`w-full text-left px-3 py-2 border-b text-sm hover:bg-emerald-50`}>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                      <div className="text-xs text-emerald-700 font-medium">{(u as any)?.role?.name || (u as any)?.role || 'No Role'}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Permission editor now opens in modal on user click */}
            <div className="md:col-span-3">
              <div className="p-6 text-sm text-gray-600">Select a user from left to edit permissions.</div>
            </div>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {permModalOpen && selectedUserId !== "" && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={()=>setPermModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[80vh] overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Edit Permissions — {(() => { const u=userList.find(x=>x.id===selectedUserId) as any; const roleName = u?.role?.name || u?.role || 'No Role'; return u? `${u.name} (${roleName})` : ''; })()}
              </h3>
              <button onClick={()=>setPermModalOpen(false)} className="text-gray-500">✕</button>
            </div>
            <div className="p-4">
              <SectionPermissionEditor allPermissions={allPermissions} allSectionsLabel={allSectionsLabel} roleMap={roleMap} setRoleMap={setRoleMap} />
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button onClick={()=>setPermModalOpen(false)} className="px-4 py-2 rounded-md border">Cancel</button>
              <button onClick={async ()=>{
                // Build selected pairs
                const selectedPairs: { resource: string; action: string }[] = [];
                const defaultActions = ['view','create','update','delete'];
                // Collect from roleMap keys
                Object.entries(roleMap).forEach(([k,v])=>{
                  if (!v) return;
                  if (k.includes(':')) {
                    const [resource, action] = k.split(':');
                    selectedPairs.push({ resource, action });
                  } else {
                    // numeric id -> map back using allPermissions
                    const p = allPermissions.find(pp => `${pp.id}` === k);
                    if (p) selectedPairs.push({ resource: p.resource, action: p.action });
                  }
                });
                // Ensure permissions exist
                try {
                  await fetch('/api/authz/ensure-permissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: selectedPairs }) });
                } catch {}
                // Fetch latest permission ids
                let perms: { id:number; resource:string; action:string }[] = allPermissions;
                try { const pr = await fetch('/api/authz/permissions'); if (pr.ok) perms = await pr.json(); } catch {}
                const toId = (pair: {resource:string; action:string}) => perms.find(p => p.resource===pair.resource && p.action===pair.action)?.id;
                const grants = Array.from(new Set(selectedPairs.map(p=>toId(p)).filter(Boolean))) as number[];
                try { await fetch('/api/authz/user-permissions', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: selectedUserId, grants }) }); } catch {}
                
                // Dispatch event to notify layout to refresh permissions
                window.dispatchEvent(new CustomEvent('permissionsChanged'));
                
                setPermModalOpen(false);
              }} className="px-4 py-2 bg-emerald-600 text-white rounded-md">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionPermissionEditor({ allPermissions, allSectionsLabel, roleMap, setRoleMap }: { allPermissions: {id:number; resource:string; action:string}[]; allSectionsLabel: {key:string; label:string}[]; roleMap: Record<string, boolean>; setRoleMap: (f: any)=>void }) {
  const availableSections = allSectionsLabel; // always show every section
  const [sectionKey, setSectionKey] = useState<string>(availableSections[0]?.key || '');
  const serverActions = allPermissions.filter(p => p.resource === sectionKey);
  const defaultActions = ['view','create','update','delete'];
  const unionActionNames = Array.from(new Set([...(serverActions.map(p=>p.action)), ...defaultActions]));
  const actions = unionActionNames.map(a => serverActions.find(p => p.action === a) || ({ id: -1, resource: sectionKey, action: a } as any));
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-1 border rounded-md max-h-[60vh] overflow-auto">
        {availableSections.map(s => (
          <button key={s.key} onClick={()=>setSectionKey(s.key)} className={`w-full text-left px-3 py-2 border-b text-sm ${sectionKey===s.key ? 'bg-emerald-100' : 'hover:bg-gray-50'}`}>{s.label}</button>
        ))}
      </div>
      <div className="md:col-span-3 border rounded-md p-3">
        <h4 className="font-medium mb-2">{availableSections.find(s=>s.key===sectionKey)?.label || 'Permissions'}</h4>
        {actions.length === 0 ? <div className="text-sm text-gray-500">No actions</div> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {actions.map(p => (
              <label key={`${p.resource}:${p.action}`} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!roleMap[`${p.id}`] || !!roleMap[`${p.resource}:${p.action}`]} onChange={(e)=>setRoleMap((prev: any)=>({ ...prev, [`${p.resource}:${p.action}`]: e.target.checked }))} /> {p.action}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


