import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { buildStatusSms, buildWelcomeSms, getTrackUrl } from '@/lib/project-tracking';
import { sendSmsSafe } from '@/lib/sms';
import type { ProjectStatus } from '@/types/database';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    if (!profile) return NextResponse.json({ message: 'Staff only' }, { status: 403 });

    const { projectId, type, status } = await request.json();
    if (!projectId) return NextResponse.json({ message: 'projectId required' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const { data: project, error } = await admin
      .from('projects')
      .select('title, status, access_token, clients(full_name, phone)')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    const client = (project.clients as unknown as { full_name: string; phone: string }) ?? null;
    if (!client?.phone) {
      return NextResponse.json({ message: 'Client has no phone number' }, { status: 400 });
    }

    const trackUrl = getTrackUrl(project.access_token);
    const notifyStatus = (status ?? project.status) as ProjectStatus;
    const body =
      type === 'welcome'
        ? buildWelcomeSms(client.full_name, project.title, trackUrl)
        : buildStatusSms(notifyStatus, client.full_name, project.title, trackUrl);

    const result = await sendSmsSafe(client.phone, body);
    if (!result.ok) {
      return NextResponse.json(
        {
          message:
            result.reason === 'not_configured'
              ? 'SMS not configured — add Twilio vars in Vercel'
              : 'Failed to send SMS',
        },
        { status: result.reason === 'not_configured' ? 503 : 500 }
      );
    }

    return NextResponse.json({ ok: true, trackUrl });
  } catch (err) {
    console.error('notify-project error:', err);
    return NextResponse.json({ message: 'Failed to notify' }, { status: 500 });
  }
}
