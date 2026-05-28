-- ============================================================================
-- TALENTRA-TZ — CONSOLIDATED SCHEMA (FRESH SETUP ONLY)
-- ============================================================================
-- This single file recreates the ENTIRE database from scratch. It is the
-- flattened equivalent of all 14 migrations in supabase/migrations/.
--
-- ⚠️  DO NOT run this on your existing/live Supabase project — it is for
--     brand-new databases only (new environment, teammate clone, staging).
--     Your live DB already has this schema via the migration history.
--
-- Order: extensions → enums → tables → functions → triggers → RLS → grants
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('job_seeker','employer','admin','employee');
  end if;
  if not exists (select 1 from pg_type where typname = 'position_level') then
    create type public.position_level as enum ('intern','graduate_trainee','entry','mid','senior','manager','director','executive');
  end if;
  if not exists (select 1 from pg_type where typname = 'contract_type') then
    create type public.contract_type as enum ('permanent','contract','temporary','freelance','internship','volunteer','consultancy');
  end if;
  if not exists (select 1 from pg_type where typname = 'qualification_level') then
    create type public.qualification_level as enum ('certificate','diploma','bachelors','masters','phd','professional');
  end if;
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type public.job_status as enum ('draft','published','closed');
  end if;
  if not exists (select 1 from pg_type where typname = 'application_status') then
    create type public.application_status as enum ('applied','under_review','shortlisted','interview','offer','hired','rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum ('open','reviewed','dismissed');
  end if;
  if not exists (select 1 from pg_type where typname = 'reference_status') then
    create type public.reference_status as enum ('pending','accepted','completed','declined','withdrawn');
  end if;
  if not exists (select 1 from pg_type where typname = 'follow_target_type') then
    create type public.follow_target_type as enum ('job_seeker','employer','employee','company','agency');
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- CORE TABLES
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  headline text,
  bio text,
  phone text,
  location text,
  language text default 'en',
  -- extended profile
  skills text[] default '{}',
  experience text[] default '{}',
  education text[] default '{}',
  portfolio_url text,
  resume_url text,
  open_to_work boolean not null default false,
  open_to_work_updated_at timestamptz default now(),
  -- structured CV
  work_experience jsonb default '[]'::jsonb,
  education_items jsonb default '[]'::jsonb,
  certifications jsonb default '[]'::jsonb,
  references_list jsonb default '[]'::jsonb,
  languages jsonb default '[]'::jsonb,
  nationality text,
  date_of_birth date,
  gender text check (gender in ('male','female','prefer_not_to_say') or gender is null),
  linkedin_url text,
  github_url text,
  cv_summary text,
  -- employment link
  current_company_id uuid,
  current_job_title text,
  current_department text,
  show_employer_badge boolean not null default true,
  -- verification
  verified_experiences jsonb default '[]'::jsonb,
  verified_references jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.companies (
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
  premium boolean not null default false,
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  posted_by uuid not null references auth.users(id) on delete cascade,
  created_by_role public.app_role not null default 'employer',
  title text not null,
  description text not null,
  location text not null,
  region text,
  industry text not null,
  position_level public.position_level not null,
  contract_type public.contract_type not null,
  qualification public.qualification_level,
  salary_min bigint,
  salary_max bigint,
  currency text default 'TZS',
  salary_negotiable boolean default false,
  deadline date,
  status public.job_status not null default 'published',
  featured boolean not null default false,
  urgent boolean not null default false,
  remote_friendly boolean not null default false,
  requirements text,
  responsibilities text,
  apply_method text not null default 'internal' check (apply_method in ('internal','email','url')),
  apply_email text,
  apply_url text,
  views_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  cover_letter text,
  cv_url text,
  status public.application_status not null default 'applied',
  remarks text,
  qualifications text,
  experience_note text,
  testimonies jsonb default '[]'::jsonb,
  background_check boolean default false,
  references_shared boolean default false,
  cv_snapshot jsonb,
  employer_notes text,
  employer_score smallint check (employer_score is null or (employer_score between 1 and 5)),
  shortlisted_at timestamptz,
  rejected_at timestamptz,
  hired_at timestamptz,
  created_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create table if not exists public.job_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  unique (job_id, reporter_id)
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false
);

-- ----------------------------------------------------------------------------
-- EMPLOYMENT & REFERENCES
-- ----------------------------------------------------------------------------
create table if not exists public.company_employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  job_title text not null,
  department text,
  start_date date,
  is_current boolean not null default true,
  verified boolean not null default false,
  badge_shown boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, company_id)
);

create table if not exists public.reference_requests (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references auth.users(id) on delete cascade,
  employee_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  job_title text,
  relationship text,
  message text,
  status public.reference_status not null default 'pending',
  recommendation text,
  rating smallint check (rating is null or (rating between 1 and 5)),
  recommender_title text,
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz default (now() + interval '30 days'),
  unique (seeker_id, employee_id, company_id)
);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS & ALERTS
-- ----------------------------------------------------------------------------
create table if not exists public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keywords text[] not null default '{}',
  regions text[] not null default '{}',
  industries text[] not null default '{}',
  position_levels public.position_level[] not null default '{}',
  enabled boolean not null default true,
  email_frequency text not null default 'daily',
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  data jsonb,
  read boolean not null default false,
  read_at timestamptz,
  sent_at timestamptz not null default now(),
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  old_status public.application_status not null,
  new_status public.application_status not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- SKILLS ASSESSMENT
-- ----------------------------------------------------------------------------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  category text,
  difficulty text not null default 'intermediate',
  quiz_duration_minutes int default 15,
  passing_score int default 70,
  created_at timestamptz not null default now()
);

create table if not exists public.skill_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'multiple_choice',
  options jsonb,
  correct_answer text,
  explanation text,
  points int default 10,
  order_number int,
  created_at timestamptz not null default now()
);

create table if not exists public.user_skill_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score int,
  passed boolean default false,
  answers jsonb,
  time_taken_seconds int,
  status text default 'in_progress',
  unique (user_id, skill_id)
);

create table if not exists public.user_verified_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  assessment_id uuid references public.user_skill_assessments(id),
  verified_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (user_id, skill_id)
);

-- ----------------------------------------------------------------------------
-- SOCIAL
-- ----------------------------------------------------------------------------
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete cascade,
  target_company_id uuid references public.companies(id) on delete cascade,
  target_type public.follow_target_type not null,
  created_at timestamptz not null default now(),
  constraint follows_target_check check (
    (target_user_id is not null and target_company_id is null) or
    (target_user_id is null and target_company_id is not null)
  ),
  unique (follower_id, target_user_id),
  unique (follower_id, target_company_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) >= 1 and char_length(content) <= 3000),
  image_url text,
  post_type text not null default 'update' check (post_type in (
    'update','achievement','job_search','hiring','article',
    'product','service','announcement','media','document'
  )),
  related_job_id uuid references public.jobs(id) on delete set null,
  related_company_id uuid references public.companies(id) on delete set null,
  company_author_id uuid references public.companies(id) on delete cascade,
  media_urls text[] default '{}',
  document_url text,
  document_name text,
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- profiles.current_company_id FK (added now that companies exists)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_current_company_fk') then
    alter table public.profiles
      add constraint profiles_current_company_fk
      foreign key (current_company_id) references public.companies(id) on delete set null;
  end if;
end $$;

-- jobs full-text search vector
alter table public.jobs
  add column if not exists search_vector tsvector
    generated always as (
      to_tsvector('english',
        coalesce(title,'')||' '||coalesce(location,'')||' '||
        coalesce(region,'')||' '||coalesce(industry,'')||' '||coalesce(description,''))
    ) stored;

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_industry_idx on public.jobs(industry);
create index if not exists jobs_region_idx on public.jobs(region);
create index if not exists jobs_company_id_idx on public.jobs(company_id);
create index if not exists jobs_posted_by_idx on public.jobs(posted_by);
create index if not exists jobs_created_at_idx on public.jobs(created_at desc);
create index if not exists jobs_search_idx on public.jobs using gin(search_vector);
create index if not exists companies_owner_id_idx on public.companies(owner_id);
create index if not exists applications_applicant_id_idx on public.applications(applicant_id);
create index if not exists applications_job_id_idx on public.applications(job_id);
create index if not exists applications_status_idx on public.applications(status);
create index if not exists saved_jobs_user_id_idx on public.saved_jobs(user_id);
create index if not exists user_roles_user_id_idx on public.user_roles(user_id);
create index if not exists notifications_user_read_idx on public.notifications(user_id, read);
create index if not exists follows_follower_id_idx on public.follows(follower_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);

-- ----------------------------------------------------------------------------
-- FUNCTIONS
-- ----------------------------------------------------------------------------
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin new.updated_at := now(); return new; end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare _requested_role text; _safe_role public.app_role;
begin
  insert into public.profiles (id, full_name, avatar_url, phone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''), split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url',
    nullif(trim(new.raw_user_meta_data->>'phone'),'')
  )
  on conflict (id) do update set
    full_name = coalesce(nullif(trim(excluded.full_name),''), public.profiles.full_name, split_part(new.email,'@',1)),
    phone = coalesce(excluded.phone, public.profiles.phone),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  _requested_role := lower(trim(new.raw_user_meta_data->>'role'));
  _safe_role := case
    when _requested_role = 'employer' then 'employer'::public.app_role
    when _requested_role = 'employee' then 'employee'::public.app_role
    else 'job_seeker'::public.app_role
  end;

  insert into public.user_roles (user_id, role)
  values (new.id, _safe_role)
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;

create or replace function public.increment_job_views(job_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.jobs set views_count = views_count + 1 where id = job_id and status = 'published';
$$;

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.job_reports enable row level security;
alter table public.contact_messages enable row level security;
alter table public.company_employees enable row level security;
alter table public.reference_requests enable row level security;
alter table public.job_alerts enable row level security;
alter table public.notifications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.skills enable row level security;
alter table public.skill_quiz_questions enable row level security;
alter table public.user_skill_assessments enable row level security;
alter table public.user_verified_skills enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;

-- Profiles
create policy "Profiles viewable by everyone" on public.profiles for select using (true);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Roles
create policy "Roles viewable by owner or admin" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "Self-assign seeker/employer/employee" on public.user_roles for insert with check (auth.uid() = user_id and role in ('job_seeker','employer','employee'));
create policy "Admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(),'admin'));

-- Companies
create policy "Companies viewable by everyone" on public.companies for select using (true);
create policy "Authenticated create companies" on public.companies for insert with check (auth.uid() = owner_id);
create policy "Owners/admin update companies" on public.companies for update using (auth.uid() = owner_id or public.has_role(auth.uid(),'admin'));
create policy "Owners/admin delete companies" on public.companies for delete using (auth.uid() = owner_id or public.has_role(auth.uid(),'admin'));

-- Jobs
create policy "Jobs visibility" on public.jobs for select using (
  status = 'published' or auth.uid() = posted_by or (auth.uid() is not null and public.has_role(auth.uid(),'admin'))
);
create policy "Employers or admins post jobs" on public.jobs for insert with check (
  auth.uid() = posted_by and (
    exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
    or public.has_role(auth.uid(),'admin')
  )
);
create policy "Owners or admin update jobs" on public.jobs for update using (auth.uid() = posted_by or public.has_role(auth.uid(),'admin'));
create policy "Owners or admin delete jobs" on public.jobs for delete using (auth.uid() = posted_by or public.has_role(auth.uid(),'admin'));

-- Applications
create policy "Applicant or job owner can view" on public.applications for select using (
  auth.uid() = applicant_id
  or exists (select 1 from public.jobs j where j.id = job_id and j.posted_by = auth.uid())
  or public.has_role(auth.uid(),'admin')
);
create policy "Users apply to open jobs only" on public.applications for insert with check (
  auth.uid() = applicant_id and exists (
    select 1 from public.jobs j where j.id = job_id and j.status = 'published'
      and (j.deadline is null or j.deadline >= current_date)
  )
);
create policy "Applicant or employer update" on public.applications for update using (
  auth.uid() = applicant_id
  or exists (select 1 from public.jobs j where j.id = job_id and j.posted_by = auth.uid())
  or public.has_role(auth.uid(),'admin')
);

-- Saved jobs
create policy "User sees own saved jobs" on public.saved_jobs for select using (auth.uid() = user_id);
create policy "User saves jobs" on public.saved_jobs for insert with check (auth.uid() = user_id);
create policy "User removes saved jobs" on public.saved_jobs for delete using (auth.uid() = user_id);

-- Job reports
create policy "Users report jobs" on public.job_reports for insert with check (auth.uid() = reporter_id);
create policy "Report owners and admin view" on public.job_reports for select using (auth.uid() = reporter_id or public.has_role(auth.uid(),'admin'));
create policy "Report owners or admin delete" on public.job_reports for delete using (auth.uid() = reporter_id or public.has_role(auth.uid(),'admin'));
create policy "Admins update reports" on public.job_reports for update using (public.has_role(auth.uid(),'admin'));

-- Contact messages
create policy "Rate-limited contact submissions" on public.contact_messages for insert with check (
  char_length(trim(name)) >= 2
  and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  and char_length(trim(message)) >= 10
);
create policy "Admins read contact messages" on public.contact_messages for select using (public.has_role(auth.uid(),'admin'));

-- Company employees
create policy "Verified employees public" on public.company_employees for select using (verified = true and is_current = true);
create policy "Users see own employee records" on public.company_employees for select using (auth.uid() = user_id);
create policy "Company owners see employees" on public.company_employees for select using (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()));
create policy "Users register as employee" on public.company_employees for insert with check (auth.uid() = user_id);
create policy "Users update own; owners verify" on public.company_employees for update using (
  auth.uid() = user_id or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()) or public.has_role(auth.uid(),'admin')
);
create policy "Users delete own employee records" on public.company_employees for delete using (
  auth.uid() = user_id or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()) or public.has_role(auth.uid(),'admin')
);

-- Reference requests
create policy "Seekers see own requests" on public.reference_requests for select using (auth.uid() = seeker_id);
create policy "Employees see requests for them" on public.reference_requests for select using (auth.uid() = employee_id);
create policy "Admins see all requests" on public.reference_requests for select using (public.has_role(auth.uid(),'admin'));
create policy "Seekers create requests" on public.reference_requests for insert with check (
  auth.uid() = seeker_id and exists (
    select 1 from public.company_employees ce where ce.user_id = employee_id and ce.company_id = reference_requests.company_id and ce.verified = true and ce.is_current = true
  )
);
create policy "Employees respond to requests" on public.reference_requests for update using (auth.uid() = employee_id and status in ('pending','accepted'));
create policy "Admins update requests" on public.reference_requests for update using (public.has_role(auth.uid(),'admin'));

-- Notifications
create policy "Users view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "System inserts notifications" on public.notifications for insert with check (true);
create policy "Users update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- Job alerts
create policy "Users view own job alerts" on public.job_alerts for select using (auth.uid() = user_id);
create policy "Users create own job alerts" on public.job_alerts for insert with check (auth.uid() = user_id);
create policy "Users update own job alerts" on public.job_alerts for update using (auth.uid() = user_id);
create policy "Users delete own job alerts" on public.job_alerts for delete using (auth.uid() = user_id);

-- Skills (public read)
create policy "Skills publicly readable" on public.skills for select using (true);
create policy "Quiz questions readable" on public.skill_quiz_questions for select to authenticated using (true);
create policy "Users view own assessments" on public.user_skill_assessments for select using (auth.uid() = user_id);
create policy "Users create own assessments" on public.user_skill_assessments for insert with check (auth.uid() = user_id);
create policy "Users update own assessments" on public.user_skill_assessments for update using (auth.uid() = user_id);
create policy "Verified skills public" on public.user_verified_skills for select using (true);
create policy "System creates verified skills" on public.user_verified_skills for insert with check (true);

-- Follows / posts / likes
create policy "Anyone can see follows" on public.follows for select using (true);
create policy "Users follow others" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users unfollow" on public.follows for delete using (auth.uid() = follower_id);
create policy "Posts publicly readable" on public.posts for select using (true);
create policy "Authors/company owners create posts" on public.posts for insert with check (
  auth.uid() = author_id and (company_author_id is null or exists (select 1 from public.companies c where c.id = company_author_id and c.owner_id = auth.uid()))
);
create policy "Authors update own posts" on public.posts for update using (auth.uid() = author_id);
create policy "Authors delete own posts" on public.posts for delete using (auth.uid() = author_id);
create policy "Likes readable" on public.post_likes for select using (true);
create policy "Users like posts" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "Users unlike posts" on public.post_likes for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- GRANTS
-- ----------------------------------------------------------------------------
grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated, service_role;
grant execute on function public.increment_job_views(uuid) to anon, authenticated;
grant select on public.jobs to anon;
grant select, insert, update, delete on public.jobs to authenticated;
grant select on public.companies to anon;
grant select, insert, update, delete on public.companies to authenticated;
grant select on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.user_roles to authenticated;
grant select, insert, update on public.applications to authenticated;
grant select, insert, delete on public.saved_jobs to authenticated;
grant select, insert, delete on public.job_reports to authenticated;
grant insert on public.contact_messages to anon, authenticated;

-- ============================================================================
-- END — fresh database ready.
-- ============================================================================
