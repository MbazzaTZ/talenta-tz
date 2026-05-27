-- Revoke execute permissions from public/anonymous users for security functions
-- This prevents unauthorized execution of sensitive functions

revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- Grant execute only to postgres role (owner) and specific trusted functions
grant execute on function public.has_role(uuid, public.app_role) to postgres;
grant execute on function public.handle_new_user() to postgres;

-- Add comment explaining the security change
comment on function public.has_role(uuid, public.app_role) is 'Internal function - execute revoked from public for security';
comment on function public.handle_new_user() is 'Internal trigger function - execute revoked from public for security';

-- Note: These functions are still accessible through RLS policies and triggers
-- The revoke only prevents direct execution by anonymous/authenticated users