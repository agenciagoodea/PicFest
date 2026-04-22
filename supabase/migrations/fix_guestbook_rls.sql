-- ============================================================
-- MIGRAÇÃO: CORREÇÃO RLS GUESTBOOK PARA ADMINS
-- ============================================================

-- Garante que administradores possam ler todos os registros do guestbook
DROP POLICY IF EXISTS "Admins can read all guestbooks" ON event_guestbook;
CREATE POLICY "Admins can read all guestbooks" ON event_guestbook
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Garante que administradores possam excluir se necessário
DROP POLICY IF EXISTS "Admins can delete guestbooks" ON event_guestbook;
CREATE POLICY "Admins can delete guestbooks" ON event_guestbook
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
