import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendLeadEmail } from '@/lib/mailer';
import { buildNewLeadSms } from '@/lib/project-tracking';
import { sendSmsSafe } from '@/lib/sms';

async function upsertClient({ name, email, phone }: { name: string; email?: string; phone: string }) {
  const supabase = getSupabaseAdmin();
  const normalizedPhone = phone.replace(/\D/g, '');

  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .or(`phone.eq.${phone},phone.ilike.%${normalizedPhone.slice(-10)}%`)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from('clients')
      .update({ full_name: name, email: email || null, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from('clients')
    .insert([{ full_name: name, email: email || null, phone }])
    .select('id')
    .single();

  if (error) throw error;
  return created.id;
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, projectType, description } = await request.json();

    if (!name || !phone || !projectType) {
      return NextResponse.json(
        { message: 'Nombre, teléfono y tipo de proyecto son requeridos.' },
        { status: 400 }
      );
    }

    let clientId: string | null = null;
    try {
      clientId = await upsertClient({ name, email, phone });
    } catch (clientErr) {
      console.warn('Could not upsert client:', clientErr);
    }

    const leadRow: Record<string, unknown> = {
      name,
      email,
      phone,
      project_type: projectType,
      description,
      source: 'form',
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (clientId) leadRow.client_id = clientId;

    const { error } = await getSupabaseAdmin().from('leads').insert([leadRow]);
    if (error) throw error;

    try {
      await sendLeadEmail({ source: 'form', name, email, phone, projectType, description });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    const companyPhone = process.env.COMPANY_PHONE;
    if (companyPhone) {
      await sendSmsSafe(companyPhone, buildNewLeadSms(name, phone, projectType));
    }

    return NextResponse.json({ success: true, message: 'Cotización registrada exitosamente.' });
  } catch (error) {
    console.error('submit-quote error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor.', error: (error as Error).message },
      { status: 500 }
    );
  }
}
