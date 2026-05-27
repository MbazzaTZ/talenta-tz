-- ============================================================
-- IMPROVE SIGNUP PROFILE CREATION
-- Saves phone from signup metadata and upserts on conflict
-- so re-signup attempts don't fail silently
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
  -- Create/update profile with all available metadata from signup
  insert into public.profiles (id, full_name, avatar_url, phone)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    nullif(trim(new.raw_user_meta_data->>'phone'), '')
  )
  on conflict (id) do update set
    full_name  = coalesce(
                   nullif(trim(excluded.full_name), ''),
                   profiles.full_name,
                   split_part(new.email, '@', 1)
                 ),
    phone      = coalesce(excluded.phone, profiles.phone),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();

  -- Determine safe role — never allow admin self-assignment
  _requested_role := lower(trim(new.raw_user_meta_data->>'role'));
  _safe_role := case
    when _requested_role = 'employer'  then 'employer'::public.app_role
    when _requested_role = 'employee'  then 'employee'::public.app_role
    else 'job_seeker'::public.app_role
  end;

  -- Assign role (idempotent)
  insert into public.user_roles (user_id, role)
  values (new.id, _safe_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Auto-creates/updates profile on signup with full_name, phone, avatar. Admin role cannot be self-assigned.';

