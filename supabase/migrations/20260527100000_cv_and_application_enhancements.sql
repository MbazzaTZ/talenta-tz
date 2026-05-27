-- ============================================================
-- CV BUILDER & APPLICATION ENHANCEMENTS
-- Structured CV data, application remarks, references, testimonies
-- ============================================================

-- ============================================================
-- 1. Extend profiles with structured CV data
-- ============================================================

-- Work experience as structured JSONB array
alter table public.profiles
  add column if not exists work_experience jsonb default '[]'::jsonb,
  add column if not exists education_items jsonb default '[]'::jsonb,
  add column if not exists certifications  jsonb default '[]'::jsonb,
  add column if not exists references_list jsonb default '[]'::jsonb,
  add column if not exists languages       jsonb default '[]'::jsonb,
  add column if not exists nationality     text,
  add column if not exists date_of_birth   date,
  add column if not exists gender          text check (gender in ('male','female','prefer_not_to_say') or gender is null),
  add column if not exists linkedin_url    text,
  add column if not exists github_url      text,
  add column if not exists cv_summary      text; -- professional summary for the CV

comment on column public.profiles.work_experience is
  'Array of {title, company, location, start_date, end_date, current, description}';
comment on column public.profiles.education_items is
  'Array of {institution, degree, field, start_year, end_year, current, grade}';
comment on column public.profiles.certifications is
  'Array of {name, issuer, issue_date, expiry_date, credential_id, url}';
comment on column public.profiles.references_list is
  'Array of {name, title, company, email, phone, relationship}';
comment on column public.profiles.languages is
  'Array of {language, proficiency} where proficiency in (basic, conversational, fluent, native)';


-- ============================================================
-- 2. Extend applications with rich application data
-- ============================================================

alter table public.applications
  add column if not exists remarks           text,      -- applicant's remarks/cover message
  add column if not exists qualifications    text,      -- relevant qualifications narrative
  add column if not exists experience_note   text,      -- relevant experience summary
  add column if not exists testimonies       jsonb default '[]'::jsonb, -- [{name, contact, message}]
  add column if not exists background_check  boolean default false,     -- consented to background check
  add column if not exists references_shared boolean default false,     -- shared references with employer
  add column if not exists cv_snapshot       jsonb,     -- snapshot of CV at time of application
  add column if not exists employer_notes    text,      -- employer's private notes on applicant
  add column if not exists employer_score    smallint   -- employer's rating 1–5
    check (employer_score is null or (employer_score >= 1 and employer_score <= 5)),
  add column if not exists shortlisted_at    timestamptz,
  add column if not exists rejected_at       timestamptz,
  add column if not exists hired_at          timestamptz;

comment on column public.applications.cv_snapshot is
  'Full profile snapshot at time of application — prevents data loss if seeker edits profile later';
comment on column public.applications.employer_score is
  'Employer rating 1–5 stars visible only to the job poster and admins';
comment on column public.applications.background_check is
  'Applicant consented to background verification';


-- ============================================================
-- 3. Indexes for application queries
-- ============================================================

create index if not exists applications_status_idx
  on public.applications(status);
create index if not exists applications_created_at_idx
  on public.applications(created_at desc);


-- ============================================================
-- 4. RLS: employer_notes and employer_score only visible to job poster
-- ============================================================

-- Drop and recreate the application select policy to be explicit
drop policy if exists "Applicant or job owner can view" on public.applications;

create policy "Applicant or job owner can view" on public.applications
  for select using (
    auth.uid() = applicant_id
    or exists (
      select 1 from public.jobs j
      where j.id = job_id and j.posted_by = auth.uid()
    )
    or public.has_role(auth.uid(), 'admin')
  );

-- Employer can update status, notes, score on applications to their jobs
drop policy if exists "Applicant or job owner update status" on public.applications;

create policy "Applicant updates own; employer updates status and notes" on public.applications
  for update using (
    auth.uid() = applicant_id
    or exists (
      select 1 from public.jobs j
      where j.id = job_id and j.posted_by = auth.uid()
    )
    or public.has_role(auth.uid(), 'admin')
  );


-- ============================================================
-- 5. Function: get full application details for employer
-- ============================================================

create or replace function public.get_application_details(p_job_id uuid, p_poster_id uuid)
returns table (
  application_id    uuid,
  applicant_id      uuid,
  full_name         text,
  email             text,
  headline          text,
  location          text,
  skills            text[],
  cv_summary        text,
  work_experience   jsonb,
  education_items   jsonb,
  certifications    jsonb,
  references_list   jsonb,
  resume_url        text,
  portfolio_url     text,
  linkedin_url      text,
  remarks           text,
  qualifications    text,
  experience_note   text,
  testimonies       jsonb,
  background_check  boolean,
  references_shared boolean,
  cv_snapshot       jsonb,
  employer_notes    text,
  employer_score    smallint,
  status            public.application_status,
  created_at        timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    a.id,
    a.applicant_id,
    p.full_name,
    au.email,
    p.headline,
    p.location,
    p.skills,
    p.cv_summary,
    p.work_experience,
    p.education_items,
    p.certifications,
    p.references_list,
    p.resume_url,
    p.portfolio_url,
    p.linkedin_url,
    a.remarks,
    a.qualifications,
    a.experience_note,
    a.testimonies,
    a.background_check,
    a.references_shared,
    a.cv_snapshot,
    a.employer_notes,
    a.employer_score,
    a.status,
    a.created_at
  from public.applications a
  join public.profiles p on p.id = a.applicant_id
  join auth.users au on au.id = a.applicant_id
  where a.job_id = p_job_id
    and exists (
      select 1 from public.jobs j
      where j.id = p_job_id
        and (j.posted_by = p_poster_id or public.has_role(p_poster_id, 'admin'))
    )
  order by a.created_at desc;
$$;

grant execute on function public.get_application_details(uuid, uuid) to authenticated;

