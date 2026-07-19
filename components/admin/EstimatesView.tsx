'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type {
  Client,
  Estimate,
  EstimateItem,
  EstimateStatus,
  LineItemDraft,
  Profile,
} from '@/types/database';
import { calcEstimateTotals } from '@/types/database';
import { formatDate, formatMoney, toDateInputValue } from '@/lib/format';
import { AdminShell } from '@/components/admin/AdminShell';

const STATUSES: EstimateStatus[] = ['draft', 'sent', 'approved', 'rejected', 'expired'];
const EMPTY_ITEM: LineItemDraft = { description: '', quantity: 1, unit_price: 0 };

export function EstimatesView() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Estimate | null | 'new'>(null);
  const [items, setItems] = useState<LineItemDraft[]>([{ ...EMPTY_ITEM }]);
  const [taxRate, setTaxRate] = useState(0);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from('estimates')
      .select('*, clients(full_name, phone, email, address, city)')
      .order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('status', statusFilter);

    const [estResult, clientsResult, userResult] = await Promise.all([
      query,
      supabase.from('clients').select('*').order('full_name'),
      supabase.auth.getUser(),
    ]);

    setEstimates((estResult.data as Estimate[]) ?? []);
    setClients((clientsResult.data as Client[]) ?? []);
    if (userResult.data.user) {
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userResult.data.user.id)
        .single();
      setProfile(p as Profile);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = estimates.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [e.title, e.clients?.full_name, e.clients?.phone].some((v) => v?.toLowerCase().includes(q));
  });

  const totals = useMemo(() => calcEstimateTotals(items, taxRate), [items, taxRate]);

  function openNew() {
    setModal('new');
    setItems([{ ...EMPTY_ITEM }]);
    setTaxRate(0);
  }

  async function openEdit(estimate: Estimate) {
    const supabase = createClient();
    const { data } = await supabase
      .from('estimate_items')
      .select('*')
      .eq('estimate_id', estimate.id)
      .order('sort_order');
    setModal(estimate);
    setTaxRate(Number(estimate.tax_rate));
    setItems(
      (data as EstimateItem[])?.length
        ? (data as EstimateItem[]).map((i) => ({
            description: i.description,
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price),
          }))
        : [{ ...EMPTY_ITEM }]
    );
  }

  function updateItem(index: number, field: keyof LineItemDraft, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function saveEstimate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (clients.length === 0) {
      alert('Add a client first.');
      return;
    }
    const validItems = items.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      alert('Add at least one line item.');
      return;
    }

    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const { subtotal, tax_amount, total } = calcEstimateTotals(validItems, taxRate);
    const row = {
      client_id: String(fd.get('client_id')),
      title: String(fd.get('title') || 'Painting Estimate'),
      status: String(fd.get('status')) as EstimateStatus,
      tax_rate: taxRate,
      subtotal,
      tax_amount,
      total,
      valid_until: String(fd.get('valid_until') || '') || null,
      notes: String(fd.get('notes') || '') || null,
    };

    const supabase = createClient();
    let estimateId: string;

    if (modal && modal !== 'new') {
      const { error } = await supabase.from('estimates').update(row).eq('id', modal.id);
      if (error) {
        alert(error.message);
        setSaving(false);
        return;
      }
      estimateId = modal.id;
      await supabase.from('estimate_items').delete().eq('estimate_id', estimateId);
    } else {
      const { data, error } = await supabase.from('estimates').insert([row]).select('id').single();
      if (error || !data) {
        alert(error?.message ?? 'Failed to create estimate');
        setSaving(false);
        return;
      }
      estimateId = data.id;
    }

    const itemRows = validItems.map((item, idx) => ({
      estimate_id: estimateId,
      description: item.description.trim(),
      quantity: item.quantity,
      unit_price: item.unit_price,
      sort_order: idx,
    }));
    const { error: itemsError } = await supabase.from('estimate_items').insert(itemRows);
    if (itemsError) alert(itemsError.message);
    else {
      setModal(null);
      load();
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: EstimateStatus) {
    const { error } = await createClient().from('estimates').update({ status }).eq('id', id);
    if (error) alert(error.message);
    else load();
  }

  async function deleteEstimate(id: string) {
    if (profile?.role !== 'admin') {
      alert('Only admins can delete estimates.');
      return;
    }
    if (!confirm('Delete this estimate?')) return;
    const { error } = await createClient().from('estimates').delete().eq('id', id);
    if (error) alert(error.message);
    else load();
  }

  async function emailEstimate(estimate: Estimate) {
    if (!estimate.clients?.email) {
      alert('This client has no email address. Add one in Clients first.');
      return;
    }
    if (!confirm(`Send estimate to ${estimate.clients.email}?`)) return;
    const res = await fetch('/api/send-estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estimateId: estimate.id }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.message || 'Failed to send');
    else {
      alert('Estimate emailed successfully!');
      load();
    }
  }

  async function convertToProject(estimate: Estimate) {
    if (!confirm(`Create a project from "${estimate.title}"? Client will receive SMS with tracking link.`)) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          client_id: estimate.client_id,
          estimate_id: estimate.id,
          title: estimate.title,
          status: 'scheduled',
          address: estimate.clients?.address ?? null,
        },
      ])
      .select('id')
      .single();
    if (error) alert(error.message);
    else {
      await supabase.from('estimates').update({ status: 'approved' }).eq('id', estimate.id);
      if (data?.id) {
        await fetch('/api/notify-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: data.id, type: 'welcome' }),
        });
      }
      alert('Project created! Client notified by SMS if configured.');
      load();
    }
  }

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search estimates…"
          className="min-w-[200px] flex-1 rounded border border-white/10 bg-navy-card px-4 py-2 text-sm outline-none focus:border-amber"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-white/10 bg-navy-card px-4 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={openNew}
          className="rounded bg-amber px-4 py-2 text-sm font-bold text-navy"
        >
          + New Estimate
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400">No estimates yet. Create one for a client.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase text-gray-400">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Client</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Valid Until</th>
                <th className="p-3">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-white/5">
                  <td className="p-3 font-semibold">{e.title}</td>
                  <td className="p-3">
                    {e.clients?.full_name ?? '—'}
                    <br />
                    <span className="text-gray-400">{e.clients?.phone}</span>
                  </td>
                  <td className="p-3 font-semibold text-amber">{formatMoney(Number(e.total))}</td>
                  <td className="p-3">
                    <select
                      value={e.status}
                      onChange={(ev) => updateStatus(e.id, ev.target.value as EstimateStatus)}
                      className="rounded border border-white/10 bg-navy-mid px-2 py-1 text-xs capitalize"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-gray-400">{formatDate(e.valid_until)}</td>
                  <td className="p-3 text-gray-400">{formatDate(e.created_at)}</td>
                  <td className="p-3 space-x-2 whitespace-nowrap">
                    <button type="button" onClick={() => openEdit(e)} className="text-xs text-amber">
                      Edit
                    </button>
                    <Link href={`/admin/estimates/${e.id}/print`} className="text-xs text-blue-400">
                      PDF
                    </Link>
                    {e.clients?.email && (
                      <button type="button" onClick={() => emailEstimate(e)} className="text-xs text-purple-400">
                        Email
                      </button>
                    )}
                    {e.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => convertToProject(e)}
                        className="text-xs text-green-400"
                      >
                        → Project
                      </button>
                    )}
                    {profile?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => deleteEstimate(e.id)}
                        className="text-xs text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-8"
          onClick={() => setModal(null)}
        >
          <form
            onSubmit={saveEstimate}
            onClick={(ev) => ev.stopPropagation()}
            className="mb-8 w-full max-w-2xl space-y-4 rounded-xl border border-white/10 bg-navy-card p-6"
          >
            <h3 className="font-bold">{modal === 'new' ? 'New Estimate' : 'Edit Estimate'}</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs uppercase text-gray-400">Client</label>
                <select
                  name="client_id"
                  required
                  defaultValue={modal !== 'new' ? modal.client_id : ''}
                  className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm"
                >
                  <option value="">Select client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} — {c.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase text-gray-400">Status</label>
                <select
                  name="status"
                  defaultValue={modal !== 'new' ? modal.status : 'draft'}
                  className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm capitalize"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <input
              name="title"
              defaultValue={modal !== 'new' ? modal.title : 'Painting Estimate'}
              placeholder="Title"
              className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs uppercase text-gray-400">Valid Until</label>
                <input
                  name="valid_until"
                  type="date"
                  defaultValue={modal !== 'new' ? toDateInputValue(modal.valid_until) : ''}
                  className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase text-gray-400">Tax Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={taxRate}
                  onChange={(ev) => setTaxRate(Number(ev.target.value))}
                  className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs uppercase text-gray-400">Line Items</label>
                <button type="button" onClick={addItem} className="text-xs text-amber">
                  + Add row
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <input
                      value={item.description}
                      onChange={(ev) => updateItem(idx, 'description', ev.target.value)}
                      placeholder="Description"
                      className="col-span-6 rounded border border-white/10 bg-navy-mid px-2 py-1.5 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.quantity}
                      onChange={(ev) => updateItem(idx, 'quantity', Number(ev.target.value))}
                      placeholder="Qty"
                      className="col-span-2 rounded border border-white/10 bg-navy-mid px-2 py-1.5 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unit_price}
                      onChange={(ev) => updateItem(idx, 'unit_price', Number(ev.target.value))}
                      placeholder="Price"
                      className="col-span-3 rounded border border-white/10 bg-navy-mid px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="col-span-1 text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded border border-white/10 bg-navy-mid/50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span>{formatMoney(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tax ({taxRate}%)</span>
                <span>{formatMoney(totals.tax_amount)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-white/10 pt-2 font-bold text-amber">
                <span>Total</span>
                <span>{formatMoney(totals.total)}</span>
              </div>
            </div>

            <textarea
              name="notes"
              defaultValue={modal !== 'new' ? modal.notes ?? '' : ''}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded border border-white/15 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-amber px-4 py-2 text-sm font-bold text-navy disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Estimate'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
