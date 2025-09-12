-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Allow all operations on task_candidates" ON public.task_candidates;
DROP POLICY IF EXISTS "Allow public read access to task_candidates" ON public.task_candidates;
DROP POLICY IF EXISTS "Users can view their own task candidates" ON public.task_candidates;
DROP POLICY IF EXISTS "Users can create their own task candidates" ON public.task_candidates;
DROP POLICY IF EXISTS "Users can update their own task candidates" ON public.task_candidates;
DROP POLICY IF EXISTS "Users can delete their own task candidates" ON public.task_candidates;

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
    UPDATE public.task_candidates 
    SET created_by = first_user_id 
    WHERE created_by IS NULL;
END $$;

-- Set the default for future records
ALTER TABLE public.task_candidates 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Make created_by required to prevent security bypass
ALTER TABLE public.task_candidates 
ALTER COLUMN created_by SET NOT NULL;

-- Create secure RLS policies for task_candidates table
CREATE POLICY "Users can view their own task candidates" 
ON public.task_candidates 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own task candidates" 
ON public.task_candidates 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own task candidates" 
ON public.task_candidates 
FOR UPDATE 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own task candidates" 
ON public.task_candidates 
FOR DELETE 
USING (auth.uid() = created_by);