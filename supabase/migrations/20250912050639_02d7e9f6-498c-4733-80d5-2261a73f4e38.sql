-- Add RLS policy to allow public read access to task_candidates
CREATE POLICY "Allow public read access to task_candidates" 
ON public.task_candidates 
FOR SELECT 
TO anon, authenticated 
USING (true);