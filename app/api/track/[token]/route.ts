import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const admin = getSupabaseAdmin();

    const { data: project, error } = await admin
      .from('projects')
      .select('id, title, status, address, start_date, end_date, status_updated_at, updated_at, clients(full_name)')
      .eq('access_token', token)
      .single();

    if (error || !project || project.status === 'cancelled') {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    const { data: projectPhotos } = await admin
      .from('project_photos')
      .select('storage_path, caption, created_at')
      .eq('project_id', project.id)
      .eq('photo_type', 'progress')
      .order('created_at', { ascending: false })
      .limit(6);

    const bucket = admin.storage.from('project-photos');
    const client = (project.clients as unknown as { full_name: string }) ?? null;

    const photos = (projectPhotos ?? []).map((p) => {
      const { data } = bucket.getPublicUrl(p.storage_path);
      return { url: data.publicUrl, caption: p.caption, created_at: p.created_at };
    });

    return NextResponse.json({
      title: project.title,
      status: project.status,
      address: project.address,
      start_date: project.start_date,
      end_date: project.end_date,
      status_updated_at: project.status_updated_at ?? project.updated_at,
      client_name: client?.full_name ?? 'Client',
      photos,
    });
  } catch (err) {
    console.error('track API error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
