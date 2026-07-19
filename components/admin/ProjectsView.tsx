'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  Client,
  Payment,
  PaymentStatus,
  Profile,
  Project,
  ProjectPhoto,
  ProjectStatus,
} from '@/types/database';
import { formatDate, formatMoney, toDateInputValue } from '@/lib/format';
import { getTrackUrl } from '@/lib/project-tracking';
import { AdminShell } from '@/components/admin/AdminShell';

const STATUSES: ProjectStatus[] = ['scheduled', 'in_progress', 'finishing', 'completed', 'cancelled'];
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'partial', 'paid', 'refunded'];
const PHOTO_BUCKET = 'project-photos';

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type ViewMode = 'list' | 'calendar';

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Project | null | 'new'>(null);
  const [detail, setDetail] = useState<Project | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from('projects')
      .select('*, clients(full_name, phone, email)')
      .order('start_date', { ascending: true, nullsFirst: false });
    if (statusFilter) query = query.eq('status', statusFilter);

    const [projResult, clientsResult, userResult] = await Promise.all([
      query,
      supabase.from('clients').select('*').order('full_name'),
      supabase.auth.getUser(),
    ]);

    setProjects((projResult.data as Project[]) ?? []);
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

  const filtered = projects.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [p.title, p.clients?.full_name, p.address].some((v) => v?.toLowerCase().includes(q));
  });

  async function loadDetail(project: Project) {
    setDetail(project);
    const supabase = createClient();
    const [payRes, photoRes] = await Promise.all([
      supabase.from('payments').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
      supabase.from('project_photos').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
    ]);
    setPayments((payRes.data as Payment[]) ?? []);
    setPhotos((photoRes.data as ProjectPhoto[]) ?? []);
  }

  async function saveProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const row = {
      client_id: String(fd.get('client_id')),
      title: String(fd.get('title')),
      status: String(fd.get('status')) as ProjectStatus,
      address: String(fd.get('address') || '') || null,
      start_date: String(fd.get('start_date') || '') || null,
      end_date: String(fd.get('end_date') || '') || null,
      notes: String(fd.get('notes') || '') || null,
    };
    const supabase = createClient();
    if (modal && modal !== 'new') {
      const { error } = await supabase.from('projects').update(row).eq('id', modal.id);
      if (error) alert(error.message);
      else {
        setModal(null);
        load();
        await notifyClient(modal.id, 'status', row.status as ProjectStatus);
      }
    } else {
      const { data, error } = await supabase.from('projects').insert([row]).select('id').single();
      if (error) alert(error.message);
      else {
        setModal(null);
        load();
        if (data?.id) await notifyClient(data.id, 'welcome');
      }
    }
  }

  async function notifyClient(projectId: string, type: 'welcome' | 'status', status?: ProjectStatus) {
    const res = await fetch('/api/notify-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, type, status }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status !== 503) alert(data.message || 'SMS failed');
      return null;
    }
    return data.trackUrl as string;
  }

  async function updateStatus(id: string, status: ProjectStatus) {
    const { error } = await createClient().from('projects').update({ status }).eq('id', id);
    if (error) alert(error.message);
    else {
      await notifyClient(id, 'status', status);
      load();
      if (detail?.id === id) {
        setDetail({ ...detail, status });
      }
    }
  }

  async function deleteProject(id: string) {
    if (profile?.role !== 'admin') {
      alert('Only admins can delete projects.');
      return;
    }
    if (!confirm('Delete this project?')) return;
    const { error } = await createClient().from('projects').delete().eq('id', id);
    if (error) alert(error.message);
    else {
      setDetail(null);
      load();
    }
  }

  async function addPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!detail) return;
    const fd = new FormData(e.currentTarget);
    const { error } = await createClient().from('payments').insert([
      {
        project_id: detail.id,
        amount: Number(fd.get('amount')),
        status: String(fd.get('status')) as PaymentStatus,
        method: String(fd.get('method') || '') || null,
        paid_at: String(fd.get('paid_at') || '') || null,
        notes: String(fd.get('notes') || '') || null,
      },
    ]);
    if (error) alert(error.message);
    else {
      e.currentTarget.reset();
      loadDetail(detail);
    }
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!detail || !e.target.files?.length) return;
    setUploading(true);
    const file = e.target.files[0];
    const path = `${detail.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file);
    if (uploadError) {
      alert(uploadError.message);
      setUploading(false);
      return;
    }
    const { error } = await supabase.from('project_photos').insert([
      { project_id: detail.id, storage_path: path, photo_type: 'progress' },
    ]);
    if (error) alert(error.message);
    else loadDetail(detail);
    setUploading(false);
    e.target.value = '';
  }

  async function deletePhoto(photo: ProjectPhoto) {
    if (!confirm('Delete this photo?')) return;
    const supabase = createClient();
    await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
    const { error } = await supabase.from('project_photos').delete().eq('id', photo.id);
    if (error) alert(error.message);
    else if (detail) loadDetail(detail);
  }

  function photoUrl(path: string) {
    const supabase = createClient();
    const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const days: (Date | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }, [calendarMonth]);

  const projectsByDate = useMemo(() => {
    const map = new Map<string, Project[]>();
    projects.forEach((p) => {
      if (!p.start_date) return;
      const key = p.start_date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [projects]);

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
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
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <div className="flex rounded border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-amber text-navy' : 'text-gray-300'}`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-2 text-sm ${viewMode === 'calendar' ? 'bg-amber text-navy' : 'text-gray-300'}`}
          >
            Calendar
          </button>
        </div>
        <button
          type="button"
          onClick={() => setModal('new')}
          className="rounded bg-amber px-4 py-2 text-sm font-bold text-navy"
        >
          + New Project
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : viewMode === 'calendar' ? (
        <div className="rounded-lg border border-white/10 bg-navy-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
              className="rounded border border-white/10 px-3 py-1 text-sm"
            >
              ←
            </button>
            <h3 className="font-bold">
              {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
              className="rounded border border-white/10 px-3 py-1 text-sm"
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2 font-bold uppercase text-gray-400">
                {d}
              </div>
            ))}
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const key = dateKey(day);
              const dayProjects = projectsByDate.get(key) ?? [];
              return (
                <div
                  key={key}
                  className={`min-h-[80px] rounded border p-1 text-left ${
                    dayProjects.length ? 'border-amber/30 bg-amber/5' : 'border-white/5'
                  }`}
                >
                  <div className="text-xs font-semibold text-gray-400">{day.getDate()}</div>
                  {dayProjects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => loadDetail(p)}
                      className="mt-0.5 block w-full truncate rounded bg-amber/20 px-1 py-0.5 text-left text-[10px] text-amber"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400">No projects yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase text-gray-400">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Client</th>
                <th className="p-3">Status</th>
                <th className="p-3">Start</th>
                <th className="p-3">End</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-white/5">
                  <td className="p-3 font-semibold">{p.title}</td>
                  <td className="p-3">{p.clients?.full_name ?? '—'}</td>
                  <td className="p-3">
                    <select
                      value={p.status}
                      onChange={(ev) => updateStatus(p.id, ev.target.value as ProjectStatus)}
                      className="rounded border border-white/10 bg-navy-mid px-2 py-1 text-xs capitalize"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-gray-400">{formatDate(p.start_date)}</td>
                  <td className="p-3 text-gray-400">{formatDate(p.end_date)}</td>
                  <td className="p-3 space-x-2 whitespace-nowrap">
                    <button type="button" onClick={() => loadDetail(p)} className="text-xs text-amber">
                      Details
                    </button>
                    <button type="button" onClick={() => setModal(p)} className="text-xs text-blue-400">
                      Edit
                    </button>
                    {profile?.role === 'admin' && (
                      <button type="button" onClick={() => deleteProject(p.id)} className="text-xs text-red-400">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setModal(null)}
        >
          <form
            onSubmit={saveProject}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-xl border border-white/10 bg-navy-card p-6"
          >
            <h3 className="font-bold">{modal === 'new' ? 'New Project' : 'Edit Project'}</h3>
            <select
              name="client_id"
              required
              defaultValue={modal !== 'new' ? modal.client_id : ''}
              className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm"
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
            <input
              name="title"
              required
              defaultValue={modal !== 'new' ? modal.title : ''}
              placeholder="Project title"
              className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm"
            />
            <select
              name="status"
              defaultValue={modal !== 'new' ? modal.status : 'scheduled'}
              className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm capitalize"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
            <input
              name="address"
              defaultValue={modal !== 'new' ? modal.address ?? '' : ''}
              placeholder="Job site address"
              className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                name="start_date"
                type="date"
                defaultValue={modal !== 'new' ? toDateInputValue(modal.start_date) : ''}
                className="rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm"
              />
              <input
                name="end_date"
                type="date"
                defaultValue={modal !== 'new' ? toDateInputValue(modal.end_date) : ''}
                className="rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm"
              />
            </div>
            <textarea
              name="notes"
              defaultValue={modal !== 'new' ? modal.notes ?? '' : ''}
              placeholder="Notes"
              rows={2}
              className="w-full rounded border border-white/10 bg-navy-mid px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="rounded border border-white/15 px-4 py-2 text-sm">
                Cancel
              </button>
              <button type="submit" className="rounded bg-amber px-4 py-2 text-sm font-bold text-navy">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-8"
          onClick={() => setDetail(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mb-8 w-full max-w-3xl space-y-6 rounded-xl border border-white/10 bg-navy-card p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{detail.title}</h3>
                <p className="text-sm text-gray-400">
                  {detail.clients?.full_name} · {detail.clients?.phone}
                </p>
                <span className="mt-1 inline-block rounded-full bg-amber/15 px-2 py-0.5 text-xs capitalize text-amber">
                  {detail.status.replace('_', ' ')}
                </span>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-gray-400">Address:</span> {detail.address || '—'}
              </div>
              <div>
                <span className="text-gray-400">Dates:</span> {formatDate(detail.start_date)} →{' '}
                {formatDate(detail.end_date)}
              </div>
            </div>

            {detail.access_token && (
              <section className="rounded-lg border border-amber/20 bg-amber/5 p-4">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber">
                  Client Portal / Panel del cliente
                </h4>
                <p className="mb-3 text-xs text-gray-400">
                  Share this link so your client can track progress. SMS is sent automatically on status changes.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    readOnly
                    value={getTrackUrl(detail.access_token)}
                    className="min-w-0 flex-1 rounded border border-white/10 bg-navy-mid px-3 py-2 text-xs text-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getTrackUrl(detail.access_token!));
                      alert('Link copied!');
                    }}
                    className="rounded border border-white/15 px-3 py-2 text-xs"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const url = await notifyClient(detail.id, 'welcome');
                      if (url) alert('Welcome SMS sent with tracking link!');
                    }}
                    className="rounded bg-amber px-3 py-2 text-xs font-bold text-navy"
                  >
                    📱 Send SMS
                  </button>
                </div>
              </section>
            )}

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Payments · {formatMoney(totalPaid)} collected
                </h4>
              </div>
              {payments.length > 0 && (
                <div className="mb-3 overflow-x-auto rounded border border-white/10">
                  <table className="w-full text-sm">
                    <tbody>
                      {payments.map((pay) => (
                        <tr key={pay.id} className="border-t border-white/5 first:border-0">
                          <td className="p-2 font-semibold text-amber">{formatMoney(Number(pay.amount))}</td>
                          <td className="p-2 capitalize">{pay.status}</td>
                          <td className="p-2 text-gray-400">{pay.method || '—'}</td>
                          <td className="p-2 text-gray-400">{formatDate(pay.paid_at ?? pay.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <form onSubmit={addPayment} className="grid gap-2 sm:grid-cols-5">
                <input
                  name="amount"
                  type="number"
                  min={0}
                  step={0.01}
                  required
                  placeholder="Amount"
                  className="rounded border border-white/10 bg-navy-mid px-2 py-1.5 text-sm sm:col-span-1"
                />
                <select
                  name="status"
                  defaultValue="paid"
                  className="rounded border border-white/10 bg-navy-mid px-2 py-1.5 text-sm sm:col-span-1"
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  name="method"
                  placeholder="Method (cash, check…)"
                  className="rounded border border-white/10 bg-navy-mid px-2 py-1.5 text-sm sm:col-span-1"
                />
                <input
                  name="paid_at"
                  type="date"
                  className="rounded border border-white/10 bg-navy-mid px-2 py-1.5 text-sm sm:col-span-1"
                />
                <button type="submit" className="rounded bg-amber px-2 py-1.5 text-sm font-bold text-navy sm:col-span-1">
                  Add
                </button>
              </form>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Photos</h4>
                <label className="cursor-pointer rounded border border-amber/30 px-3 py-1 text-xs text-amber hover:bg-amber/10">
                  {uploading ? 'Uploading…' : '+ Upload photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} disabled={uploading} />
                </label>
              </div>
              {photos.length === 0 ? (
                <p className="text-sm text-gray-500">No photos yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="group relative overflow-hidden rounded border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoUrl(photo.storage_path)} alt={photo.caption ?? 'Project photo'} className="aspect-square w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => deletePhoto(photo)}
                        className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-red-300 opacity-0 group-hover:opacity-100"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
