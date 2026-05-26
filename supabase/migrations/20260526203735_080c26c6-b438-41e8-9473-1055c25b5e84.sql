-- 1. Tables creation
CREATE TABLE public.user_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    kwh NUMERIC NOT NULL DEFAULT 0.75,
    watt NUMERIC NOT NULL DEFAULT 250,
    labor NUMERIC NOT NULL DEFAULT 25,
    machine NUMERIC NOT NULL DEFAULT 5,
    margin NUMERIC NOT NULL DEFAULT 60,
    failure NUMERIC NOT NULL DEFAULT 5,
    packaging NUMERIC NOT NULL DEFAULT 2,
    platform_fee NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.materials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_per_kg NUMERIC NOT NULL,
    color TEXT NOT NULL DEFAULT '#f97316',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.quotes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client TEXT,
    project TEXT,
    material_name TEXT NOT NULL,
    weight_g NUMERIC NOT NULL,
    time_hours NUMERIC NOT NULL,
    failure_pct NUMERIC NOT NULL,
    margin_pct NUMERIC NOT NULL,
    discount_pct NUMERIC NOT NULL,
    packaging NUMERIC NOT NULL,
    platform_fee NUMERIC NOT NULL,
    platform_name TEXT,
    cost_material NUMERIC NOT NULL,
    cost_energy NUMERIC NOT NULL,
    cost_labor NUMERIC NOT NULL,
    cost_machine NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    margin_value NUMERIC NOT NULL,
    platform_fee_value NUMERIC NOT NULL,
    discount_value NUMERIC NOT NULL,
    final_price NUMERIC NOT NULL,
    profit NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;

-- 3. Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
CREATE POLICY "Users can manage their own settings" ON public.user_settings
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own materials" ON public.materials
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own quotes" ON public.quotes
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Helper function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materials_updated_at
BEFORE UPDATE ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Function to handle new user setup (default settings and materials)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default settings
    INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
    
    -- Insert default materials
    INSERT INTO public.materials (user_id, name, price_per_kg, color) VALUES 
    (NEW.id, 'PLA', 80, '#4ade80'),
    (NEW.id, 'PLA+', 95, '#22c55e'),
    (NEW.id, 'ABS', 90, '#f87171'),
    (NEW.id, 'PETG', 100, '#38bdf8'),
    (NEW.id, 'TPU', 130, '#a855f7'),
    (NEW.id, 'PLA Silk', 110, '#f472b6'),
    (NEW.id, 'Resina Std', 150, '#fbbf24'),
    (NEW.id, 'Resina ABS-Like', 180, '#d946ef');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to call handle_new_user when a user is created in auth.users
-- This requires a trigger on auth.users which is in the auth schema
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
