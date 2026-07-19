'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/admin', label: '📊 Dashboard', exact: true },
  { href: '/admin/leads', label: '📥 Leads' },
  { href: '/admin/clients', label: '👥 Clients' },
  { href: '/admin/estimates', label: '📋 Estimates' },
  { href: '/admin/projects', label: '🔨 Projects' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/admin/login');
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data as Profile);
    });
  }, [router]);

  async function logout() {
    await createClient().auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-navy text-white">
      <aside className="hidden w-60 flex-col border-r border-white/10 bg-[#040b14] md:flex">
        <div className="border-b border-white/10 p-5">
          <h1 className="font-bebas text-lg tracking-widest">PRIME LAYER <span className="text-amber">CRM</span></h1>
          <p className="text-xs uppercase tracking-wider text-gray-400">Business Manager</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2.5 text-sm font-medium transition ${
                isActive(item.href, item.exact)
                  ? 'bg-amber/15 text-amber'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber text-sm font-bold text-navy">
              {(profile?.full_name || '?').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold">{profile?.full_name || 'Staff'}</div>
              <div className="text-xs uppercase text-gray-400">{profile?.role || 'employee'}</div>
            </div>
          </div>
          <button type="button" onClick={logout} className="w-full rounded border border-white/15 px-3 py-2 text-sm text-gray-300 hover:text-white">
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-navy/95 px-6 py-4 backdrop-blur">
          <h2 className="text-lg font-bold capitalize">{pathname.split('/').pop() || 'dashboard'}</h2>
          <Link href="/" className="text-sm text-gray-400 hover:text-amber">← Website</Link>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
