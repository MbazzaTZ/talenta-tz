-- ============================================================
-- CV VERIFICATION ENHANCEMENTS
-- Extend work_experience and references_list JSONB fields with
-- verification status, and add notification helpers
-- ============================================================

-- ============================================================
-- 1. Add verified_experiences column to track which work
--    experiences have been linked to a company and approved
-- ============================================================

alter table public.profiles
  add column if not exists verified_experiences jsonb default '[]'::jsonb,
  add column if not exists verified_references   jsonb default '[]'::jsonb;

comment on column public.profiles.verified_experiences is
  'Array of {company_id, job_title, verified_at} for approved work history';
comment on column public.profiles.verified_references is
  'Array of {referee_user_id, name, approved_at, recommendation} for approved referees';


-- ============================================================
-- 2. Function: notify user of a reference approval request
-- ============================================================

create or replace function public.notify_reference_request(
  p_recipient_id uuid,
  p_requester_name text,
  p_request_id uuid
)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, message, data)
  values (
    p_recipient_id,
    'reference_request',
    'Reference request from ' || p_requester_name,
    p_requester_name || ' has requested you as a reference. Please review and approve.',
    jsonb_build_object(
      'request_id', p_request_id,
      'requester_name', p_requester_name,
      'action_url', '/dashboard'
    )
  );
end;
$$;

grant execute on function public.notify_reference_request(uuid, text, uuid) to authenticated;


-- ============================================================
-- 3. Function: notify company owner of employment verification
-- ============================================================

create or replace function public.notify_employment_verification(
  p_company_owner_id uuid,
  p_employee_name text,
  p_company_name text,
  p_employee_record_id uuid
)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, message, data)
  values (
    p_company_owner_id,
    'employment_verification',
    p_employee_name || ' claims to work at ' || p_company_name,
    p_employee_name || ' has added ' || p_company_name || ' to their CV. Verify their employment to award the company badge.',
    jsonb_build_object(
      'employee_record_id', p_employee_record_id,
      'employee_name', p_employee_name,
      'company_name', p_company_name,
      'action_url', '/dashboard'
    )
  );
end;
$$;

grant execute on function public.notify_employment_verification(uuid, text, text, uuid) to authenticated;


-- ============================================================
-- 4. Function: approve a reference request and update profile
-- ============================================================

create or replace function public.approve_reference(
  p_request_id uuid,
  p_recommendation text default null,
  p_rating smallint default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  _req  public.reference_requests%rowtype;
  _name text;
begin
  -- Get request
  select * into _req from public.reference_requests where id = p_request_id;
  if not found then raise exception 'Reference request not found'; end if;

  -- Must be the employee responding
  if auth.uid() != _req.employee_id then
    raise exception 'Only the referenced person can approve';
  end if;

  -- Update request status
  update public.reference_requests set
    status          = 'completed',
    recommendation  = coalesce(p_recommendation, recommendation),
    rating          = coalesce(p_rating, rating),
    completed_at    = now(),
    responded_at    = coalesce(responded_at, now())
  where id = p_request_id;

  -- Get referee name
  select full_name into _name from public.profiles where id = _req.employee_id;

  -- Add to seeker's verified_references
  update public.profiles set
    verified_references = coalesce(verified_references, '[]'::jsonb) || jsonb_build_object(
      'referee_user_id', _req.employee_id,
      'name', _name,
      'approved_at', now()::text,
      'recommendation', p_recommendation,
      'rating', p_rating
    )
  where id = _req.seeker_id;

  -- Notify seeker
  insert into public.notifications (user_id, type, title, message, data)
  values (
    _req.seeker_id,
    'reference_approved',
    _name || ' approved your reference request',
    _name || ' has written a reference for you. It is now visible on your profile.',
    jsonb_build_object('request_id', p_request_id, 'referee_name', _name)
  );
end;
$$;

grant execute on function public.approve_reference(uuid, text, smallint) to authenticated;


-- ============================================================
-- 5. Trigger: when company_employees.verified = true,
--    notify the employee and update their verified_experiences
-- ============================================================

create or replace function public.on_employment_verified()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _co_name  text;
  _emp_name text;
begin
  -- Only fire when verified flips to true
  if new.verified = true and (old.verified = false or old.verified is null) then
    select name into _co_name  from public.companies where id = new.company_id;
    select full_name into _emp_name from public.profiles where id = new.user_id;

    -- Add to verified_experiences
    update public.profiles set
      verified_experiences = coalesce(verified_experiences, '[]'::jsonb) || jsonb_build_object(
        'company_id',   new.company_id,
        'company_name', _co_name,
        'job_title',    new.job_title,
        'department',   new.department,
        'verified_at',  now()::text
      )
    where id = new.user_id;

    -- Notify employee
    insert into public.notifications (user_id, type, title, message, data)
    values (
      new.user_id,
      'employment_verified',
      'Employment verified at ' || _co_name,
      'Your employment at ' || _co_name || ' has been verified. The company badge is now on your profile.',
      jsonb_build_object(
        'company_id',   new.company_id,
        'company_name', _co_name
      )
    );
  end if;

  -- Revoke: remove from verified_experiences
  if new.verified = false and old.verified = true then
    update public.profiles set
      verified_experiences = (
        select coalesce(jsonb_agg(exp), '[]'::jsonb)
        from jsonb_array_elements(coalesce(verified_experiences, '[]'::jsonb)) exp
        where exp->>'company_id' != new.company_id::text
      )
    where id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_employment_verified_trigger on public.company_employees;
create trigger on_employment_verified_trigger
  after update on public.company_employees
  for each row execute function public.on_employment_verified();

comment on function public.on_employment_verified() is
  'Updates verified_experiences and sends notification when employment is verified/revoked';

