-- ============================================================
-- COMPANY POSTS: media, documents, company author
-- ============================================================

-- 1. Extend posts table for company authorship and media
alter table public.posts
  add column if not exists company_author_id uuid
    references public.companies(id) on delete cascade,
  add column if not exists media_urls        text[]   default '{}',
  add column if not exists document_url      text,
  add column if not exists document_name     text;

-- Add company post types
alter table public.posts drop constraint if exists posts_post_type_check;
alter table public.posts
  add constraint posts_post_type_check check (
    post_type in (
      'update', 'achievement', 'job_search', 'hiring', 'article',
      'product', 'service', 'announcement', 'media', 'document'
    )
  );

create index if not exists posts_company_author_id_idx
  on public.posts(company_author_id);

-- 2. Company posts: owner can post on behalf of company
drop policy if exists "Company owners create posts" on public.posts;
create policy "Company owners create posts" on public.posts
  for insert with check (
    auth.uid() = author_id
    and (
      company_author_id is null
      or exists (
        select 1 from public.companies c
        where c.id = company_author_id
          and c.owner_id = auth.uid()
      )
    )
  );

-- Drop old insert policy (replaced above)
drop policy if exists "Authors create posts" on public.posts;

-- Re-add update and delete (unchanged)
drop policy if exists "Authors update own posts" on public.posts;
create policy "Authors update own posts" on public.posts
  for update using (auth.uid() = author_id);

drop policy if exists "Authors delete own posts" on public.posts;
create policy "Authors delete own posts" on public.posts
  for delete using (auth.uid() = author_id);

-- 3. Storage bucket: company-media (images, videos, documents)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-media',
  'company-media',
  true,
  52428800, -- 50 MB
  array[
    'image/jpeg','image/png','image/webp','image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4','video/webm'
  ]
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800;

-- Storage policies for company-media
drop policy if exists "Company owners upload media"    on storage.objects;
drop policy if exists "Company media publicly readable" on storage.objects;
drop policy if exists "Company owners delete media"    on storage.objects;

create policy "Company media publicly readable" on storage.objects
  for select using (bucket_id = 'company-media');

create policy "Company owners upload media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'company-media'
    and (storage.foldername(name))[1] in (
      select id::text from public.companies where owner_id = auth.uid()
    )
  );

create policy "Company owners delete media" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'company-media'
    and (storage.foldername(name))[1] in (
      select id::text from public.companies where owner_id = auth.uid()
    )
  );

-- 4. Company followers count helper
create or replace function public.get_company_follower_count(p_company_id uuid)
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) from public.follows where target_company_id = p_company_id;
$$;

grant execute on function public.get_company_follower_count(uuid) to anon, authenticated;

