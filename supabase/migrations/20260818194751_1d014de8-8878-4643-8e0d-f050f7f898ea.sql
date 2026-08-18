
-- 1. Create user_roles
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 2. Function has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role::public.app_role)
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;

-- Policy de SELECT: o usuário lê os próprios papéis, ou se for admin/owner
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- 3. Function is_admin (rewrite)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'owner')
$$;

-- 4. Migrate roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::text::public.app_role FROM public.profiles
ON CONFLICT DO NOTHING;

-- Garantir owner para lula1973@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::public.app_role FROM auth.users WHERE email = 'lula1973@gmail.com'
ON CONFLICT (user_id, role) DO UPDATE SET role = 'owner'::public.app_role;

-- 5. Lock profiles with trigger
CREATE OR REPLACE FUNCTION public.protect_profile_critical_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não for service_role, impedir alteração de campos críticos
  IF (current_setting('role') <> 'service_role') THEN
    NEW.role := OLD.role;
    NEW.id := OLD.id;
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_protect_profile_fields ON public.profiles;
CREATE TRIGGER tr_protect_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_critical_fields();

-- Update current profile policy to include WITH CHECK
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Update handle_new_user to use user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_first_user boolean;
BEGIN
  SELECT count(*) = 0 INTO is_first_user FROM auth.users;

  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, CASE WHEN is_first_user THEN 'owner' ELSE 'user' END);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, CASE WHEN is_first_user THEN 'owner' ELSE 'user' END);

  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);

  -- Inserir materiais padrão
  INSERT INTO public.materials (user_id, name, type, density, price_per_kg, color_hex)
  VALUES 
    (new.id, 'PLA Basic', 'filament', 1.24, 120, '#ffffff'),
    (new.id, 'PLA Silk', 'filament', 1.24, 150, '#ffd700'),
    (new.id, 'PETG', 'filament', 1.27, 130, '#3b82f6'),
    (new.id, 'ABS', 'filament', 1.04, 110, '#1f2937'),
    (new.id, 'Resina Standard', 'resin', 1.10, 180, '#94a3b8'),
    (new.id, 'Resina Tough', 'resin', 1.15, 250, '#475569'),
    (new.id, 'ASA', 'filament', 1.07, 160, '#ef4444'),
    (new.id, 'TPU 95A', 'filament', 1.21, 190, '#10b981');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
