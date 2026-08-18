-- Part A: Tracking columns for 3D files
ALTER TABLE public.quote_items 
ADD COLUMN IF NOT EXISTS stl_path TEXT,
ADD COLUMN IF NOT EXISTS stl_filename TEXT,
ADD COLUMN IF NOT EXISTS stl_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS stl_hash TEXT;

ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS store_files BOOLEAN DEFAULT true;

-- Part B: Public access columns
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS public_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

-- Function to safely fetch public quote data
CREATE OR REPLACE FUNCTION public.get_public_quote(_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    quote_id UUID;
    is_rascunho BOOLEAN;
BEGIN
    -- Find the quote
    SELECT id, (status = 'rascunho') INTO quote_id, is_rascunho
    FROM public.quotes
    WHERE public_token = _token 
      AND (public_expires_at IS NULL OR public_expires_at > now());

    IF quote_id IS NULL OR is_rascunho THEN
        RETURN NULL;
    END IF;

    -- Update viewed_at if it's the first time
    UPDATE public.quotes 
    SET viewed_at = now() 
    WHERE id = quote_id AND viewed_at IS NULL;

    -- Build the safe JSON result
    SELECT json_build_object(
        'numero', q.quote_number,
        'data', q.created_at,
        'validade', q.valid_until,
        'titulo', q.title,
        'observacoes_publicas', q.public_notes,
        'prazo', q.delivery_days,
        'condicoes', q.payment_terms,
        'empresa', json_build_object(
            'nome', p.company_name,
            'logo_path', p.company_logo_path,
            'cor', p.brand_color,
            'contato', p.phone
        ),
        'cliente', json_build_object(
            'nome', c.name,
            'empresa', c.company
        ),
        'itens', (
            SELECT json_agg(json_build_object(
                'name', qi.name,
                'description', qi.description,
                'material_name', qi.material_name,
                'quantity', qi.quantity,
                'unit_price', qi.unit_price,
                'total_price', qi.total_price
            ))
            FROM public.quote_items qi
            WHERE qi.quote_id = q.id
        ),
        'financeiro', json_build_object(
            'subtotal', q.final_price - q.shipping_price + COALESCE(q.discount_amount, 0),
            'frete', q.shipping_price,
            'desconto', q.discount_amount,
            'total', q.final_price
        )
    ) INTO result
    FROM public.quotes q
    LEFT JOIN public.profiles p ON p.id = q.user_id
    LEFT JOIN public.clients c ON c.id = q.client_id
    WHERE q.id = quote_id;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_quote(TEXT) TO anon, authenticated;
