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
  for each row execute function public.handle_new_user();