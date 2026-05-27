-- ============================================================
-- FIX: Missing job columns + RLS policy blocking admin/employer posts
-- ============================================================

-- 1. Add missing columns to jobs table
alter table public.jobs
  add column if not exists requirements     text,
  add column if not exists responsibilities text,
  add column if not exists apply_method     text not null default 'internal'
    check (apply_method in ('internal','email','url')),
  add column if not exists apply_email      text,
  add column if not exists apply_url        text,
  add column if not exists urgent           boolean not null default false,
  add column if not exists remote_friendly  boolean not null default false,
  add column if not exists created_by_role  text;

-- 2. Fix insert policy: allow employers who own the company OR admins
drop policy if exists "Employers post jobs for own company" on public.jobs;
create policy "Employers or admins post jobs" on public.jobs
  for insert with check (
    auth.uid() = posted_by
    and (
      -- Employer owns the company
      exists (
        select 1 from public.companies c
        where c.id = company_id and c.owner_id = auth.uid()
      )
      -- OR user is admin
      or public.has_role(auth.uid(), 'admin')
    )
  );

-- 3. Fix select policy: also show draft/closed jobs to the poster and admin
drop policy if exists "Published jobs viewable by everyone" on public.jobs;
create policy "Jobs visibility" on public.jobs
  for select using (
    -- Published jobs visible to everyone (no has_role call needed for anon)
    status = 'published'
    -- Poster sees their own jobs regardless of status
    or auth.uid() = posted_by
    -- Admin sees all (only when authenticated)
    or (auth.uid() is not null and public.has_role(auth.uid(), 'admin'))
  );

-- 4. Fix update: employers can update their own jobs
drop policy if exists "Owners or admin update jobs" on public.jobs;
create policy "Owners or admin update jobs" on public.jobs
  for update using (
    auth.uid() = posted_by
    or public.has_role(auth.uid(), 'admin')
  );

-- 5. Indexes for new columns
create index if not exists jobs_apply_method_idx on public.jobs(apply_method);
create index if not exists jobs_urgent_idx       on public.jobs(urgent) where urgent = true;

-- 6. Grants — CRITICAL: anon must be able to call has_role() for RLS
grant execute on function public.has_role(uuid, public.app_role) to anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to service_role;
grant select on public.jobs to anon;
grant select, insert, update, delete on public.jobs to authenticated;
grant select on public.companies to anon;
grant select on public.companies to authenticated;

