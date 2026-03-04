
-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own tenders" ON public.tenders;
DROP POLICY IF EXISTS "Users can create tenders" ON public.tenders;
DROP POLICY IF EXISTS "Users can update their own tenders" ON public.tenders;
DROP POLICY IF EXISTS "Users can delete their own tenders" ON public.tenders;

-- Make user_id nullable
ALTER TABLE public.tenders ALTER COLUMN user_id DROP NOT NULL;

-- Create permissive policies
CREATE POLICY "Allow all select on tenders" ON public.tenders FOR SELECT USING (true);
CREATE POLICY "Allow all insert on tenders" ON public.tenders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on tenders" ON public.tenders FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on tenders" ON public.tenders FOR DELETE USING (true);

-- Update storage policies
DROP POLICY IF EXISTS "Users can upload their own tender files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own tender files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own tender files" ON storage.objects;

CREATE POLICY "Allow all uploads to tender-files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tender-files');
CREATE POLICY "Allow all reads from tender-files" ON storage.objects FOR SELECT USING (bucket_id = 'tender-files');
CREATE POLICY "Allow all deletes from tender-files" ON storage.objects FOR DELETE USING (bucket_id = 'tender-files');
