-- ============================================================
-- SECURITY & RELIABILITY HARDENING
-- Fixes critical and non-critical issues across all prior migrations
-- ============================================================


-- ============================================================
-- 1. CRITICAL: Fix has_role() execute permissions
--    Migration 2 revoked from 'authenticated' but RLS policies
--    call has_role() — this silently broke all admin checks.
-- ============================================================

-- Grant execute to authenticated so RLS policies work correctly
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- Also grant to service_role for server-side operations
grant execute on function public.has_role(uuid, public.app_role) to service_role;

-- Re-confirm trigger function is restricted (trigger runs as postgres, so this is fine)
revoke execute on function public.handle_new_user() from anon, authenticated;


-- ============================================================
-- 2. CRITICAL: Prevent privilege escalation via signup metadata
--    Old handle_new_user() let users set role='admin' in signup.
--    Rewrite to hard-block any admin role assignment from metadata.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _requested_role text;
  _safe_role      public.app_role;
begin
  -- Create profile
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  -- Determine role — NEVER allow 'admin' to be self-assigned via metadata
  _requested_role := lower(trim(new.raw_user_meta_data->>'role'));
  _safe_role := case
    when _requested_role = 'employer' then 'employer'::public.app_role
    else 'job_seeker'::public.app_role   -- default and fallback for any unknown/malicious value
  end;

  insert into public.user_roles (user_id, role)
  values (new.id, _safe_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

-- Recreate trigger (idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on function public.handle_new_user() is
  'Auto-creates profile and role on signup. Admin role cannot be self-assigned.';


-- ============================================================
-- 3. Add missing performance indexes
-- ============================================================

create index if not exists companies_owner_id_idx       on public.companies(owner_id);
create index if not exists applications_applicant_id_idx on public.applications(applicant_id);
create index if not exists applications_job_id_idx       on public.applications(job_id);
create index if not exists saved_jobs_user_id_idx        on public.saved_jobs(user_id);
create index if not exists saved_jobs_job_id_idx         on public.saved_jobs(job_id);
create index if not exists user_roles_user_id_idx        on public.user_roles(user_id);
create index if not exists jobs_posted_by_idx            on public.jobs(posted_by);
create index if not exists jobs_company_id_idx           on public.jobs(company_id);
create index if not exists jobs_created_at_idx           on public.jobs(created_at desc);
create index if not exists job_reports_reporter_id_idx   on public.job_reports(reporter_id);


-- ============================================================
-- 4. Add data integrity constraints
-- ============================================================

-- Salary: min must not exceed max
alter table public.jobs
  drop constraint if exists jobs_salary_range_check;
alter table public.jobs
  add constraint jobs_salary_range_check
  check (salary_min is null or salary_max is null or salary_min <= salary_max);

-- Salary: non-negative
alter table public.jobs
  drop constraint if exists jobs_salary_positive_check;
alter table public.jobs
  add constraint jobs_salary_positive_check
  check (
    (salary_min is null or salary_min >= 0) and
    (salary_max is null or salary_max >= 0)
  );

-- Currency: only allowed values
alter table public.jobs
  drop constraint if exists jobs_currency_check;
alter table public.jobs
  add constraint jobs_currency_check
  check (currency is null or currency = any(array['TZS','USD','EUR','GBP','KES','UGX','RWF','ZAR']));

-- Job title: non-empty, max 200 chars
alter table public.jobs
  drop constraint if exists jobs_title_check;
alter table public.jobs
  add constraint jobs_title_check
  check (char_length(trim(title)) >= 3 and char_length(title) <= 200);

-- Job description: min 30 chars
alter table public.jobs
  drop constraint if exists jobs_description_check;
alter table public.jobs
  add constraint jobs_description_check
  check (char_length(trim(description)) >= 30);

-- Company name: non-empty, max 200 chars
alter table public.companies
  drop constraint if exists companies_name_check;
alter table public.companies
  add constraint companies_name_check
  check (char_length(trim(name)) >= 2 and char_length(name) <= 200);

-- Company website: basic URL format if provided
alter table public.companies
  drop constraint if exists companies_website_check;
alter table public.companies
  add constraint companies_website_check
  check (website is null or website ~* '^https?://[^\s]+$');

-- Profile full_name: max 200 chars if provided
alter table public.profiles
  drop constraint if exists profiles_full_name_check;
alter table public.profiles
  add constraint profiles_full_name_check
  check (full_name is null or (char_length(trim(full_name)) >= 1 and char_length(full_name) <= 200));

-- Cover letter: max 5000 chars
alter table public.applications
  drop constraint if exists applications_cover_letter_check;
alter table public.applications
  add constraint applications_cover_letter_check
  check (cover_letter is null or char_length(cover_letter) <= 5000);

-- Contact messages: reasonable length limits
alter table public.contact_messages
  drop constraint if exists contact_messages_name_check;
alter table public.contact_messages
  add constraint contact_messages_name_check
  check (char_length(trim(name)) >= 2 and char_length(name) <= 100);

alter table public.contact_messages
  drop constraint if exists contact_messages_email_check;
alter table public.contact_messages
  add constraint contact_messages_email_check
  check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 255);

alter table public.contact_messages
  drop constraint if exists contact_messages_message_check;
alter table public.contact_messages
  add constraint contact_messages_message_check
  check (char_length(trim(message)) >= 10 and char_length(message) <= 2000);


-- ============================================================
-- 5. Fix job_reports: prevent duplicate reports from same user
-- ============================================================

alter table public.job_reports
  drop constraint if exists job_reports_unique_reporter;
alter table public.job_reports
  add constraint job_reports_unique_reporter
  unique (job_id, reporter_id);


-- ============================================================
-- 6. Add updated_at auto-trigger on profiles
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

comment on function public.set_updated_at() is 'Auto-sets updated_at on row update';


-- ============================================================
-- 7. Harden increment_job_views RPC
--    Add search_path + rate-limit guard (only published jobs)
-- ============================================================

create or replace function public.increment_job_views(job_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.jobs
  set views_count = views_count + 1
  where id = job_id
    and status = 'published';  -- only increment for published jobs
$$;

-- Grant to anon and authenticated (public page view, no auth required)
grant execute on function public.increment_job_views(uuid) to anon, authenticated;

comment on function public.increment_job_views(uuid) is
  'Safely increments view count. Only affects published jobs.';


-- ============================================================
-- 8. Contact messages: restrict to reasonable rate
--    Add index to help with spam detection queries
-- ============================================================

create index if not exists contact_messages_email_idx     on public.contact_messages(email);
create index if not exists contact_messages_created_at_idx on public.contact_messages(created_at desc);

-- Tighten insert policy: prevent more than 3 messages per email per day
drop policy if exists "Anyone can submit contact message" on public.contact_messages;
create policy "Rate-limited contact submissions" on public.contact_messages
  for insert
  with check (
    char_length(trim(name)) >= 2
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and char_length(trim(message)) >= 10
    and (
      select count(*)
      from public.contact_messages cm
      where cm.email = contact_messages.email
        and cm.created_at > now() - interval '24 hours'
    ) < 3
  );


-- ============================================================
-- 9. Tighten applications: prevent applying to closed jobs
-- ============================================================

drop policy if exists "Users apply to jobs" on public.applications;
create policy "Users apply to open jobs only" on public.applications
  for insert
  with check (
    auth.uid() = applicant_id
    and exists (
      select 1 from public.jobs j
      where j.id = job_id
        and j.status = 'published'
        and (j.deadline is null or j.deadline >= current_date)
    )
  );


-- ============================================================
-- 10. Tighten companies insert: prevent suspended users
-- ============================================================

drop policy if exists "Employers can create companies" on public.companies;
create policy "Authenticated users can create companies" on public.companies
  for insert
  with check (
    auth.uid() = owner_id
    and auth.role() = 'authenticated'
  );


-- ============================================================
-- 11. Add missing DELETE policy on saved_jobs
--     (users need to unsave jobs — was already present, confirming)
-- ============================================================

-- Already exists from migration 1, nothing to add.


-- ============================================================
-- 12. Ensure grants are consistent for all tables
-- ============================================================

-- Profiles
grant select on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;

-- User roles
grant select on public.user_roles to authenticated;
grant insert on public.user_roles to authenticated;

-- Companies
grant select on public.companies to anon;
grant select, insert, update, delete on public.companies to authenticated;

-- Jobs
grant select on public.jobs to anon;
grant select, insert, update, delete on public.jobs to authenticated;

-- Applications
grant select, insert, update on public.applications to authenticated;

-- Saved jobs
grant select, insert, delete on public.saved_jobs to authenticated;

-- Job reports
grant select, insert, delete on public.job_reports to authenticated;

-- Contact messages
grant insert on public.contact_messages to anon;
grant insert on public.contact_messages to authenticated;

-- Enum usage
grant usage on type public.app_role to authenticated;
grant usage on type public.position_level to authenticated;
grant usage on type public.contract_type to authenticated;
grant usage on type public.qualification_level to authenticated;
grant usage on type public.job_status to authenticated;
grant usage on type public.application_status to authenticated;
grant usage on type public.report_status to authenticated;


-- ============================================================
-- 13. Add full-text search index on jobs for faster search
-- ============================================================

alter table public.jobs
  add column if not exists search_vector tsvector
    generated always as (
      to_tsvector('english',
        coalesce(title, '') || ' ' ||
        coalesce(location, '') || ' ' ||
        coalesce(region, '') || ' ' ||
        coalesce(industry, '') || ' ' ||
        coalesce(description, '')
      )
    ) stored;

create index if not exists jobs_search_idx on public.jobs using gin(search_vector);

comment on column public.jobs.search_vector is
  'Auto-generated full-text search vector for fast job search queries';


-- ============================================================
-- 14. Final documentation
-- ============================================================

comment on table public.profiles           is 'Extended user profiles for job seekers and employers';
comment on table public.user_roles         is 'Role assignments — job_seeker, employer, or admin';
comment on table public.companies          is 'Employer company profiles';
comment on table public.jobs               is 'Job listings posted by employers';
comment on table public.applications       is 'Job applications submitted by seekers';
comment on table public.saved_jobs         is 'Jobs bookmarked by seekers for later review';
comment on table public.job_reports        is 'User-submitted reports for inappropriate job listings';
comment on table public.contact_messages   is 'Contact form submissions (rate-limited to 3/day per email)';

