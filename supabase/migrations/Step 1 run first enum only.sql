-- ============================================================
-- STEP 2 OF 2 — Run AFTER step 1 is committed
-- Employee role, company membership, reference requests,
-- company logo badge on verified employee profiles
-- ============================================================


-- ============================================================
-- 1. RLS: allow employees to self-assign their role
-- ============================================================

drop policy if exists "Users can self-assign job_seeker or employer" on public.user_roles;
drop policy if exists "Users can self-assign seeker, employer, or employee" on public.user_roles;
create policy "Users can self-assign seeker, employer, or employee" on public.user_roles
  for insert with check (
    auth.uid() = user_id
    and role in ('job_seeker', 'employer', 'employee')
  );


-- ============================================================
-- 2. Company employees table
-- ============================================================

create table if not exists public.company_employees (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  company_id   uuid        not null references public.companies(id) on delete cascade,
  job_title    text        not null,
  department   text,
  start_date   date,
  is_current   boolean     not null default true,
  verified     boolean     not null default false,
  badge_shown  boolean     not null default true,  -- employee can hide badge if they wish
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, company_id)
);

create index if not exists company_employees_user_id_idx    on public.company_employees(user_id);
create index if not exists company_employees_company_id_idx on public.company_employees(company_id);
create index if not exists company_employees_verified_idx   on public.company_employees(verified)
  where verified = true;

alter table public.company_employees enable row level security;

-- Public: see verified current employees
create policy "Verified employees are public" on public.company_employees
  for select using (verified = true and is_current = true);

-- Own records always visible
create policy "Users see own employee records" on public.company_employees
  for select using (auth.uid() = user_id);

-- Company owners see all their employees
create policy "Company owners see all employees" on public.company_employees
  for select using (
    exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
  );

-- Register as employee (pending verification)
create policy "Users register as employee" on public.company_employees
  for insert with check (auth.uid() = user_id);

-- Update own record or owner verifies
create policy "Users update own; owners verify" on public.company_employees
  for update using (
    auth.uid() = user_id
    or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

-- Delete
create policy "Users delete own employee records" on public.company_employees
  for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

grant select on public.company_employees to anon;
grant select, insert, update, delete on public.company_employees to authenticated;

comment on table public.company_employees
  is 'Links users to companies as employees. Verified by company owner.';
comment on column public.company_employees.verified
  is 'Set true by company owner to confirm employment and award the company badge.';
comment on column public.company_employees.badge_shown
  is 'Employee can hide the badge from their public profile.';


-- ============================================================
-- 3. Extend profiles with current employer + badge columns
-- ============================================================

alter table public.profiles
  add column if not exists current_company_id  uuid references public.companies(id) on delete set null,
  add column if not exists current_job_title    text,
  add column if not exists current_department   text,
  add column if not exists show_employer_badge  boolean not null default true;

create index if not exists profiles_current_company_id_idx
  on public.profiles(current_company_id)
  where current_company_id is not null;

comment on column public.profiles.current_company_id
  is 'FK to companies — set automatically when employment is verified';
comment on column public.profiles.show_employer_badge
  is 'Whether to display the verified employer badge on the public profile';


-- ============================================================
-- 4. Trigger: sync current employer badge when verified
-- ============================================================

create or replace function public.sync_current_employer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_current = true and new.verified = true then
    update public.profiles
    set
      current_company_id = new.company_id,
      current_job_title  = new.job_title,
      current_department = new.department,
      updated_at         = now()
    where id = new.user_id;
  end if;

  if new.is_current = false then
    update public.profiles
    set
      current_company_id = null,
      current_job_title  = null,
      current_department = null,
      updated_at         = now()
    where id = new.user_id
      and current_company_id = new.company_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_current_employer_trigger on public.company_employees;
create trigger sync_current_employer_trigger
  after insert or update on public.company_employees
  for each row execute function public.sync_current_employer();

drop trigger if exists company_employees_set_updated_at on public.company_employees;
create trigger company_employees_set_updated_at
  before update on public.company_employees
  for each row execute function public.set_updated_at();


-- ============================================================
-- 5. Reference request status enum + table
-- ============================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'reference_status') then
    create type public.reference_status as enum (
      'pending', 'accepted', 'completed', 'declined', 'withdrawn'
    );
  end if;
end $$;

create table if not exists public.reference_requests (
  id                uuid                    primary key default gen_random_uuid(),
  seeker_id         uuid                    not null references auth.users(id) on delete cascade,
  employee_id       uuid                    not null references auth.users(id) on delete cascade,
  company_id        uuid                    not null references public.companies(id) on delete cascade,
  job_title         text,
  relationship      text,
  message           text,
  status            public.reference_status not null default 'pending',
  recommendation    text,
  rating            smallint check (rating is null or (rating >= 1 and rating <= 5)),
  recommender_title text,
  requested_at      timestamptz not null default now(),
  responded_at      timestamptz,
  completed_at      timestamptz,
  expires_at        timestamptz default (now() + interval '30 days'),
  unique (seeker_id, employee_id, company_id)
);

create index if not exists ref_requests_seeker_id_idx   on public.reference_requests(seeker_id);
create index if not exists ref_requests_employee_id_idx on public.reference_requests(employee_id);
create index if not exists ref_requests_status_idx      on public.reference_requests(status);
create index if not exists ref_requests_company_id_idx  on public.reference_requests(company_id);

alter table public.reference_requests enable row level security;

drop policy if exists "Seekers see own requests"        on public.reference_requests;
drop policy if exists "Employees see requests for them" on public.reference_requests;
drop policy if exists "Admins see all requests"         on public.reference_requests;
drop policy if exists "Seekers create requests"         on public.reference_requests;
drop policy if exists "Seekers withdraw pending requests" on public.reference_requests;
drop policy if exists "Employees respond to requests"   on public.reference_requests;
drop policy if exists "Admins update requests"          on public.reference_requests;

create policy "Seekers see own requests" on public.reference_requests
  for select using (auth.uid() = seeker_id);

create policy "Employees see requests for them" on public.reference_requests
  for select using (auth.uid() = employee_id);

create policy "Admins see all requests" on public.reference_requests
  for select using (public.has_role(auth.uid(), 'admin'));

create policy "Seekers create requests" on public.reference_requests
  for insert with check (
    auth.uid() = seeker_id
    and exists (
      select 1 from public.company_employees ce
      where ce.user_id = employee_id
        and ce.company_id = reference_requests.company_id
        and ce.verified = true
        and ce.is_current = true
    )
  );

create policy "Seekers withdraw pending requests" on public.reference_requests
  for update using (auth.uid() = seeker_id and status = 'pending')
  with check (status = 'withdrawn');

create policy "Employees respond to requests" on public.reference_requests
  for update using (auth.uid() = employee_id and status in ('pending', 'accepted'));

create policy "Admins update requests" on public.reference_requests
  for update using (public.has_role(auth.uid(), 'admin'));

grant select, insert, update on public.reference_requests to authenticated;

comment on table public.reference_requests
  is 'Job seeker requests a written recommendation from a verified company employee.';


-- ============================================================
-- 6. Update handle_new_user to accept 'employee' role
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
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  _requested_role := lower(trim(new.raw_user_meta_data->>'role'));
  _safe_role := case
    when _requested_role = 'employer'  then 'employer'::public.app_role
    when _requested_role = 'employee'  then 'employee'::public.app_role
    else 'job_seeker'::public.app_role
  end;

  insert into public.user_roles (user_id, role)
  values (new.id, _safe_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user()
  is 'Auto-creates profile and role on signup. Accepts job_seeker, employer, employee. Admin cannot be self-assigned.';


-- ============================================================
-- 7. Grants for enums
-- ============================================================

grant usage on type public.reference_status to authenticated;