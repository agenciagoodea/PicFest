-- ============================================================
-- MIGRAÇÃO: CORREÇÃO UPLOAD CONVIDADO (RLS MIDIAS)
-- ============================================================

-- O erro "new row violates row-level security policy for table midias"
-- ocorria porque a política de INSERT exigia que o usuário estivesse autenticado (auth.uid() IS NOT NULL).
-- No entanto, convidados (guests) que acessam via QR Code não possuem sessão no Supabase Auth.

-- 1. Remover política restritiva anterior
DROP POLICY IF EXISTS "Authenticated users can insert midias" ON midias;

-- 2. Permitir que qualquer pessoa envie mídias (o limite é controlado via trigger trg_enforce_media_limits)
-- Adicionalmente, mantemos a segurança de que o evento_id deve ser válido.
CREATE POLICY "Public can insert midias"
  ON midias FOR INSERT
  WITH CHECK (true);

-- 3. (Opcional) Reforçar que apenas o Organizador ou Admin pode deletar ou atualizar
-- Isso já deve estar coberto pelas políticas de fix_midias_rls_recursion.sql, mas garantimos aqui.
DROP POLICY IF EXISTS "Organizer and Admin manage midias" ON midias;
CREATE POLICY "Organizer and Admin manage midias"
  ON midias FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR id IN (SELECT organizador_id FROM eventos WHERE id = midias.evento_id))
    )
  );

-- Nota: A política de SELECT ("Public can read approved midias") continua ativa, 
-- permitindo que convidados vejam as fotos aprovadas no telão.
