-- ============================================
-- 13. HOMEWORK STORAGE BUCKET
-- ============================================

-- Create the bucket for homework attachments if it doesn't exist
insert into storage.buckets (id, name, public)
values ('homework-attachments', 'homework-attachments', true)
on conflict (id) do nothing;

-- Enable RLS on the bucket objects
alter table storage.objects enable row level security;

-- Drop existing policies if any (for idempotency)
drop policy if exists "Public access to homework attachments" on storage.objects;
drop policy if exists "Staff can upload homework attachments" on storage.objects;

-- Policy 1: Anyone (including anonymous) can read from the public bucket
create policy "Public access to homework attachments"
on storage.objects for select
using (bucket_id = 'homework-attachments');

-- Policy 2: Authenticated staff can insert into the bucket
create policy "Staff can upload homework attachments"
on storage.objects for insert
to authenticated
with check (bucket_id = 'homework-attachments');
