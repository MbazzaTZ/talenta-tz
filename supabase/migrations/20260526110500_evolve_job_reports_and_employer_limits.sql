-- Add premium employer tiers, reporting, and stronger job ownership metadata

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
grant usage on type public.report_status to authenticated;