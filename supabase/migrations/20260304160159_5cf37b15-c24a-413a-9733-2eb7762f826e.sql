
-- Fix: Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Allow all select on tenders" ON public.tenders;
DROP POLICY IF EXISTS "Allow all insert on tenders" ON public.tenders;
DROP POLICY IF EXISTS "Allow all update on tenders" ON public.tenders;
DROP POLICY IF EXISTS "Allow all delete on tenders" ON public.tenders;

CREATE POLICY "Public select tenders" ON public.tenders AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert tenders" ON public.tenders AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update tenders" ON public.tenders AS PERMISSIVE FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Public delete tenders" ON public.tenders AS PERMISSIVE FOR DELETE TO anon, authenticated USING (true);

-- Fix storage policies too
DROP POLICY IF EXISTS "Allow all uploads to tender-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads from tender-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes from tender-files" ON storage.objects;

CREATE POLICY "Public upload tender-files" ON storage.objects AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'tender-files');
CREATE POLICY "Public read tender-files" ON storage.objects AS PERMISSIVE FOR SELECT TO anon, authenticated USING (bucket_id = 'tender-files');
CREATE POLICY "Public delete tender-files" ON storage.objects AS PERMISSIVE FOR DELETE TO anon, authenticated USING (bucket_id = 'tender-files');
