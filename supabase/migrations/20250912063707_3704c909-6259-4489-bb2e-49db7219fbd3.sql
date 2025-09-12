-- Drop the overly permissive policies that allow public access
DROP POLICY IF EXISTS "Allow all operations on task_candidates" ON public.task_candidates;
DROP POLICY IF EXISTS "Allow public read access to task_candidates" ON public.task_candidates;

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

-- Ensure created_by is set to the current user by default
ALTER TABLE public.task_candidates 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Make created_by required to prevent security bypass
ALTER TABLE public.task_candidates 
ALTER COLUMN created_by SET NOT NULL;