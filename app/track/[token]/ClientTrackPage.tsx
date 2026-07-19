'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { TRACK_STEPS, getStepIndex } from '@/lib/project-tracking';
import { formatDate } from '@/lib/format';
import type { ProjectStatus } from '@/types/database';

interface TrackData {
  title: string;
  status: ProjectStatus;
  address?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status_updated_at?: string | null;
  client_name: string;
  photos: { url: string; caption?: string | null; created_at: string }[];
}

export default function ClientTrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<TrackData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/track/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Project not found');
        return res.json();
      })
      .then(setData)
      .catch(() => setError('This tracking link is invalid or the project was removed.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy text-gray-400">
        Loading your project…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy px-6 text-center">
        <p className="text-gray-300">{error}</p>
        <Link href="/" className="text-amber hover:underline">
          ← Back to website
        </Link>
      </div>
    );
  }

  const currentStep = getStepIndex(data.status);
  const firstName = data.client_name.split(' ')[0];

  return (
    <div className="min-h-screen bg-navy text-white">
      <header className="border-b border-white/10 bg-navy/95 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/" className="font-bebas text-xl tracking-widest">
            PRIME LAYER <span className="text-amber">COATINGS</span>
          </Link>
          <a href="tel:7253181411" className="text-sm text-amber">
            725-318-1411
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm text-gray-400">Hi {firstName} 👋</p>
          <h1 className="mt-1 text-2xl font-bold">{data.title}</h1>
          {data.address && <p className="mt-1 text-sm text-gray-400">📍 {data.address}</p>}
          {(data.start_date || data.end_date) && (
            <p className="mt-2 text-sm text-gray-400">
              {data.start_date && formatDate(data.start_date)}
              {data.start_date && data.end_date && ' → '}
              {data.end_date && formatDate(data.end_date)}
            </p>
          )}
        </div>

        <div className="space-y-0">
          {TRACK_STEPS.map((step, idx) => {
            const isDone = currentStep > idx;
            const isCurrent = currentStep === idx;
            const isFuture = currentStep < idx;

            return (
              <div key={step.status} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${
                      isCurrent
                        ? 'bg-amber text-navy ring-4 ring-amber/30'
                        : isDone
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-white/5 text-gray-500'
                    }`}
                  >
                    {isDone ? '✓' : step.icon}
                  </div>
                  {idx < TRACK_STEPS.length - 1 && (
                    <div
                      className={`my-1 min-h-[40px] w-0.5 flex-1 ${
                        isDone ? 'bg-green-500/40' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
                <div className={`pb-8 ${isFuture ? 'opacity-40' : ''}`}>
                  <h3 className={`font-bold ${isCurrent ? 'text-amber' : ''}`}>
                    {step.labelEn}
                    <span className="ml-2 text-sm font-normal text-gray-400">/ {step.labelEs}</span>
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {step.descriptionEn}
                    <span className="mt-1 block text-xs italic">{step.descriptionEs}</span>
                  </p>
                  {isCurrent && data.status_updated_at && (
                    <p className="mt-2 text-xs text-gray-500">
                      Updated {formatDate(data.status_updated_at)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {data.photos.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              Progress Photos / Fotos del avance
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.photos.map((photo) => (
                <div key={photo.url} className="overflow-hidden rounded-lg border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.caption ?? 'Progress'} className="aspect-square w-full object-cover" />
                  {photo.caption && <p className="p-2 text-xs text-gray-400">{photo.caption}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 rounded-lg border border-amber/20 bg-amber/5 p-6 text-center">
          <p className="text-sm text-gray-300">
            Questions? Call us or text anytime.
            <br />
            ¿Preguntas? Llámenos cuando quiera.
          </p>
          <a
            href="tel:7253181411"
            className="mt-3 inline-block rounded bg-amber px-6 py-2.5 font-bold text-navy"
          >
            📞 725-318-1411
          </a>
        </div>
      </main>
    </div>
  );
}
