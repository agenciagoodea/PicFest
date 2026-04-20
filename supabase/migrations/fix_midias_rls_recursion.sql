-- ============================================================
-- CORREÇÃO: Infinite recursion detected in RLS policy — midias
-- Execute no SQL Editor do Supabase (projeto PicFest)
-- ============================================================

-- O erro "Infinite recursion detected in policy for re..." ocorre
-- quando a policy de INSERT em 'midias' faz subquery em 'midias' ou
-- em 'eventos' que por sua vez referencia 'midias'.
-- A solução é simplificar a policy de INSERT para não fazer subqueries recursivas.

-- ============================================================
-- PASSO 1: Remover TODAS as policies antigas de midias
-- ============================================================
DROP POLICY IF EXISTS "Guests can insert media" ON midias;
DROP POLICY IF EXISTS "Convidados podem inserir midias" ON midias;
DROP POLICY IF EXISTS "Anyone can insert midias" ON midias;
DROP POLICY IF EXISTS "Allow authenticated insert" ON midias;
DROP POLICY IF EXISTS "Guests upload media" ON midias;
DROP POLICY IF EXISTS "Public can insert midias" ON midias;
DROP POLICY IF EXISTS "Organizadores podem ver midias do evento" ON midias;
DROP POLICY IF EXISTS "Admins can view all midias" ON midias;
DROP POLICY IF EXISTS "Users can view own midias" ON midias;
DROP POLICY IF EXISTS "Allow all select on midias" ON midias;
DROP POLICY IF EXISTS "Allow select approved midias" ON midias;
DROP POLICY IF EXISTS "Organizer can delete midias" ON midias;
DROP POLICY IF EXISTS "Organizer can update midias" ON midias;

-- ============================================================
-- PASSO 2: Criar policies SIMPLES, sem recursão
-- ============================================================

-- LEITURA: Qualquer um pode ver mídias aprovadas (galeria pública do evento)
CREATE POLICY "Public can read approved midias"
  ON midias FOR SELECT
  USING (aprovado = true);

-- LEITURA pelos organizadores: Podem ver todas as mídias dos seus eventos
-- Usa SECURITY DEFINER via função para evitar recursão
CREATE OR REPLACE FUNCTION get_user_event_ids(uid UUID)
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM eventos WHERE organizador_id = uid
$$;

CREATE POLICY "Organizer can read all event midias"
  ON midias FOR SELECT
  USING (
    aprovado = true
    OR
    evento_id IN (SELECT get_user_event_ids(auth.uid()))
    OR
    usuario_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- INSERT: Qualquer usuário autenticado pode enviar mídia
-- (a validação de limite é feita no código, não no banco)
CREATE POLICY "Authenticated users can insert midias"
  ON midias FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Organizadores podem moderar (aprovar/reprovar) mídias do seu evento
CREATE POLICY "Organizer can update event midias"
  ON midias FOR UPDATE
  USING (
    evento_id IN (SELECT get_user_event_ids(auth.uid()))
    OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- DELETE: Organizadores podem excluir mídias do seu evento
CREATE POLICY "Organizer can delete event midias"
  ON midias FOR DELETE
  USING (
    evento_id IN (SELECT get_user_event_ids(auth.uid()))
    OR
    usuario_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ============================================================
-- PASSO 3: Garantir que RLS está habilitado
-- ============================================================
ALTER TABLE midias ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'midias'
-- ORDER BY cmd;
