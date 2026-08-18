-- Policies para bucket logos
CREATE POLICY "Users can manage their own logos" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policies para bucket quote-files
CREATE POLICY "Users can manage their own quote files" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'quote-files' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'quote-files' AND (storage.foldername(name))[1] = auth.uid()::text);
