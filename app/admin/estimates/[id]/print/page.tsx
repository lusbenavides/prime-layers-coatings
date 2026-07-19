'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Client, Estimate, EstimateItem } from '@/types/database';
import { formatDate, formatMoney } from '@/lib/format';

export default function EstimatePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('estimates').select('*').eq('id', id).single(),
      supabase.from('estimate_items').select('*').eq('estimate_id', id).order('sort_order'),
    ]).then(async ([estRes, itemsRes]) => {
      const est = estRes.data as Estimate;
      setEstimate(est);
      setItems((itemsRes.data as EstimateItem[]) ?? []);
      if (est?.client_id) {
        const { data } = await supabase.from('clients').select('*').eq('id', est.client_id).single();
        setClient(data as Client);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-gray-600">
        Loading estimate…
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-gray-800">
        <p>Estimate not found.</p>
        <Link href="/admin/estimates" className="text-amber underline">
          Back to estimates
        </Link>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      <div className="no-print fixed left-0 right-0 top-0 z-10 flex items-center justify-between border-b bg-navy px-6 py-3 text-white">
        <Link href="/admin/estimates" className="text-sm text-gray-300 hover:text-amber">
          ← Back to Estimates
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded bg-amber px-4 py-2 text-sm font-bold text-navy"
        >
          Download / Print PDF
        </button>
      </div>

      <div className="mx-auto max-w-3xl bg-white px-8 py-12 pt-20 text-gray-900 print:pt-8">
        <header className="mb-8 flex items-start justify-between border-b-2 border-amber pb-6">
          <div>
            <h1 className="font-bebas text-3xl tracking-widest text-navy">
              PRIME LAYER <span className="text-amber">COATINGS</span>
            </h1>
            <p className="text-sm text-gray-600">Licensed & Insured · Las Vegas, NV</p>
            <p className="text-sm text-gray-600">725-318-1411 · primelayercoating@gmail.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold uppercase text-navy">Estimate</h2>
            <p className="text-sm text-gray-500">#{estimate.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-sm text-gray-500">{formatDate(estimate.created_at)}</p>
            <span className="mt-1 inline-block rounded bg-amber/15 px-2 py-0.5 text-xs font-semibold uppercase text-amber">
              {estimate.status}
            </span>
          </div>
        </header>

        <div className="mb-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Prepared For</h3>
            <p className="font-semibold">{client?.full_name ?? '—'}</p>
            {client?.phone && <p className="text-sm">{client.phone}</p>}
            {client?.email && <p className="text-sm">{client.email}</p>}
            {client?.address && (
              <p className="text-sm">
                {client.address}
                {client.city ? `, ${client.city}` : ''}
              </p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Estimate Details</h3>
            <p className="font-semibold">{estimate.title}</p>
            {estimate.valid_until && (
              <p className="text-sm">Valid until: {formatDate(estimate.valid_until)}</p>
            )}
          </div>
        </div>

        <table className="mb-8 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-navy text-left text-xs uppercase text-gray-500">
              <th className="pb-2 pr-4">Description</th>
              <th className="pb-2 pr-4 text-right">Qty</th>
              <th className="pb-2 pr-4 text-right">Unit Price</th>
              <th className="pb-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3 pr-4">{item.description}</td>
                <td className="py-3 pr-4 text-right">{Number(item.quantity)}</td>
                <td className="py-3 pr-4 text-right">{formatMoney(Number(item.unit_price))}</td>
                <td className="py-3 text-right font-medium">
                  {formatMoney(Number(item.quantity) * Number(item.unit_price))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatMoney(Number(estimate.subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tax ({Number(estimate.tax_rate)}%)</span>
            <span>{formatMoney(Number(estimate.tax_amount))}</span>
          </div>
          <div className="flex justify-between border-t-2 border-navy pt-2 text-lg font-bold text-navy">
            <span>Total</span>
            <span className="text-amber">{formatMoney(Number(estimate.total))}</span>
          </div>
        </div>

        {estimate.notes && (
          <div className="mt-8 rounded border border-gray-200 bg-gray-50 p-4 text-sm">
            <h3 className="mb-1 text-xs font-bold uppercase text-gray-500">Notes</h3>
            <p className="whitespace-pre-wrap">{estimate.notes}</p>
          </div>
        )}

        <footer className="mt-12 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          Thank you for choosing Prime Layer Coatings LLC. This estimate is subject to on-site verification.
        </footer>
      </div>
    </>
  );
}
