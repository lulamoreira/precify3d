-- Check if role column exists in profiles, if not add it or ensure it's used correctly.
-- Assuming profiles table exists based on previous code view.

UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '7da142b9-3fce-43f8-80f5-b96c270bab25';

-- If the profile doesn't exist yet (though it should if they logged in), we might need an insert.
-- But usually, a trigger handles profile creation.
