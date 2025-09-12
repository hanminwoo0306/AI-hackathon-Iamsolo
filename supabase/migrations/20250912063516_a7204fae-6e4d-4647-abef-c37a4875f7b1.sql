-- Drop the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Allow all operations on content_assets" ON public.content_assets;

-- Create secure RLS policies for content_assets table
CREATE POLICY "Users can view their own content assets" 
ON public.content_assets 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own content assets" 
ON public.content_assets 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own content assets" 
ON public.content_assets 
FOR UPDATE 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own content assets" 
ON public.content_assets 
FOR DELETE 
USING (auth.uid() = created_by);

-- Ensure created_by is set to the current user by default
ALTER TABLE public.content_assets 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Make created_by required to prevent security bypass
ALTER TABLE public.content_assets 
ALTER COLUMN created_by SET NOT NULL;