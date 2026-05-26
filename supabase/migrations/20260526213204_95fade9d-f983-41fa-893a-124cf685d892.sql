-- Add INSERT policy for profiles
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Update the existing handle_new_user function to ensure lula1973@gmail.com is admin
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
        CASE 
            WHEN NEW.email = 'lula1973@gmail.com' THEN 'admin'
            WHEN user_count = 0 THEN 'admin' 
            ELSE 'user' 
        END
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
$$ LANGUAGE plpgsql SECURITY DEFINER;