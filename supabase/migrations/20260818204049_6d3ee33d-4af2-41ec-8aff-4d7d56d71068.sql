
-- PARTE A: Tabela de Cupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  duration TEXT NOT NULL DEFAULT 'once' CHECK (duration IN ('once','repeating','forever')),
  duration_months INTEGER,
  max_redemptions INTEGER,
  times_redeemed INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  plan_codes TEXT[],
  stripe_coupon_id TEXT,
  stripe_promotion_code_id TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_percent_range CHECK (
    (discount_type = 'percent' AND discount_value >= 1 AND discount_value <= 100) OR
    (discount_type = 'fixed')
  )
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

-- Policies para coupons
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- PARTE C: Indice Unico para is_free
CREATE UNIQUE INDEX IF NOT EXISTS plans_is_free_unique_idx ON public.plans (is_free) WHERE is_free = true;
