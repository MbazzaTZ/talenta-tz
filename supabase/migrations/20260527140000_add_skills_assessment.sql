-- Skills Assessment System and Kanban Application Tracker

-- Skills table with quiz content
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  category text, -- 'technical', 'business', 'language', etc.
  difficulty text not null default 'intermediate', -- beginner, intermediate, advanced
  quiz_duration_minutes int default 15,
  passing_score int default 70, -- percentage
  created_at timestamptz not null default now()
);

-- Quiz questions for skill assessments
create table if not exists public.skill_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'multiple_choice', -- multiple_choice, true_false, essay, coding
  options jsonb, -- for multiple choice: [{"id": "a", "text": "...", "correct": true}, ...]
  correct_answer text, -- for true_false or single answer
  explanation text, -- explanation shown after answer
  points int default 10,
  order_number int,
  created_at timestamptz not null default now()
);

create index if not exists skill_quiz_questions_skill_id_idx on public.skill_quiz_questions(skill_id);

-- User skill assessments (attempts and results)
create table if not exists public.user_skill_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score int, -- percentage score
  passed boolean default false,
  answers jsonb, -- store user answers for review
  time_taken_seconds int,
  status text default 'in_progress', -- in_progress, completed, abandoned
  unique (user_id, skill_id) -- one active assessment per skill
);

create index if not exists user_skill_assessments_user_id_idx on public.user_skill_assessments(user_id);
create index if not exists user_skill_assessments_skill_id_idx on public.user_skill_assessments(skill_id);
create index if not exists user_skill_assessments_status_idx on public.user_skill_assessments(status);

-- User verified skills (badges)
create table if not exists public.user_verified_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  assessment_id uuid references public.user_skill_assessments(id),
  verified_at timestamptz not null default now(),
  expires_at timestamptz, -- optional: skill expires after X time
  unique (user_id, skill_id)
);

create index if not exists user_verified_skills_user_id_idx on public.user_verified_skills(user_id);
create index if not exists user_verified_skills_skill_id_idx on public.user_verified_skills(skill_id);

-- RLS Policies for Skills
alter table public.skills enable row level security;
drop policy if exists "Skills are publicly readable" on public.skills;
create policy "Skills are publicly readable"
on public.skills for select
to authenticated, anon
using (true);

alter table public.skill_quiz_questions enable row level security;
drop policy if exists "Quiz questions are publicly readable for active assessments" on public.skill_quiz_questions;
create policy "Quiz questions are publicly readable for active assessments"
on public.skill_quiz_questions for select
to authenticated
using (true);

alter table public.user_skill_assessments enable row level security;
drop policy if exists "Users can view their own assessments" on public.user_skill_assessments;
create policy "Users can view their own assessments"
on public.user_skill_assessments for select
using (auth.uid() = user_id);

drop policy if exists "Users can create assessments for themselves" on public.user_skill_assessments;
create policy "Users can create assessments for themselves"
on public.user_skill_assessments for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own assessments" on public.user_skill_assessments;
create policy "Users can update their own assessments"
on public.user_skill_assessments for update
using (auth.uid() = user_id);

alter table public.user_verified_skills enable row level security;
drop policy if exists "Users can view their own verified skills" on public.user_verified_skills;
create policy "Users can view their own verified skills"
on public.user_verified_skills for select
using (auth.uid() = user_id);

drop policy if exists "Users can view others' verified skills (public profile)" on public.user_verified_skills;
create policy "Users can view others' verified skills (public profile)"
on public.user_verified_skills for select
to authenticated, anon
using (true);

drop policy if exists "System creates verified skills after assessment" on public.user_verified_skills;
create policy "System creates verified skills after assessment"
on public.user_verified_skills for insert
with check (true);

-- Sample skills data (these would be inserted during onboarding/admin panel)
-- Skills will be created by admins, so we don't insert defaults here

-- Update profiles to include verified_skills relationship
-- profiles table already exists, just needs a view or computed query

-- Helper function to get user's verified skills
create or replace function public.get_user_verified_skills(p_user_id uuid)
returns table(skill_id uuid, skill_name text, verified_at timestamptz) language sql stable as $$
  select 
    uvs.skill_id,
    s.name,
    uvs.verified_at
  from public.user_verified_skills uvs
  join public.skills s on uvs.skill_id = s.id
  where uvs.user_id = p_user_id
  and (uvs.expires_at is null or uvs.expires_at > now())
  order by uvs.verified_at desc
$$;

-- Helper function to check if user passed a skill
create or replace function public.user_passed_skill(p_user_id uuid, p_skill_id uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.user_verified_skills
    where user_id = p_user_id
    and skill_id = p_skill_id
    and (expires_at is null or expires_at > now())
  )
$$;

-- Trigger to create verified skill badge after passing assessment
create or replace function public.create_verified_skill_on_pass()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'completed' and new.passed = true then
    insert into public.user_verified_skills (user_id, skill_id, assessment_id)
    values (new.user_id, new.skill_id, new.id)
    on conflict (user_id, skill_id) do update
    set verified_at = now(), assessment_id = excluded.assessment_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_assessment_completed on public.user_skill_assessments;
create trigger on_assessment_completed
after update on public.user_skill_assessments
for each row execute function public.create_verified_skill_on_pass();
