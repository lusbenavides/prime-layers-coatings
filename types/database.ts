export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost';
export type UserRole = 'admin' | 'employee';

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
