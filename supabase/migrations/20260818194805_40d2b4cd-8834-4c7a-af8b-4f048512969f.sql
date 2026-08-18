
-- Fix security linter warnings
-- Revoke execute from public/anon for security definer functions
ALTER FUNCTION public.has_role(uuid, text) SET search_path = public;
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.protect_profile_critical_fields() SET search_path = public;

REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_profile_critical_fields() FROM PUBLIC;

-- Re-grant execute to authenticated for specific functions they need
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Ensure service_role can execute everything
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.protect_profile_critical_fields() TO service_role;
