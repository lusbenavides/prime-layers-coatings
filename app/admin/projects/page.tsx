import { AdminShell } from '@/components/admin/AdminShell';

export const metadata = { title: 'Projects | Prime Layer CRM', robots: { index: false } };

export default function ProjectsPage() {
  return (
    <AdminShell>
      <div className="rounded-lg border border-dashed border-white/15 p-12 text-center text-gray-400">
        <h3 className="mb-2 text-lg font-bold text-white">Projects — Phase 2</h3>
        <p>Coming next: job tracking, calendar, payments, and photo gallery.</p>
      </div>
    </AdminShell>
  );
}
