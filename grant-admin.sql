-- ============================================================================
-- GRANT ADMIN ACCESS
-- User: mbazzacodes@gmail.com
-- UID:  1adc1f78-59e4-49bf-904f-8722352701ff
-- Run in Supabase SQL Editor.
-- ============================================================================

insert into public.user_roles (user_id, role)
values ('1adc1f78-59e4-49bf-904f-8722352701ff', 'admin')
on conflict (user_id, role) do nothing;

-- Verify it worked:
select ur.role, p.full_name
from public.user_roles ur
left join public.profiles p on p.id = ur.user_id
where ur.user_id = '1adc1f78-59e4-49bf-904f-8722352701ff';
