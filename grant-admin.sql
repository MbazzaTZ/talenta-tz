-- Grant admin without relying on a unique constraint
insert into public.user_roles (user_id, role)
select '1adc1f78-59e4-49bf-904f-8722352701ff', 'admin'
where not exists (
  select 1 from public.user_roles
  where user_id = '1adc1f78-59e4-49bf-904f-8722352701ff'
    and role = 'admin'
);

-- Verify
select ur.role, p.full_name
from public.user_roles ur
left join public.profiles p on p.id = ur.user_id
where ur.user_id = '1adc1f78-59e4-49bf-904f-8722352701ff';
