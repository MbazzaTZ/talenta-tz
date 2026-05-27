-- ============================================================
-- SOCIAL FEATURES: Avatar, Posts, Follows
-- ============================================================


-- ============================================================
-- 1. Add avatar_url to profiles (already exists in schema
--    but not being returned — just add index)
-- ============================================================

create index if not exists profiles_avatar_url_idx
  on public.profiles(id) where avatar_url is not null;


-- ============================================================
-- 2. Storage bucket for avatars (run in Supabase dashboard
--    Storage tab if bucket doesn't exist)
-- ============================================================
-- NOTE: Create a public bucket named 'avatars' in Supabase Storage
-- with the following policies (shown below as SQL for reference):

-- Allow authenticated users to upload their own avatar
-- create policy "Users upload own avatar"
--   on storage.objects for insert
--   with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read of all avatars
-- create policy "Avatars are publicly readable"
--   on storage.objects for select
--   using (bucket_id = 'avatars');

-- Allow users to update/delete their own avatar
-- create policy "Users update own avatar"
--   on storage.objects for update
--   using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- create policy "Users delete own avatar"
--   on storage.objects for delete
--   using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);


-- ============================================================
-- 3. Follow target type enum
-- ============================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'follow_target_type') then
    create type public.follow_target_type as enum (
      'job_seeker',
      'employer',
      'employee',
      'company',
      'agency'
    );
  end if;
end $$;


-- ============================================================
-- 4. Follows table
--    A user (follower) follows a target (user or company)
-- ============================================================

create table if not exists public.follows (
  id            uuid        primary key default gen_random_uuid(),
  follower_id   uuid        not null references auth.users(id) on delete cascade,
  -- Target: either a user or a company
  target_user_id    uuid    references auth.users(id) on delete cascade,
  target_company_id uuid    references public.companies(id) on delete cascade,
  target_type   public.follow_target_type not null,
  created_at    timestamptz not null default now(),
  -- Must follow either a user OR a company, not both
  constraint follows_target_check check (
    (target_user_id is not null and target_company_id is null) or
    (target_user_id is null and target_company_id is not null)
  ),
  -- Prevent duplicate follows
  unique (follower_id, target_user_id),
  unique (follower_id, target_company_id)
);

create index if not exists follows_follower_id_idx      on public.follows(follower_id);
create index if not exists follows_target_user_id_idx   on public.follows(target_user_id);
create index if not exists follows_target_company_id_idx on public.follows(target_company_id);
create index if not exists follows_target_type_idx      on public.follows(target_type);

alter table public.follows enable row level security;

drop policy if exists "Users see their own follows"    on public.follows;
drop policy if exists "Anyone can see follows"         on public.follows;
drop policy if exists "Users follow others"            on public.follows;
drop policy if exists "Users unfollow"                 on public.follows;

-- Anyone can see follow relationships (public social graph)
drop policy if exists "Anyone can see follows" on public.follows;
create policy "Anyone can see follows" on public.follows
  for select using (true);

-- Authenticated users can follow
drop policy if exists "Users follow others" on public.follows;
create policy "Users follow others" on public.follows
  for insert with check (auth.uid() = follower_id);

-- Users can unfollow (delete their own follows)
drop policy if exists "Users unfollow" on public.follows;
create policy "Users unfollow" on public.follows
  for delete using (auth.uid() = follower_id);

grant select on public.follows to anon;
grant select, insert, delete on public.follows to authenticated;

comment on table public.follows
  is 'Social graph — users follow other users or companies';


-- ============================================================
-- 5. Posts table (profile feed posts)
-- ============================================================

create table if not exists public.posts (
  id           uuid        primary key default gen_random_uuid(),
  author_id    uuid        not null references auth.users(id) on delete cascade,
  content      text        not null check (char_length(trim(content)) >= 1 and char_length(content) <= 3000),
  image_url    text,
  post_type    text        not null default 'update'
    check (post_type in ('update', 'achievement', 'job_search', 'hiring', 'article')),
  -- Optional job/company context
  related_job_id     uuid references public.jobs(id) on delete set null,
  related_company_id uuid references public.companies(id) on delete set null,
  likes_count  integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists posts_author_id_idx  on public.posts(author_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_type_idx       on public.posts(post_type);

alter table public.posts enable row level security;

drop policy if exists "Posts are publicly readable" on public.posts;
drop policy if exists "Authors create posts"        on public.posts;
drop policy if exists "Authors update own posts"    on public.posts;
drop policy if exists "Authors delete own posts"    on public.posts;

drop policy if exists "Posts are publicly readable" on public.posts;
create policy "Posts are publicly readable" on public.posts
  for select using (true);

drop policy if exists "Authors create posts" on public.posts;
create policy "Authors create posts" on public.posts
  for insert with check (auth.uid() = author_id);

drop policy if exists "Authors update own posts" on public.posts;
create policy "Authors update own posts" on public.posts
  for update using (auth.uid() = author_id);

drop policy if exists "Authors delete own posts" on public.posts;
create policy "Authors delete own posts" on public.posts
  for delete using (auth.uid() = author_id);

grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;


-- ============================================================
-- 6. Post likes table
-- ============================================================

create table if not exists public.post_likes (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.posts(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists post_likes_post_id_idx on public.post_likes(post_id);
create index if not exists post_likes_user_id_idx on public.post_likes(user_id);

alter table public.post_likes enable row level security;

drop policy if exists "Likes are readable" on public.post_likes;
create policy "Likes are readable" on public.post_likes for select using (true);
drop policy if exists "Users like posts" on public.post_likes;
create policy "Users like posts"   on public.post_likes for insert with check (auth.uid() = user_id);
drop policy if exists "Users unlike posts" on public.post_likes;
create policy "Users unlike posts" on public.post_likes for delete  using (auth.uid() = user_id);

grant select on public.post_likes to anon;
grant select, insert, delete on public.post_likes to authenticated;

-- Trigger to keep likes_count in sync
create or replace function public.sync_post_likes_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists sync_post_likes on public.post_likes;
create trigger sync_post_likes
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_likes_count();


-- ============================================================
-- 7. Helper functions for follow counts
-- ============================================================

create or replace function public.get_follow_counts(p_user_id uuid)
returns table (
  following_total     bigint,
  following_seekers   bigint,
  following_employers bigint,
  following_employees bigint,
  following_companies bigint,
  following_agencies  bigint,
  followers_total     bigint
)
language sql stable security definer set search_path = public as $$
  select
    count(*) filter (where follower_id = p_user_id)                                          as following_total,
    count(*) filter (where follower_id = p_user_id and target_type = 'job_seeker')           as following_seekers,
    count(*) filter (where follower_id = p_user_id and target_type = 'employer')             as following_employers,
    count(*) filter (where follower_id = p_user_id and target_type = 'employee')             as following_employees,
    count(*) filter (where follower_id = p_user_id and target_type = 'company')              as following_companies,
    count(*) filter (where follower_id = p_user_id and target_type = 'agency')               as following_agencies,
    count(*) filter (where target_user_id = p_user_id)                                       as followers_total
  from public.follows;
$$;

grant execute on function public.get_follow_counts(uuid) to anon, authenticated;

comment on function public.get_follow_counts(uuid)
  is 'Returns following/follower counts broken down by target type';


-- ============================================================
-- 8. updated_at trigger for posts
-- ============================================================

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();
