'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Lead, LeadStatus, Profile } from '@/types/database';
import { formatDate } from '@/lib/format';
import { AdminShell } from '@/components/admin/AdminShell';

const STATUSES: LeadStatus[] = ['new', 'contacted', 'quoted', 'won', 'lost'];

export function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('status', statusFilter);
    const [leadsResult, prof] = await Promise.all([
      query,
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return null;
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        return p as Profile;
      }),
    ]);
    setLeads((leadsResult.data as Lead[]) ?? []);
    setProfile(prof);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = leads.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [l.name, l.phone, l.email, l.project_type, l.description].some((v) => v?.toLowerCase().includes(q));
  });

  async function updateStatus(id: string, status: LeadStatus) {
    const { error } = await createClient().from('leads').update({ status }).eq('id', id);
    if (error) alert(error.message);
    else load();
  }

  async function deleteLead(id: string) {
    if (profile?.role !== 'admin') { alert('Only admins can delete leads.'); return; }
    if (!confirm('Delete this lead?')) return;
    const { error } = await createClient().from('leads').delete().eq('id', id);
    if (error) alert(error.message);
    else load();
  }

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads…"
          className="min-w-[200px] flex-1 rounded border border-white/10 bg-navy-card px-4 py-2 text-sm outline-none focus:border-amber"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-white/10 bg-navy-card px-4 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading ? <p className="text-gray-400">Loading…</p> : filtered.length === 0 ? (
        <p className="text-gray-400">No leads found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase text-gray-400">
              <tr><th className="p-3">Name</th><th className="p-3">Contact</th><th className="p-3">Project</th><th className="p-3">Source</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t border-white/5">
                  <td className="p-3 font-semibold">{l.name}</td>
                  <td className="p-3">{l.phone}<br /><span className="text-gray-400">{l.email}</span></td>
                  <td className="p-3">{l.project_type || '—'}</td>
                  <td className="p-3">{l.source || 'form'}</td>
                  <td className="p-3">
                    <select value={l.status} onChange={(e) => updateStatus(l.id, e.target.value as LeadStatus)} className="rounded border border-white/10 bg-navy-mid px-2 py-1 text-xs">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-gray-400">{formatDate(l.created_at)}</td>
                  <td className="p-3">
                    <button type="button" onClick={() => deleteLead(l.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
