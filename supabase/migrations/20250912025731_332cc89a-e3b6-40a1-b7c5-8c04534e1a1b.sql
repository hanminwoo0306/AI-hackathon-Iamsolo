-- Update feedback_sources status constraint to include 'analyzed' status
ALTER TABLE feedback_sources DROP CONSTRAINT feedback_sources_status_check;

ALTER TABLE feedback_sources ADD CONSTRAINT feedback_sources_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text, 'analyzed'::text]));