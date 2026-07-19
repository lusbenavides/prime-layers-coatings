'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [configOk, setConfigOk] = useState(true);

  useEffect(() => {
    setConfigOk(isSupabaseConfigured());
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.');
      return;
    }

    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email'));
    const password = String(fd.get('password'));

    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out. Check Supabase URL settings and try again.')), 15000)
      );

      const signIn = createClient().auth.signInWithPassword({ email, password });
      const { data, error: authError } = await Promise.race([signIn, timeout]);

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'Invalid email or password. Create your user in Supabase → Authentication → Users.'
            : authError.message
        );
        return;
      }

      if (!data.session) {
        setError('Login failed — no session returned. Confirm the user exists and is verified in Supabase.');
        return;
      }

      // Hard redirect ensures cookies are applied before admin loads
      window.location.href = '/admin';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-6">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-navy-card p-8">
        <h1 className="font-bebas text-2xl tracking-widest">
          PRIME LAYER <span className="text-amber">COATINGS</span>
        </h1>
        <p className="mb-8 text-sm text-gray-400">Business Manager — Staff login</p>

        {!configOk && (
          <div className="mb-4 rounded border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber">
            Supabase keys missing on this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
            Vercel, then redeploy.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded border border-white/10 bg-navy-mid px-4 py-3 text-white outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded border border-white/10 bg-navy-mid px-4 py-3 text-white outline-none focus:border-amber"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !configOk}
            className="w-full rounded bg-amber py-3 font-bold text-navy hover:bg-amber-lt disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <Link href="/" className="mt-6 inline-block text-sm text-gray-400 hover:text-amber">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
