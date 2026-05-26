-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Use GRANT to set permissions for different roles
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies (DROP if exists to avoid errors)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Update the handle_new_user function to include profile creation and admin logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Check how many profiles already exist
    SELECT count(*) INTO user_count FROM public.profiles;

    -- Create user profile
    INSERT INTO public.profiles (id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        CASE WHEN user_count = 0 THEN 'admin' ELSE 'user' END
    );

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

-- Ensure the trigger is on updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();