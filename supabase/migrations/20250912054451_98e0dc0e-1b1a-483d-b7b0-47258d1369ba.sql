-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public) VALUES ('service-images', 'service-images', true);

-- Create policies for service images
CREATE POLICY "Allow authenticated users to upload service images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'service-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public access to service images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'service-images');

CREATE POLICY "Allow authenticated users to update their service images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'service-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete their service images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'service-images' AND auth.role() = 'authenticated');

-- Create table for service launch data
CREATE TABLE public.service_launches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prd_id UUID NOT NULL,
  image_1_url TEXT,
  image_2_url TEXT,
  image_3_url TEXT,
  generated_content JSONB,
  status TEXT DEFAULT 'preparing',
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_launches ENABLE ROW LEVEL SECURITY;

-- Create policies for service_launches
CREATE POLICY "Users can view their own service launches" 
ON public.service_launches 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own service launches" 
ON public.service_launches 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own service launches" 
ON public.service_launches 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own service launches" 
ON public.service_launches 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_service_launches_updated_at
BEFORE UPDATE ON public.service_launches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();