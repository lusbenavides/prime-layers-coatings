import { AdminShell } from '@/components/admin/AdminShell';
import { DashboardView } from '@/components/admin/DashboardView';

export const metadata = { title: 'Dashboard | Prime Layer CRM', robots: { index: false } };

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <DashboardView />
    </AdminShell>
  );
}
