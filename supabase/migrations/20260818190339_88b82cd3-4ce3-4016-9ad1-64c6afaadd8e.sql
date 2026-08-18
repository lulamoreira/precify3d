-- Parte A: Tabelas de Clientes e Itens de Orçamento
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  document TEXT,
  address TEXT,
  logo_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  material_name TEXT,
  weight_g NUMERIC,
  time_hours NUMERIC,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  cost_direct NUMERIC,
  profit NUMERIC,
  stl_path TEXT,
  stl_filename TEXT,
  stl_size_bytes BIGINT,
  preview_png TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alterações na tabela quotes
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS quote_number TEXT,
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS valid_until DATE,
ADD COLUMN IF NOT EXISTS delivery_days INTEGER,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS shipping_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS public_notes TEXT,
ADD COLUMN IF NOT EXISTS title TEXT;

-- Alterações na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_logo_path TEXT,
ADD COLUMN IF NOT EXISTS company_document TEXT,
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#f97316',
ADD COLUMN IF NOT EXISTS quote_counter INTEGER NOT NULL DEFAULT 0;

-- RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO authenticated;
GRANT ALL ON public.quote_items TO service_role;

CREATE POLICY "Users can manage their own clients" ON public.clients
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own quote items" ON public.quote_items
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON public.clients (user_id);
CREATE INDEX IF NOT EXISTS quote_items_quote_id_idx ON public.quote_items (quote_id);
CREATE INDEX IF NOT EXISTS quotes_user_created_at_idx ON public.quotes (user_id, created_at DESC);

-- Função de numeração de orçamento
CREATE OR REPLACE FUNCTION public.next_quote_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_counter INTEGER;
BEGIN
  UPDATE profiles 
  SET quote_counter = quote_counter + 1 
  WHERE id = auth.uid()
  RETURNING quote_counter INTO new_counter;
  
  RETURN to_char(now(), 'YYYY') || '-' || lpad(new_counter::text, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_quote_number() TO authenticated;
