-- Supabase Storage bucket for project photos
-- Run in Supabase SQL Editor after 001_crm_schema.sql

insert into storage.buckets (id, name, public)
values ('project-photos', 'project-photos', true)
on conflict (id) do nothing;

-- Staff can upload/read/delete project photos
drop policy if exists "Staff upload project photos" on storage.objects;
create policy "Staff upload project photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-photos' and public.is_staff());

drop policy if exists "Staff read project photos" on storage.objects;
create policy "Staff read project photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'project-photos' and public.is_staff());

drop policy if exists "Staff delete project photos" on storage.objects;
create policy "Staff delete project photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-photos' and public.is_staff());

-- Public read for displaying photos in admin (bucket is public)
drop policy if exists "Public read project photos" on storage.objects;
create policy "Public read project photos" on storage.objects
  for select to anon
  using (bucket_id = 'project-photos');
