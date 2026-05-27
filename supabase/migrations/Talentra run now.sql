-- ============================================================
-- TALENTRA: Run migrations 4 + 5
-- Safe to run on a database that already has migrations 1-3 applied
-- ============================================================


-- ============================================================
-- MIGRATION 4: Extended profile fields + contact messages
-- ============================================================

alter table public.profiles
  add column if not exists skills        text[] default '{}',
  add column if not exists experience    text[] default '{}',
  add column if not exists education     text[] default '{}',
  add column if not exists portfolio_url text,
  add column if not exists resume_url    text;

comment on column public.profiles.skills     is 'Array of skill strings for the job seeker';
comment on column public.profiles.resume_url is 'Public URL to the uploaded resume file';

create table if not exists public.contact_messages (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  email      text        not null,
  message    text        not null,
  created_at timestamptz not null default now(),
  read       boolean     not null default false
);

alter table public.contact_messages enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'contact_messages' and policyname = 'Admins can read contact messages') then
    create policy "Admins can read contact messages" on public.contact_messages
      for select using (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

create or replace function public.increment_job_views(job_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.jobs set views_count = views_count + 1 where id = job_id;
$$;


-- ============================================================
-- MIGRATION 5: Security & reliability hardening
-- ============================================================


-- 1. Fix has_role() execute permissions
--    (critical: was broken for all authenticated users)
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to service_role;
revoke execute on function public.handle_new_user() from anon, authenticated;


-- 2. Rewrite handle_new_user() — blocks admin self-assignment via signup metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _requested_role text;
  _safe_role      public.app_role;
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  _requested_role := lower(trim(new.raw_user_meta_data->>'role'));
  _safe_role := case
    when _requested_role = 'employer' then 'employer'::public.app_role
    else 'job_seeker'::public.app_role
  end;

  insert into public.user_roles (user_id, role)
  values (new.id, _safe_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Auto-creates profile and role on signup. Admin role cannot be self-assigned.';


-- 3. Performance indexes
create index if not exists companies_owner_id_idx         on public.companies(owner_id);
create index if not exists applications_applicant_id_idx  on public.applications(applicant_id);
create index if not exists applications_job_id_idx        on public.applications(job_id);
create index if not exists saved_jobs_user_id_idx         on public.saved_jobs(user_id);
create index if not exists saved_jobs_job_id_idx          on public.saved_jobs(job_id);
create index if not exists user_roles_user_id_idx         on public.user_roles(user_id);
create index if not exists jobs_posted_by_idx             on public.jobs(posted_by);
create index if not exists jobs_company_id_idx            on public.jobs(company_id);
create index if not exists jobs_created_at_idx            on public.jobs(created_at desc);
create index if not exists job_reports_reporter_id_idx    on public.job_reports(reporter_id);
create index if not exists contact_messages_email_idx     on public.contact_messages(email);
create index if not exists contact_messages_created_at_idx on public.contact_messages(created_at desc);


-- 4. Data integrity constraints (using DO blocks — ADD CONSTRAINT IF NOT EXISTS
--    is not supported in PostgreSQL, so we check pg_constraint first)

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'jobs_salary_range_check') then
    alter table public.jobs add constraint jobs_salary_range_check
      check (salary_min is null or salary_max is null or salary_min <= salary_max);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'jobs_salary_positive_check') then
    alter table public.jobs add constraint jobs_salary_positive_check
      check ((salary_min is null or salary_min >= 0) and (salary_max is null or salary_max >= 0));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'jobs_currency_check') then
    alter table public.jobs add constraint jobs_currency_check
      check (currency is null or currency = any(array['TZS','USD','EUR','GBP','KES','UGX','RWF','ZAR']));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'jobs_title_check') then
    alter table public.jobs add constraint jobs_title_check
      check (char_length(trim(title)) >= 3 and char_length(title) <= 200);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'jobs_description_check') then
    alter table public.jobs add constraint jobs_description_check
      check (char_length(trim(description)) >= 30);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'companies_name_check') then
    alter table public.companies add constraint companies_name_check
      check (char_length(trim(name)) >= 2 and char_length(name) <= 200);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'companies_website_check') then
    alter table public.companies add constraint companies_website_check
      check (website is null or website ~* '^https?://[^\s]+$');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_full_name_check') then
    alter table public.profiles add constraint profiles_full_name_check
      check (full_name is null or (char_length(trim(full_name)) >= 1 and char_length(full_name) <= 200));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'applications_cover_letter_check') then
    alter table public.applications add constraint applications_cover_letter_check
      check (cover_letter is null or char_length(cover_letter) <= 5000);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'contact_messages_name_check') then
    alter table public.contact_messages add constraint contact_messages_name_check
      check (char_length(trim(name)) >= 2 and char_length(name) <= 100);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'contact_messages_email_check') then
    alter table public.contact_messages add constraint contact_messages_email_check
      check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 255);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'contact_messages_message_check') then
    alter table public.contact_messages add constraint contact_messages_message_check
      check (char_length(trim(message)) >= 10 and char_length(message) <= 2000);
  end if;
end $$;


-- 5. Prevent duplicate reports from same user on same job
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'job_reports_unique_reporter') then
    alter table public.job_reports add constraint job_reports_unique_reporter
      unique (job_id, reporter_id);
  end if;
end $$;


-- 6. Auto updated_at trigger on profiles
create or replace function public.set_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- 7. Harden increment_job_views — only affects published jobs
create or replace function public.increment_job_views(job_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.jobs
  set views_count = views_count + 1
  where id = job_id and status = 'published';
$$;

grant execute on function public.increment_job_views(uuid) to anon, authenticated;


-- 8. Contact messages insert policy (rate-limit: 3 per email per day)
drop policy if exists "Anyone can submit contact message"  on public.contact_messages;
drop policy if exists "Rate-limited contact submissions"   on public.contact_messages;
create policy "Rate-limited contact submissions" on public.contact_messages
  for insert with check (
    char_length(trim(name)) >= 2
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and char_length(trim(message)) >= 10
    and (
      select count(*) from public.contact_messages cm
      where cm.email = contact_messages.email
        and cm.created_at > now() - interval '24 hours'
    ) < 3
  );


-- 9. Applications: only to published, non-expired jobs
drop policy if exists "Users apply to jobs"          on public.applications;
drop policy if exists "Users apply to open jobs only" on public.applications;
create policy "Users apply to open jobs only" on public.applications
  for insert with check (
    auth.uid() = applicant_id
    and exists (
      select 1 from public.jobs j
      where j.id = job_id
        and j.status = 'published'
        and (j.deadline is null or j.deadline >= current_date)
    )
  );


-- 10. Full-text search vector on jobs
alter table public.jobs
  add column if not exists search_vector tsvector
    generated always as (
      to_tsvector('english',
        coalesce(title, '')       || ' ' ||
        coalesce(location, '')    || ' ' ||
        coalesce(region, '')      || ' ' ||
        coalesce(industry, '')    || ' ' ||
        coalesce(description, '')
      )
    ) stored;

create index if not exists jobs_search_idx on public.jobs using gin(search_vector);


-- 11. Grants
grant select on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant insert on public.user_roles to authenticated;
grant select on public.companies to anon;
grant select, insert, update, delete on public.companies to authenticated;
grant select on public.jobs to anon;
grant select, insert, update, delete on public.jobs to authenticated;
grant select, insert, update on public.applications to authenticated;
grant select, insert, delete on public.saved_jobs to authenticated;
grant select, insert, delete on public.job_reports to authenticated;
grant insert on public.contact_messages to anon;
grant insert on public.contact_messages to authenticated;
grant usage on type public.app_role            to authenticated;
grant usage on type public.position_level      to authenticated;
grant usage on type public.contract_type       to authenticated;
grant usage on type public.qualification_level to authenticated;
grant usage on type public.job_status          to authenticated;
grant usage on type public.application_status  to authenticated;
grant usage on type public.report_status       to authenticated;


-- 12. Table comments
comment on table public.profiles         is 'Extended user profiles for job seekers and employers';
comment on table public.user_roles       is 'Role assignments — job_seeker, employer, or admin';
comment on table public.companies        is 'Employer company profiles';
comment on table public.jobs             is 'Job listings posted by employers';
comment on table public.applications     is 'Job applications submitted by seekers';
comment on table public.saved_jobs       is 'Jobs bookmarked by seekers for later review';
comment on table public.job_reports      is 'User-submitted reports for inappropriate job listings';
comment on table public.contact_messages is 'Contact form submissions (rate-limited to 3/day per email)';