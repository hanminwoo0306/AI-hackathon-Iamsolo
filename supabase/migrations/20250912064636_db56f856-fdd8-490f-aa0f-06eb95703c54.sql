-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Allow all operations on feedback_sources" ON public.feedback_sources;
DROP POLICY IF EXISTS "Users can view their own feedback sources" ON public.feedback_sources;
DROP POLICY IF EXISTS "Users can create their own feedback sources" ON public.feedback_sources;
DROP POLICY IF EXISTS "Users can update their own feedback sources" ON public.feedback_sources;
DROP POLICY IF EXISTS "Users can delete their own feedback sources" ON public.feedback_sources;

-- Update NULL created_by values to the first available user
DO $$
DECLARE
    first_user_id uuid;
BEGIN
    -- Try to get the first user from auth.users
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    -- If no users exist, we'll create a system placeholder
    IF first_user_id IS NULL THEN
        first_user_id := gen_random_uuid();
    END IF;
    
    -- Update all NULL created_by values to the first user
    UPDATE public.feedback_sources 
    SET created_by = first_user_id 
    WHERE created_by IS NULL;
END $$;

-- Set the default for future records
ALTER TABLE public.feedback_sources 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Make created_by required to prevent security bypass
ALTER TABLE public.feedback_sources 
ALTER COLUMN created_by SET NOT NULL;

-- Create secure RLS policies for feedback_sources table
CREATE POLICY "Users can view their own feedback sources" 
ON public.feedback_sources 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own feedback sources" 
ON public.feedback_sources 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own feedback sources" 
ON public.feedback_sources 
FOR UPDATE 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own feedback sources" 
ON public.feedback_sources 
FOR DELETE 
USING (auth.uid() = created_by);