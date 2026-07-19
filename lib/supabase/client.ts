import { createBrowserClient } from '@supabase/ssr';

function normalizeSupabaseUrl(raw?: string) {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  // Common mistake: pasting only "xxxx.supabase.co" without https://
  if (trimmed.includes('supabase.co')) return `https://${trimmed.replace(/^\/+/, '')}`;
  return trimmed;
}

export function isSupabaseConfigured() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
  return Boolean(url.startsWith('https://') && key.startsWith('eyJ'));
}

export function createClient() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.');
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(
      'Invalid Supabase URL. In Vercel set NEXT_PUBLIC_SUPABASE_URL to https://YOUR-PROJECT.supabase.co'
    );
  }
  if (!key.startsWith('eyJ')) {
    throw new Error('Invalid anon key. Use the anon public key (starts with eyJ...) from Supabase → API.');
  }

  return createBrowserClient(url, key);
}
