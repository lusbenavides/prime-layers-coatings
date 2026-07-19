'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Client, Profile } from '@/types/database';
import { formatDate } from '@/lib/format';
import { AdminShell } from '@/components/admin/AdminShell';

export function ClientsView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Client | null | 'new'>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data }, { data: { user } }] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.auth.getUser(),
    ]);
    setClients((data as Client[]) ?? []);
    if (user) {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(p as Profile);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [c.full_name, c.phone, c.email, c.address].some((v) => v?.toLowerCase().includes(q));
  });

  async function saveClient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const row = {
      full_name: String(fd.get('full_name')),
      phone: String(fd.get('phone')),
      email: String(fd.get('email') || '') || null,
      address: String(fd.get('address') || '') || null,
      notes: String(fd.get('notes') || '') || null,
    };
    const supabase = createClient();
    const { error } = modal && modal !== 'new'
      ? await supabase.from('clients').update(row).eq('id', modal.id)
      : await supabase.from('clients').insert([row]);
    if (error) alert(error.message);
    else { setModal(null); load(); }
  }

  async function deleteClient(id: string) {
    if (!confirm('Delete this client?')) return;
    const { error } = await createClient().from('clients').delete().eq('id', id);
    if (error) alert(error.message);
    else load();
  }

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients…" className="min-w-[200px] flex-1 rounded border border-white/10 bg-navy-card px-4 py-2 text-sm outline-none focus:border-amber" />
        <button type="button" onClick={() => setModal('new')} className="rounded bg-amber px-4 py-2 text-sm font-bold text-navy">+ Add Client</button>
      </div>
      {loading ? <p className="text-gray-400">Loading…</p> : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase text-gray-400">
              <tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Email</th><th className="p-3">Since</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-white/5">
                  <td className="p-3 font-semibold">{c.full_name}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className="p-3">{c.email || '—'}</td>
                  <td className="p-3 text-gray-400">{formatDate(c.created_at)}</td>
                  <td className="p-3 space-x-2">
                    <button type="button" onClick={() => setModal(c)} className="text-xs text-amber">Edit</button>
                    {profile?.role === 'admin' && (
                      <button type="button" onClick={() => deleteClient(c.id)} className="text-xs text-red-400">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModal(null)}>
          <form onSubmit={saveClient} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-xl border border-white/10 bg-navy-card p-6">
            <h3 className="font-bold">{modal === 'new' ? 'New Client' : 'Edit Client'}</h3>
            <input name="full_name" required defaultValue={modal !== 'new' ? modal.full_name : ''} placeholder="Full name" className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm" />
            <input name="phone" required defaultValue={modal !== 'new' ? modal.phone : ''} placeholder="Phone" className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm" />
            <input name="email" type="email" defaultValue={modal !== 'new' ? modal.email ?? '' : ''} placeholder="Email" className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm" />
            <input name="address" defaultValue={modal !== 'new' ? modal.address ?? '' : ''} placeholder="Address" className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm" />
            <textarea name="notes" defaultValue={modal !== 'new' ? modal.notes ?? '' : ''} placeholder="Notes" rows={2} className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="rounded border border-white/15 px-4 py-2 text-sm">Cancel</button>
              <button type="submit" className="rounded bg-amber px-4 py-2 text-sm font-bold text-navy">Save</button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
