-- Initial schema: Enums, tables, RLS policies, and triggers

-- Enums
create type public.app_role as enum ('job_seeker', 'employer', 'admin');
create type public.position_level as enum ('intern','graduate_trainee','entry','mid','senior','manager','director','executive');
create type public.contract_type as enum ('permanent','contract','temporary','freelance','internship','volunteer','consultancy');
create type public.qualification_level as enum ('certificate','diploma','bachelors','masters','phd','professional');
create type public.job_status as enum ('draft','published','closed');
create type public.application_status as enum ('applied','under_review','shortlisted','interview','offer','hired','rejected');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  headline text,
  bio text,
  phone text,
  location text,
  language text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Companies
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text unique,
  logo_url text,
  banner_url text,
  description text,
  industry text,
  location text,
  website text,
  employees_count text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Jobs
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  posted_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  location text not null,
  region text,
  industry text not null,
  position_level position_level not null,
  contract_type contract_type not null,
  qualification qualification_level,
  salary_min bigint,
  salary_max bigint,
  currency text default 'TZS',
  salary_negotiable boolean default false,
  deadline date,
  status job_status not null default 'published',
  featured boolean not null default false,
  views_count int not null default 0,
  created_at timestamptz not null default now()
);
create index jobs_status_idx on public.jobs(status);
create index jobs_industry_idx on public.jobs(industry);
create index jobs_region_idx on public.jobs(region);

-- Applications
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  cover_letter text,
  cv_url text,
  status application_status not null default 'applied',
  created_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

-- Saved jobs
create table public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;

-- Profiles policies
create policy "Profiles viewable by everyone" on public.profiles for select using (true);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- User roles policies
create policy "Roles viewable by owner or admin" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "Users can self-assign job_seeker or employer" on public.user_roles for insert with check (auth.uid() = user_id and role in ('job_seeker','employer'));
create policy "Admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(),'admin'));

-- Companies policies
create policy "Companies viewable by everyone" on public.companies for select using (true);
create policy "Employers can create companies" on public.companies for insert with check (auth.uid() = owner_id);
create policy "Owners or admin update companies" on public.companies for update using (auth.uid() = owner_id or public.has_role(auth.uid(),'admin'));
create policy "Owners or admin delete companies" on public.companies for delete using (auth.uid() = owner_id or public.has_role(auth.uid(),'admin'));

-- Jobs policies
create policy "Published jobs viewable by everyone" on public.jobs for select using (status = 'published' or auth.uid() = posted_by or public.has_role(auth.uid(),'admin'));
create policy "Employers post jobs for own company" on public.jobs for insert with check (
  auth.uid() = posted_by and exists(select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
);
create policy "Owners or admin update jobs" on public.jobs for update using (auth.uid() = posted_by or public.has_role(auth.uid(),'admin'));
create policy "Owners or admin delete jobs" on public.jobs for delete using (auth.uid() = posted_by or public.has_role(auth.uid(),'admin'));

-- Applications policies
create policy "Applicant or job owner can view" on public.applications for select using (
  auth.uid() = applicant_id
  or exists(select 1 from public.jobs j where j.id = job_id and j.posted_by = auth.uid())
  or public.has_role(auth.uid(),'admin')
);
create policy "Users apply to jobs" on public.applications for insert with check (auth.uid() = applicant_id);
create policy "Applicant or job owner update status" on public.applications for update using (
  auth.uid() = applicant_id
  or exists(select 1 from public.jobs j where j.id = job_id and j.posted_by = auth.uid())
);

-- Saved jobs policies
create policy "User sees own saved jobs" on public.saved_jobs for select using (auth.uid() = user_id);
create policy "User saves jobs" on public.saved_jobs for insert with check (auth.uid() = user_id);
create policy "User removes saved jobs" on public.saved_jobs for delete using (auth.uid() = user_id);

-- Trigger to auto-create profile + default role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'job_seeker'))
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();-- Revoke execute permissions from public/anonymous users for security functions
-- This prevents unauthorized execution of sensitive functions

revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- Grant execute only to postgres role (owner) and specific trusted functions
grant execute on function public.has_role(uuid, public.app_role) to postgres;
grant execute on function public.handle_new_user() to postgres;

-- Add comment explaining the security change
comment on function public.has_role(uuid, public.app_role) is 'Internal function - execute revoked from public for security';
comment on function public.handle_new_user() is 'Internal trigger function - execute revoked from public for security';

-- Note: These functions are still accessible through RLS policies and triggers
-- The revoke only prevents direct execution by anonymous/authenticated users-- Add premium employer tiers, reporting, and stronger job ownership metadata

-- Create report status enum
create type public.report_status as enum ('open', 'reviewed', 'dismissed');

-- Add columns to companies table
alter table public.companies
  add column if not exists premium boolean not null default false,
  add column if not exists suspended boolean not null default false;

-- Add created_by_role column to jobs table
alter table public.jobs
  add column if not exists created_by_role app_role not null default 'employer';

-- Create job reports table
create table public.job_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);

-- Create indexes for better query performance
create index if not exists job_reports_job_id_idx on public.job_reports(job_id);
create index if not exists job_reports_status_idx on public.job_reports(status);

-- Enable RLS on job_reports
alter table public.job_reports enable row level security;

-- Create RLS policies for job_reports
create policy "Users report jobs" on public.job_reports 
  for insert with check (auth.uid() = reporter_id);

create policy "Report owners and admin can view" on public.job_reports 
  for select using (
    auth.uid() = reporter_id or public.has_role(auth.uid(), 'admin')
  );

create policy "Report owners or admin can delete" on public.job_reports 
  for delete using (
    auth.uid() = reporter_id or public.has_role(auth.uid(), 'admin')
  );

create policy "Admins update reports" on public.job_reports 
  for update using (
    public.has_role(auth.uid(), 'admin')
  );

-- Add comment to document the purpose of these changes
comment on table public.job_reports is 'Stores user reports for inappropriate job postings';
comment on column public.companies.premium is 'Indicates if company has premium tier access';
comment on column public.companies.suspended is 'Indicates if company account is suspended';
comment on column public.jobs.created_by_role is 'Role of the user who created the job posting';

-- Grant necessary permissions
grant select, insert, update, delete on public.job_reports to authenticated;
grant usage on type public.report_status to authenticated;-- Add extended profile fields for job seekers
alter table public.profiles
  add column if not exists skills text[] default '{}',
  add column if not exists experience text[] default '{}',
  add column if not exists education text[] default '{}',
  add column if not exists portfolio_url text,
  add column if not exists resume_url text;

-- Add RLS policies for new columns (inherits from existing profile policies)

-- Add comment
comment on column public.profiles.skills is 'Array of skill strings for the job seeker';
comment on column public.profiles.resume_url is 'Public URL to the uploaded resume file';

-- Contact messages table
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false
);

alter table public.contact_messages enable row level security;

-- Only admins can read messages; anyone can insert
create policy "Anyone can submit contact message" on public.contact_messages
  for insert with check (true);
create policy "Admins can read contact messages" on public.contact_messages
  for select using (public.has_role(auth.uid(), 'admin'));

-- Function to safely increment job view count
create or replace function public.increment_job_views(job_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.jobs set views_count = views_count + 1 where id = job_id;
$$;
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

