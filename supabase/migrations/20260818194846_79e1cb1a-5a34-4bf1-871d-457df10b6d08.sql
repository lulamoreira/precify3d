
-- Create Plans Table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_month NUMERIC NOT NULL DEFAULT 0,
    price_year NUMERIC NOT NULL DEFAULT 0,
    daily_quota INTEGER, -- NULL = ilimitado
    trial_days INTEGER DEFAULT 7,
    features JSONB DEFAULT '[]',
    is_free BOOLEAN NOT NULL DEFAULT false,
    stripe_product_id TEXT,
    stripe_price_month_id TEXT,
    stripe_price_year_id TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (daily_quota IS NULL OR daily_quota >= 0),
    CHECK (price_month >= 0),
    CHECK (price_year >= 0)
);

-- Ensure only one free plan
CREATE UNIQUE INDEX IF NOT EXISTS one_free_plan_idx ON public.plans (is_free) WHERE (is_free = true);

GRANT SELECT ON public.plans TO authenticated, anon;
GRANT ALL ON public.plans TO service_role;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" 
ON public.plans FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage plans"
ON public.plans FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- Plan Price History
CREATE TABLE IF NOT EXISTS public.plan_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
    price_month NUMERIC NOT NULL,
    price_year NUMERIC NOT NULL,
    stripe_price_month_id TEXT,
    stripe_price_year_id TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.plan_price_history TO authenticated;
GRANT ALL ON public.plan_price_history TO service_role;

ALTER TABLE public.plan_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view price history"
ON public.plan_price_history FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_code TEXT NOT NULL REFERENCES public.plans(code),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    status TEXT NOT NULL DEFAULT 'free', -- 'trialing','active','past_due','canceled','free'
    billing_period TEXT CHECK (billing_period IN ('month', 'year')),
    trial_ends_at TIMESTAMPTZ,
    current_period_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Usage Events Table (Ledger)
CREATE TABLE IF NOT EXISTS public.usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fingerprint TEXT NOT NULL,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    label TEXT
);

CREATE INDEX IF NOT EXISTS usage_events_user_period_idx ON public.usage_events (user_id, period_start);
CREATE INDEX IF NOT EXISTS usage_events_dedupe_idx ON public.usage_events (user_id, fingerprint, created_at DESC);

GRANT SELECT ON public.usage_events TO authenticated;
GRANT INSERT ON public.usage_events TO authenticated; -- Allow insertion via consume_pricing? No, consume_pricing will be security definer.
GRANT ALL ON public.usage_events TO service_role;

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage events"
ON public.usage_events FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Initial Seeds
INSERT INTO public.plans (code, name, description, price_month, price_year, daily_quota, trial_days, is_free, sort_order)
VALUES 
  ('free', 'Grátis', 'Ideal para iniciantes e hobby', 0, 0, 5, 0, true, 0),
  ('maker', 'Maker', 'Para quem imprime com frequência', 9.90, 99.00, 20, 7, false, 1),
  ('studio', 'Studio', 'Profissionais com alta demanda', 19.90, 199.00, 60, 7, false, 2),
  ('unlimited', 'Unlimited', 'Cálculos ilimitados para empresas', 29.90, 299.00, NULL, 7, false, 3)
ON CONFLICT (code) DO NOTHING;

-- Day Start Function (São Paulo)
CREATE OR REPLACE FUNCTION public.current_day_start() RETURNS DATE 
LANGUAGE sql STABLE AS $$
  SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date
$$;

-- consume_pricing Function
CREATE OR REPLACE FUNCTION public.consume_pricing(_fingerprint text, _label text DEFAULT NULL)
RETURNS TABLE(allowed boolean, unlimited boolean, quota int, used int, remaining int, reused boolean, resets_at timestamptz)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid;
  _sub record;
  _plan record;
  _used int;
  _daily_quota int;
  _is_unlimited boolean;
  _reused boolean := false;
  _resets_at timestamptz;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Owner always allowed and unlimited
  IF public.has_role(_uid, 'owner') THEN
    RETURN QUERY SELECT true, true, NULL::int, 0, NULL::int, false, (now() AT TIME ZONE 'America/Sao_Paulo' + interval '1 day')::date::timestamptz AT TIME ZONE 'America/Sao_Paulo';
    RETURN;
  END IF;

  -- 2. Get Subscription and Plan
  SELECT * INTO _sub FROM public.subscriptions WHERE user_id = _uid;
  
  -- Fallback to free plan if no sub
  IF NOT FOUND THEN
    SELECT * INTO _plan FROM public.plans WHERE is_free = true LIMIT 1;
  ELSE
    SELECT * INTO _plan FROM public.plans WHERE code = _sub.plan_code;
    
    -- Check if trial/active
    IF NOT ((_sub.status = 'trialing' AND _sub.trial_ends_at > now()) OR 
            (_sub.status = 'active' AND _sub.current_period_ends_at > now())) THEN
       SELECT * INTO _plan FROM public.plans WHERE is_free = true LIMIT 1;
    END IF;
  END IF;

  _daily_quota := _plan.daily_quota;
  _is_unlimited := (_daily_quota IS NULL);
  _resets_at := (public.current_day_start() + interval '1 day')::timestamptz AT TIME ZONE 'America/Sao_Paulo';

  -- 3. Dedupe (24h window for same piece)
  SELECT EXISTS (
    SELECT 1 FROM public.usage_events 
    WHERE user_id = _uid AND fingerprint = _fingerprint 
    AND created_at > now() - interval '24 hours'
  ) INTO _reused;

  IF _reused THEN
    -- Count used today for response even if reused
    SELECT count(*)::int INTO _used FROM public.usage_events WHERE user_id = _uid AND period_start = public.current_day_start();
    RETURN QUERY SELECT true, _is_unlimited, _daily_quota, _used, CASE WHEN _is_unlimited THEN NULL ELSE _daily_quota - _used END, true, _resets_at;
    RETURN;
  END IF;

  -- 4. Count usage today
  SELECT count(*)::int INTO _used FROM public.usage_events WHERE user_id = _uid AND period_start = public.current_day_start();

  -- 5. Check Quota
  IF NOT _is_unlimited AND _used >= _daily_quota THEN
    RETURN QUERY SELECT false, _is_unlimited, _daily_quota, _used, 0, false, _resets_at;
    RETURN;
  END IF;

  -- 6. Insert Event
  INSERT INTO public.usage_events (user_id, fingerprint, period_start, label)
  VALUES (_uid, _fingerprint, public.current_day_start(), _label);

  _used := _used + 1;
  RETURN QUERY SELECT true, _is_unlimited, _daily_quota, _used, CASE WHEN _is_unlimited THEN NULL ELSE _daily_quota - _used END, false, _resets_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_pricing(text, text) TO authenticated;

-- quota_status Function
CREATE OR REPLACE FUNCTION public.quota_status() 
RETURNS TABLE(plan_code text, plan_name text, status text, daily_quota int, used int, remaining int, unlimited boolean, resets_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid;
  _sub record;
  _plan record;
  _used int;
  _daily_quota int;
  _is_unlimited boolean;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN RETURN; END IF;

  IF public.has_role(_uid, 'owner') THEN
    RETURN QUERY SELECT 'unlimited'::text, 'Proprietário'::text, 'active'::text, NULL::int, 0, NULL::int, true, (public.current_day_start() + interval '1 day')::timestamptz AT TIME ZONE 'America/Sao_Paulo';
    RETURN;
  END IF;

  SELECT * INTO _sub FROM public.subscriptions WHERE user_id = _uid;
  
  IF NOT FOUND THEN
    SELECT * INTO _plan FROM public.plans WHERE is_free = true LIMIT 1;
    _sub := (SELECT x FROM (SELECT 'free' as status, 'free' as plan_code) x);
  ELSE
    SELECT * INTO _plan FROM public.plans WHERE code = _sub.plan_code;
    IF NOT ((_sub.status = 'trialing' AND _sub.trial_ends_at > now()) OR 
            (_sub.status = 'active' AND _sub.current_period_ends_at > now())) THEN
       SELECT * INTO _plan FROM public.plans WHERE is_free = true LIMIT 1;
    END IF;
  END IF;

  _daily_quota := _plan.daily_quota;
  _is_unlimited := (_daily_quota IS NULL);
  SELECT count(*)::int INTO _used FROM public.usage_events WHERE user_id = _uid AND period_start = public.current_day_start();

  RETURN QUERY SELECT 
    _plan.code, 
    _plan.name, 
    COALESCE(_sub.status, 'free'), 
    _daily_quota, 
    _used, 
    CASE WHEN _is_unlimited THEN NULL ELSE _daily_quota - _used END, 
    _is_unlimited, 
    (public.current_day_start() + interval '1 day')::timestamptz AT TIME ZONE 'America/Sao_Paulo';
END;
$$;

GRANT EXECUTE ON FUNCTION public.quota_status() TO authenticated;

-- Migration for existing users: give them 30 days unlimited trial
INSERT INTO public.subscriptions (user_id, plan_code, status, trial_ends_at)
SELECT id, 'unlimited', 'trialing', now() + interval '30 days'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
