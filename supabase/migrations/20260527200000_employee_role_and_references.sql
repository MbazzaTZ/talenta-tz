-- ============================================================
-- EMPLOYEE ROLE, COMPANY MEMBERSHIP & REFERENCE REQUESTS
-- ============================================================


-- ============================================================
-- 1. Add 'employee' to the app_role enum
-- ============================================================

alter type public.app_role add value if not exists 'employee';


-- ============================================================
-- 2. Allow employees to self-assign their role
-- ============================================================

drop policy if exists "Users can self-assign job_seeker or employer" on public.user_roles;
create policy "Users can self-assign seeker, employer, or employee" on public.user_roles
  for insert with check (
    auth.uid() = user_id
    and role in ('job_seeker', 'employer', 'employee')
  );


-- ============================================================
-- 3. Company employees table
--    Links a verified user to a company with their job details
-- ============================================================

create table if not exists public.company_employees (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  company_id   uuid        not null references public.companies(id) on delete cascade,
  job_title    text        not null,
  department   text,
  start_date   date,
  is_current   boolean     not null default true,
  verified     boolean     not null default false,  -- company owner can verify
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, company_id)
);

create index if not exists company_employees_user_id_idx    on public.company_employees(user_id);
create index if not exists company_employees_company_id_idx on public.company_employees(company_id);
create index if not exists company_employees_verified_idx   on public.company_employees(verified) where verified = true;

alter table public.company_employees enable row level security;

-- Anyone can see verified current employees (for reference requests)
create policy "Verified employees are public" on public.company_employees
  for select using (verified = true and is_current = true);

-- Employees can see their own records regardless of verification
create policy "Users see own employee records" on public.company_employees
  for select using (auth.uid() = user_id);

-- Company owners can see all their employees
create policy "Company owners see all employees" on public.company_employees
  for select using (
    exists (
      select 1 from public.companies c
      where c.id = company_id and c.owner_id = auth.uid()
    )
  );

-- Any authenticated user can register as an employee (pending verification)
create policy "Users register as employee" on public.company_employees
  for insert with check (auth.uid() = user_id);

-- Users can update their own records; company owners can verify
create policy "Users update own; owners verify" on public.company_employees
  for update using (
    auth.uid() = user_id
    or exists (
      select 1 from public.companies c
      where c.id = company_id and c.owner_id = auth.uid()
    )
    or public.has_role(auth.uid(), 'admin')
  );

-- Users can remove themselves; owners can remove; admins can remove
create policy "Users delete own employee records" on public.company_employees
  for delete using (
    auth.uid() = user_id
    or exists (
      select 1 from public.companies c
      where c.id = company_id and c.owner_id = auth.uid()
    )
    or public.has_role(auth.uid(), 'admin')
  );

-- Grants
grant select on public.company_employees to anon;
grant select, insert, update, delete on public.company_employees to authenticated;

comment on table public.company_employees is
  'Links users to companies as employees. Verified by company owner.';
comment on column public.company_employees.verified is
  'Set to true by company owner to confirm the person works there.';


-- ============================================================
-- 4. Reference request status enum
-- ============================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'reference_status') then
    create type public.reference_status as enum (
      'pending',    -- seeker sent request, awaiting response
      'accepted',   -- employee accepted, writing recommendation
      'completed',  -- recommendation written and submitted
      'declined',   -- employee declined
      'withdrawn'   -- seeker withdrew the request
    );
  end if;
end $$;


-- ============================================================
-- 5. Reference requests table
--    Job seeker requests a recommendation from a company employee
-- ============================================================

create table if not exists public.reference_requests (
  id              uuid                    primary key default gen_random_uuid(),
  seeker_id       uuid                    not null references auth.users(id) on delete cascade,
  employee_id     uuid                    not null references auth.users(id) on delete cascade,
  company_id      uuid                    not null references public.companies(id) on delete cascade,
  -- Context
  job_title       text,        -- the job they are applying for (optional)
  relationship    text,        -- how seeker knows the employee
  message         text,        -- personal message from seeker to employee
  -- Response
  status          public.reference_status not null default 'pending',
  recommendation  text,        -- the written recommendation from employee
  rating          smallint     check (rating is null or (rating >= 1 and rating <= 5)),
  recommender_title text,      -- employee's title at time of writing
  -- Metadata
  requested_at    timestamptz not null default now(),
  responded_at    timestamptz,
  completed_at    timestamptz,
  expires_at      timestamptz default (now() + interval '30 days'),
  -- Prevent duplicate requests to same employee
  unique (seeker_id, employee_id, company_id)
);

create index if not exists ref_requests_seeker_id_idx   on public.reference_requests(seeker_id);
create index if not exists ref_requests_employee_id_idx on public.reference_requests(employee_id);
create index if not exists ref_requests_status_idx      on public.reference_requests(status);
create index if not exists ref_requests_company_id_idx  on public.reference_requests(company_id);

alter table public.reference_requests enable row level security;

-- Seeker sees their own requests
create policy "Seekers see own requests" on public.reference_requests
  for select using (auth.uid() = seeker_id);

-- Employee sees requests directed at them
create policy "Employees see requests for them" on public.reference_requests
  for select using (auth.uid() = employee_id);

-- Admins see all
create policy "Admins see all requests" on public.reference_requests
  for select using (public.has_role(auth.uid(), 'admin'));

-- Seeker can create a request
create policy "Seekers create requests" on public.reference_requests
  for insert with check (
    auth.uid() = seeker_id
    -- Employee must be a verified current employee of the company
    and exists (
      select 1 from public.company_employees ce
      where ce.user_id = employee_id
        and ce.company_id = reference_requests.company_id
        and ce.verified = true
        and ce.is_current = true
    )
  );

-- Seeker can withdraw their own pending request
create policy "Seekers withdraw pending requests" on public.reference_requests
  for update using (
    auth.uid() = seeker_id
    and status = 'pending'
  )
  with check (status = 'withdrawn');

-- Employee can accept, decline, or complete
create policy "Employees respond to requests" on public.reference_requests
  for update using (
    auth.uid() = employee_id
    and status in ('pending', 'accepted')
  );

-- Admins can update anything
create policy "Admins update requests" on public.reference_requests
  for update using (public.has_role(auth.uid(), 'admin'));

-- Grants
grant select, insert, update on public.reference_requests to authenticated;

comment on table public.reference_requests is
  'Job seeker requests a written recommendation from a verified company employee.';
comment on column public.reference_requests.recommendation is
  'Written by the employee after accepting. Visible to seeker and any employer they share it with.';
comment on column public.reference_requests.rating is
  'Optional 1–5 star rating the employee gives the seeker.';


-- ============================================================
-- 6. Add employee_id column to profiles (current employer link)
-- ============================================================

alter table public.profiles
  add column if not exists current_company_id uuid references public.companies(id) on delete set null,
  add column if not exists current_job_title   text,
  add column if not exists current_department  text;

create index if not exists profiles_current_company_id_idx
  on public.profiles(current_company_id) where current_company_id is not null;

comment on column public.profiles.current_company_id is
  'FK to companies — the employee''s current employer, set from company_employees';
comment on column public.profiles.current_job_title is
  'Cached job title at current employer for quick display';


-- ============================================================
-- 7. Trigger: auto-update profiles.current_company_id when
--    an employee record is verified or marked current
-- ============================================================

create or replace function public.sync_current_employer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- If this is now a verified current record, update the profile
  if new.is_current = true and new.verified = true then
    update public.profiles
    set
      current_company_id = new.company_id,
      current_job_title  = new.job_title,
      current_department = new.department,
      updated_at         = now()
    where id = new.user_id;
  end if;

  -- If marked as not current, clear the profile link if it points to this company
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

comment on function public.sync_current_employer() is
  'Keeps profiles.current_company_id in sync with company_employees';


-- ============================================================
-- 8. Allow reference_requests.recommendation to be included
--    in CV snapshots and applications (no schema change needed;
--    already in references_list jsonb on applications)
-- ============================================================


-- ============================================================
-- 9. Updated_at trigger for company_employees
-- ============================================================

drop trigger if exists company_employees_set_updated_at on public.company_employees;
create trigger company_employees_set_updated_at
  before update on public.company_employees
  for each row execute function public.set_updated_at();


-- ============================================================
-- 10. handle_new_user: also accept 'employee' as a valid role
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
  insert into public.profiles (id, full_name, avatar_url, phone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    nullif(trim(new.raw_user_meta_data->>'phone'), '')
  )
  on conflict (id) do update set
    full_name = coalesce(
      nullif(trim(excluded.full_name), ''),
      profiles.full_name,
      split_part(new.email, '@', 1)
    ),
    phone = coalesce(excluded.phone, profiles.phone),
    updated_at = now();

  _requested_role := lower(trim(new.raw_user_meta_data->>'role'));
  _safe_role := case
    when _requested_role = 'employer'  then 'employer'::public.app_role
    when _requested_role = 'employee'  then 'employee'::public.app_role
    else 'job_seeker'::public.app_role  -- default; 'admin' is never self-assigned
  end;

  insert into public.user_roles (user_id, role)
  values (new.id, _safe_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Auto-creates profile and role on signup. Accepts job_seeker, employer, employee. Admin cannot be self-assigned.';

