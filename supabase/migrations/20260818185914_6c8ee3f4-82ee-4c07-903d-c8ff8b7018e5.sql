-- Add classification columns to quotes table
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'simulacao' CHECK (kind IN ('simulacao','orcamento'));
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'nao_classificado' CHECK (status IN ('nao_classificado','simulacao','rascunho','enviado','aprovado','entregue','recusado','expirado','cancelado'));
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS sold_price NUMERIC;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS sold_profit NUMERIC;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS lost_reason TEXT CHECK (lost_reason IN ('preco','prazo','desistiu','sem_resposta','outro'));

-- Backfill existing records
UPDATE public.quotes SET status = 'nao_classificado' WHERE status IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS quotes_user_status_idx ON public.quotes (user_id, status, created_at DESC);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
