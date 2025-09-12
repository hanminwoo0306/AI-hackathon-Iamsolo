-- Create feedback sources table (stores Google Spreadsheets URLs)
CREATE TABLE public.feedback_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source_url TEXT NOT NULL, -- Google Spreadsheets URL
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task candidates table
CREATE TABLE public.task_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_feedback_id UUID REFERENCES public.feedback_sources(id) ON DELETE CASCADE,
  frequency_score INTEGER DEFAULT 0,
  impact_score INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create PRD drafts table
CREATE TABLE public.prd_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.task_candidates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  background TEXT,
  problem TEXT,
  solution TEXT,
  ux_requirements TEXT,
  edge_cases TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
  version INTEGER DEFAULT 1,
  output_url TEXT, -- Generated Google Spreadsheets/Docs URL
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content assets table
CREATE TABLE public.content_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.task_candidates(id) ON DELETE CASCADE,
  prd_id UUID REFERENCES public.prd_drafts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('faq', 'banner', 'notification', 'guide', 'announcement')),
  title TEXT NOT NULL,
  content TEXT,
  target_channel TEXT CHECK (target_channel IN ('slack', 'confluence', 'blog', 'customer_center', 'app_popup')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
  output_url TEXT, -- Generated Google Spreadsheets/Docs URL
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis results table (stores analysis output metadata)
CREATE TABLE public.analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_feedback_id UUID REFERENCES public.feedback_sources(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('sentiment', 'categorization', 'summary', 'task_extraction')),
  result_url TEXT NOT NULL, -- Generated Google Spreadsheets URL with analysis results
  summary TEXT,
  metadata JSONB, -- Store additional analysis metadata
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feedback_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prd_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policies (temporarily allowing all access for development)
CREATE POLICY "Allow all operations on feedback_sources" 
ON public.feedback_sources 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on task_candidates" 
ON public.task_candidates 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on prd_drafts" 
ON public.prd_drafts 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on content_assets" 
ON public.content_assets 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on analysis_results" 
ON public.analysis_results 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_feedback_sources_updated_at
  BEFORE UPDATE ON public.feedback_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_candidates_updated_at
  BEFORE UPDATE ON public.task_candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prd_drafts_updated_at
  BEFORE UPDATE ON public.prd_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_assets_updated_at
  BEFORE UPDATE ON public.content_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();