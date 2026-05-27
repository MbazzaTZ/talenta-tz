-- Add extended profile fields for job seekers
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
