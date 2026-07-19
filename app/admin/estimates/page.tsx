import { AdminShell } from '@/components/admin/AdminShell';

export const metadata = { title: 'Estimates | Prime Layer CRM', robots: { index: false } };

export default function EstimatesPage() {
  return (
    <AdminShell>
      <div className="rounded-lg border border-dashed border-white/15 p-12 text-center text-gray-400">
        <h3 className="mb-2 text-lg font-bold text-white">Estimates — Phase 2</h3>
        <p>Coming next: create estimates, line items, PDF export, and email sending.</p>
      </div>
    </AdminShell>
  );
}
