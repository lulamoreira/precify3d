
-- Fix security linter warnings for new functions
ALTER FUNCTION public.consume_pricing(text, text) SET search_path = public;
ALTER FUNCTION public.quota_status() SET search_path = public;
ALTER FUNCTION public.current_day_start() SET search_path = public;

REVOKE ALL ON FUNCTION public.consume_pricing(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.quota_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_day_start() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.consume_pricing(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.quota_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_day_start() TO authenticated;
