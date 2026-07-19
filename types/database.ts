export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost';
export type UserRole = 'admin' | 'employee';
export type EstimateStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
export type ProjectStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';

export interface Lead {
  id: string;
  client_id?: string | null;
  name: string;
  email?: string | null;
  phone: string;
  project_type?: string | null;
  description?: string | null;
  source?: string | null;
  status: LeadStatus;
  created_at: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  full_name: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name?: string | null;
  role: UserRole;
}

export interface Estimate {
  id: string;
  client_id: string;
  lead_id?: string | null;
  title: string;
  status: EstimateStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  valid_until?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  clients?: Pick<Client, 'full_name' | 'phone' | 'email' | 'address' | 'city'>;
}

export interface EstimateItem {
  id?: string;
  estimate_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  sort_order: number;
}

export interface Project {
  id: string;
  client_id: string;
  estimate_id?: string | null;
  title: string;
  status: ProjectStatus;
  address?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  clients?: Pick<Client, 'full_name' | 'phone' | 'email'>;
}

export interface Payment {
  id: string;
  project_id: string;
  amount: number;
  status: PaymentStatus;
  method?: string | null;
  paid_at?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface ProjectPhoto {
  id: string;
  project_id: string;
  storage_path: string;
  caption?: string | null;
  photo_type?: string | null;
  created_at: string;
}

export interface LineItemDraft {
  description: string;
  quantity: number;
  unit_price: number;
}

export function calcEstimateTotals(items: LineItemDraft[], taxRate: number) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const tax_amount = subtotal * (taxRate / 100);
  const total = subtotal + tax_amount;
  return { subtotal, tax_amount, total };
}
