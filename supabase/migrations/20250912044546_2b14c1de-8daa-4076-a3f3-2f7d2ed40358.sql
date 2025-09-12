-- Add development_cost and effect_score columns to task_candidates table
ALTER TABLE public.task_candidates 
ADD COLUMN IF NOT EXISTS development_cost INTEGER CHECK (development_cost >= 1 AND development_cost <= 3),
ADD COLUMN IF NOT EXISTS effect_score INTEGER CHECK (effect_score >= 1 AND effect_score <= 3);

-- Comment to explain the new columns
COMMENT ON COLUMN public.task_candidates.development_cost IS '개발 비용: 1-3 MM (Person Month)';
COMMENT ON COLUMN public.task_candidates.effect_score IS '효과 점수: 1(좋음), 2(보통), 3(낮음)';

-- Drop analysis_results table as it's not needed
DROP TABLE IF EXISTS public.analysis_results;