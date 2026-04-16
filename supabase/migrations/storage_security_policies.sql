-- ============================================================
-- MED-05: Políticas de tipo de arquivo no Supabase Storage
-- Impede upload de arquivos maliciosos (scripts, executáveis, etc.)
-- ============================================================

-- Política: Apenas imagens e vídeos permitidos no bucket 'midias'
-- Esta política é aplicada no nível do Storage, complementando a validação do frontend.

-- Nota: As políticas de Storage do Supabase são controladas via RLS na tabela storage.objects

-- Permitir leitura pública de mídias
DROP POLICY IF EXISTS "Public can view event media" ON storage.objects;
CREATE POLICY "Public can view event media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'midias');

-- Permitir upload apenas de formatos seguros (imagens e vídeos)
DROP POLICY IF EXISTS "Authenticated can upload safe media" ON storage.objects;
CREATE POLICY "Authenticated can upload safe media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'midias'
    AND (
      -- Imagens permitidas
      LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif')
      OR
      -- Vídeos permitidos
      LOWER(storage.extension(name)) IN ('mp4', 'webm', 'mov', 'avi', 'mkv')
    )
  );

-- Permitir delete apenas pelo dono ou admin
DROP POLICY IF EXISTS "Owner or admin can delete media" ON storage.objects;
CREATE POLICY "Owner or admin can delete media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'midias'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );
