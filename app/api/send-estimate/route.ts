import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendEstimateEmail } from '@/lib/mailer';
import { formatDate, formatMoney } from '@/lib/format';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    if (!profile) return NextResponse.json({ message: 'Staff only' }, { status: 403 });

    const { estimateId } = await request.json();
    if (!estimateId) return NextResponse.json({ message: 'estimateId required' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const { data: estimate, error: estError } = await admin
      .from('estimates')
      .select('*, clients(full_name, email)')
      .eq('id', estimateId)
      .single();

    if (estError || !estimate) {
      return NextResponse.json({ message: 'Estimate not found' }, { status: 404 });
    }

    const client = estimate.clients as { full_name: string; email?: string | null } | null;
    if (!client?.email) {
      return NextResponse.json({ message: 'Client has no email address' }, { status: 400 });
    }

    const { data: items } = await admin
      .from('estimate_items')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('sort_order');

    const printUrl = `https://www.primelayercoating.com/admin/estimates/${estimateId}/print`;

    await sendEstimateEmail({
      clientName: client.full_name,
      clientEmail: client.email,
      title: estimate.title,
      total: formatMoney(Number(estimate.total)),
      validUntil: estimate.valid_until ? formatDate(estimate.valid_until) : null,
      items: (items ?? []).map((i) => ({
        description: i.description,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
      })),
      printUrl,
    });

    if (estimate.status === 'draft') {
      await admin.from('estimates').update({ status: 'sent' }).eq('id', estimateId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('send-estimate error:', err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
