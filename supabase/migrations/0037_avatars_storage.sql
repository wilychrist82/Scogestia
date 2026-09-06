-- Création du bucket public pour les avatars (photos de profil)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Politiques de sécurité pour le bucket "avatars"

-- 1. Tout le monde peut lire les avatars (public)
CREATE POLICY "Public Access for avatars" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- 2. Les utilisateurs connectés peuvent uploader leur propre avatar
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- 3. Les utilisateurs connectés peuvent mettre à jour leur propre avatar
CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- 4. Les utilisateurs connectés peuvent supprimer leur propre avatar
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);
