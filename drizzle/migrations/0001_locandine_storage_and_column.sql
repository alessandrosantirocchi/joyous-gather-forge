ALTER TABLE public.eventi ADD COLUMN IF NOT EXISTS locandina_path text;

CREATE POLICY "locandine lettura pubblica"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'locandine');

CREATE POLICY "admin carica locandine"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'locandine' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admin aggiorna locandine"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'locandine' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'locandine' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admin elimina locandine"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'locandine' AND public.has_role(auth.uid(), 'admin'::public.app_role));