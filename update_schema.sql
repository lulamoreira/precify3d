-- Step 1: Update user_settings
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS fixed_time_share NUMERIC NOT NULL DEFAULT 0.15;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS hours_per_day NUMERIC NOT NULL DEFAULT 20;

-- Step 2: Update quotes
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS pieces_per_plate INTEGER;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS total_pieces INTEGER;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS plate_time_hours NUMERIC;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS single_time_hours NUMERIC;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS partial_plate_hours NUMERIC;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS total_print_hours NUMERIC;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS time_source TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS weight_input_mode TEXT;

-- Step 3: Update quote_items
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS pieces_per_plate INTEGER;
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS total_pieces INTEGER;
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS plate_time_hours NUMERIC;
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS single_time_hours NUMERIC;
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS partial_plate_hours NUMERIC;
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS total_print_hours NUMERIC;
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS time_source TEXT;
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS weight_input_mode TEXT;
