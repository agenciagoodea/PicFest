-- ============================================================
-- MIGRAÇÃO: CORREÇÃO RLS ADDONS PARA ADMINS
-- ============================================================

-- Garante que administradores tenham acesso total ao catálogo de adicionais
-- Atualmente a política "Public can read active addons catalog" bloqueia rows com is_active = false
DROP POLICY IF EXISTS "Admins have full access to addons catalog" ON plan_addons_catalog;
CREATE POLICY "Admins have full access to addons catalog" ON plan_addons_catalog
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Garante que administradores vejam todos os adicionais comprados
DROP POLICY IF EXISTS "Admins can view all event addons" ON event_plan_addons;
CREATE POLICY "Admins can view all event addons" ON event_plan_addons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
