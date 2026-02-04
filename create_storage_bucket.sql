-- ============================================
-- CRIAR BUCKET DE STORAGE E POLÍTICAS
-- ============================================
-- Execute este script no SQL Editor do Supabase para criar o bucket de storage

-- IMPORTANTE: Este script cria o bucket via SQL
-- Alternativamente, você pode criar manualmente via Dashboard em Storage > Buckets

-- 1. Criar o bucket 'midias' (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'midias',
  'midias',
  true,
  52428800, -- 50MB por arquivo
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política: Leitura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'midias' );

-- 3. Política: Upload autenticado
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'midias' 
  AND auth.role() = 'authenticated'
);

-- 4. Política: Atualizar próprios arquivos
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'midias' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Política: Deletar próprios arquivos
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'midias' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Verificar bucket criado
SELECT 
  id,
  name,
  public,
  file_size_limit / 1048576 as max_file_size_mb,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'midias';

-- 7. Verificar políticas do bucket
SELECT 
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%midias%' OR policyname LIKE '%Public%' OR policyname LIKE '%Authenticated%'
ORDER BY policyname;
