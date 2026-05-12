/*
  # Fix update_last_login trigger function search_path

  1. Problem
    - The `update_last_login()` function fires on auth.sessions INSERT
    - It references `user_profiles` without schema qualification
    - The calling role (supabase_auth_admin) has search_path=auth
    - This causes the function to look for auth.user_profiles (doesn't exist)
    - Result: "Database error granting user" on every login attempt

  2. Fix
    - Recreate the function with SET search_path = public
    - This ensures user_profiles always resolves to public.user_profiles
*/

CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_profiles
  SET last_login = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;
