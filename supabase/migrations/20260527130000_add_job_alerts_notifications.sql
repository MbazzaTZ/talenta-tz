-- Add job alerts, notifications, and open-to-work flag

-- Update profiles table to add open_to_work flag
alter table public.profiles add column if not exists open_to_work boolean not null default false;
alter table public.profiles add column if not exists open_to_work_updated_at timestamptz default now();

-- Job alerts table
create table if not exists public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keywords text[] not null default '{}',
  regions text[] not null default '{}',
  industries text[] not null default '{}',
  position_levels public.position_level[] not null default '{}',
  enabled boolean not null default true,
  email_frequency text not null default 'daily', -- daily, weekly, immediately
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists job_alerts_user_id_idx on public.job_alerts(user_id);
create index if not exists job_alerts_enabled_idx on public.job_alerts(enabled);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'job_alert', 'application_status', 'profile_view', etc.
  title text not null,
  message text not null,
  data jsonb, -- flexible data storage (e.g., job_id, application_id, new_status, etc.)
  read boolean not null default false,
  read_at timestamptz,
  sent_at timestamptz not null default now(),
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_idx on public.notifications(read);
create index if not exists notifications_user_read_idx on public.notifications(user_id, read);
create index if not exists notifications_type_idx on public.notifications(type);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

-- Application status history (for tracking changes)
create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  old_status public.application_status not null,
  new_status public.application_status not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

create index if not exists application_status_history_application_id_idx on public.application_status_history(application_id);
create index if not exists application_status_history_changed_at_idx on public.application_status_history(changed_at desc);

-- Trigger to create notification when application status changes
create or replace function public.notify_application_status_change()
returns trigger language plpgsql security definer as $$
declare
  _job record;
  _seeker_profile record;
  _employer_profile record;
  _status_text text;
begin
  if new.status != old.status then
    -- Get job details
    select jobs.*, companies.name as company_name
    into _job
    from public.jobs
    join public.companies on jobs.company_id = companies.id
    where jobs.id = new.job_id;

    -- Get seeker and employer profiles
    select * into _seeker_profile from public.profiles where id = new.applicant_id;
    select * into _employer_profile from public.profiles where id = _job.posted_by;

    -- Map status to human-readable text
    _status_text := case new.status
      when 'shortlisted' then 'Shortlisted'
      when 'interview' then 'Interview Scheduled'
      when 'offer' then 'Offer Extended'
      when 'hired' then 'Hired!'
      when 'rejected' then 'Application Rejected'
      else 'Application Updated'
    end;

    -- Create notification for seeker
    insert into public.notifications (user_id, type, title, message, data)
    values (
      new.applicant_id,
      'application_status',
      _status_text || ' - ' || _job.title,
      'Your application to ' || _job.company_name || ' for ' || _job.title || ' has been ' || lower(_status_text),
      jsonb_build_object(
        'application_id', new.id,
        'job_id', new.job_id,
        'old_status', old.status,
        'new_status', new.status,
        'company_name', _job.company_name,
        'job_title', _job.title
      )
    );

    -- Record status change history
    insert into public.application_status_history (application_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists on_application_status_change on public.applications;
create trigger on_application_status_change
after update on public.applications
for each row execute function public.notify_application_status_change();

-- RLS policies for notifications
alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
on public.notifications for select
using (auth.uid() = user_id);

drop policy if exists "System can insert notifications" on public.notifications;
create policy "System can insert notifications"
on public.notifications for insert
with check (true);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
on public.notifications for update
using (auth.uid() = user_id);

-- RLS policies for job alerts
alter table public.job_alerts enable row level security;

drop policy if exists "Users can view their own job alerts" on public.job_alerts;
create policy "Users can view their own job alerts"
on public.job_alerts for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own job alerts" on public.job_alerts;
create policy "Users can create their own job alerts"
on public.job_alerts for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own job alerts" on public.job_alerts;
create policy "Users can update their own job alerts"
on public.job_alerts for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete their own job alerts" on public.job_alerts;
create policy "Users can delete their own job alerts"
on public.job_alerts for delete
using (auth.uid() = user_id);

-- RLS policy for application status history
alter table public.application_status_history enable row level security;

drop policy if exists "Employers can view status history for their jobs" on public.application_status_history;
create policy "Employers can view status history for their jobs"
on public.application_status_history for select
using (
  exists (
    select 1 from public.applications
    join public.jobs on applications.job_id = jobs.id
    where applications.id = application_status_history.application_id
    and jobs.posted_by = auth.uid()
  )
  or
  exists (
    select 1 from public.applications
    where applications.id = application_status_history.application_id
    and applications.applicant_id = auth.uid()
  )
);
