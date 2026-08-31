/*
# Create user avatar storage

1. New Storage Bucket
- `avatars` stores user-uploaded profile pictures.
- Files are public-read so the app can display saved profile pictures using their public URL.

2. Security
- Authenticated users can upload, replace, and delete only files inside their own user ID folder.
- Public read access is limited to the avatars bucket.
- File ownership is enforced from the first path segment, which must match auth.uid().

3. Important Notes
- The frontend stores files as `<user-id>/<random-file-name>.<extension>`.
- Existing profile data is preserved; only the avatar URL is updated when a user chooses a picture.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public avatar images are viewable" ON storage.objects;
CREATE POLICY "Public avatar images are viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload their own avatars" ON storage.objects;
CREATE POLICY "Users upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users update their own avatars" ON storage.objects;
CREATE POLICY "Users update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users delete their own avatars" ON storage.objects;
CREATE POLICY "Users delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);