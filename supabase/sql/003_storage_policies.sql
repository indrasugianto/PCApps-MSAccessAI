-- Storage bucket configuration and policies for access-files

-- Create the storage bucket if it doesn't exist
-- Note: This may need to be done via Supabase dashboard if SQL insert fails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('access-files', 'access-files', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to the bucket
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'access-files' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to read files
-- (In production, you may want to restrict this to project owners)
CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'access-files' 
  AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- Allow service role (worker) to read all files
CREATE POLICY "Service role can access all files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'access-files' 
  AND auth.role() = 'service_role'
);

-- Allow users to delete their own files if needed
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'access-files' 
  AND auth.role() = 'authenticated'
);

