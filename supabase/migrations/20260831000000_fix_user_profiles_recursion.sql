-- Fix infinite recursion on user_profiles table RLS policies

-- 1. Drop all existing policies on user_profiles
DO  
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', pol.policyname);
    END LOOP; 
END ;

-- 2. Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Recreate clean, non-recursive RLS policies
CREATE POLICY "user_profiles_select_policy" 
ON user_profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_policy" 
ON user_profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy" 
ON user_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_delete_policy" 
ON user_profiles FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
