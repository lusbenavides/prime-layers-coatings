'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Lead } from '@/types/database';
import { formatDate, formatMoney } from '@/lib/format';

export function DashboardView() {
  const [stats, setStats] = useState({ clients: 0, newLeads: 0, estimates: 0, projects: 0, paid: 0 });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('estimates').select('id', { count: 'exact', head: true }).in('status', ['draft', 'sent']),
      supabase.from('projects').select('id', { count: 'exact', head: true }).in('status', ['scheduled', 'in_progress']),
      supabase.from('payments').select('amount').eq('status', 'paid'),
      supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5),
    ]).then(([clients, leads, estimates, projects, payments, recent]) => {
      setStats({
        clients: clients.count ?? 0,
        newLeads: leads.count ?? 0,
        estimates: estimates.count ?? 0,
        projects: projects.count ?? 0,
        paid: (payments.data ?? []).reduce((s, p) => s + Number(p.amount), 0),
      });
      setRecentLeads((recent.data as Lead[]) ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-gray-400">Loading dashboard…</div>;

  const cards = [
    { label: 'Clients', value: stats.clients },
    { label: 'New Leads', value: stats.newLeads },
    { label: 'Pending Estimates', value: stats.estimates },
    { label: 'Active Projects', value: stats.projects },
    { label: 'Total Collected', value: formatMoney(stats.paid), money: true },
  ];

  return (
    <div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-white/10 bg-navy-card p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">{c.label}</div>
            <div className={`mt-2 font-bold text-amber ${c.money ? 'text-2xl' : 'text-3xl'}`}>{c.value}</div>
          </div>
        ))}
      </div>
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Recent Leads</h3>
      {recentLeads.length === 0 ? (
        <p className="text-gray-400">No leads yet — they appear here from your website form and Ava chat.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase text-gray-400">
              <tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Project</th><th className="p-3">Status</th><th className="p-3">Date</th></tr>
            </thead>
            <tbody>
              {recentLeads.map((l) => (
                <tr key={l.id} className="border-t border-white/5">
                  <td className="p-3 font-semibold">{l.name}</td>
                  <td className="p-3">{l.phone}</td>
                  <td className="p-3">{l.project_type || '—'}</td>
                  <td className="p-3"><span className="rounded-full bg-amber/15 px-2 py-1 text-xs text-amber">{l.status}</span></td>
                  <td className="p-3 text-gray-400">{formatDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
