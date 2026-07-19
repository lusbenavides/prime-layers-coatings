'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const { error: authError } = await createClient().auth.signInWithPassword({
      email: String(fd.get('email')),
      password: String(fd.get('password')),
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-6">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-navy-card p-8">
        <h1 className="font-bebas text-2xl tracking-widest">PRIME LAYER <span className="text-amber">COATINGS</span></h1>
        <p className="mb-8 text-sm text-gray-400">Business Manager — Staff login</p>
        {error && <div className="mb-4 rounded border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">Email</label>
            <input name="email" type="email" required className="w-full rounded border border-white/10 bg-navy-mid px-4 py-3 text-white outline-none focus:border-amber" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">Password</label>
            <input name="password" type="password" required className="w-full rounded border border-white/10 bg-navy-mid px-4 py-3 text-white outline-none focus:border-amber" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded bg-amber py-3 font-bold text-navy hover:bg-amber-lt disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <Link href="/" className="mt-6 inline-block text-sm text-gray-400 hover:text-amber">← Back to website</Link>
      </div>
    </div>
  );
}
