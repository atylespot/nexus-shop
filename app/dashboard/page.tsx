"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )session_user=([^;]+)/);
    if (!m) {
      router.replace("/admin/user");
      return;
    }
    const n = document.cookie.match(/(?:^|; )session_user_name=([^;]+)/);
    setName(n ? decodeURIComponent(n[1]) : null);
  }, [router]);

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{name ? name : "User"}</span>
          <form action="/api/auth/logout" method="post">
            <button className="px-3 py-1 rounded bg-gray-200" type="submit">Sign out</button>
          </form>
        </div>
      </div>
      <div className="text-gray-600">Welcome{ name ? `, ${name}` : '' }.</div>
    </div>
  );
}


