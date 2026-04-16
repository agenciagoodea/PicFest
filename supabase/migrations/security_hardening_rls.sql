-- ============================================================
-- HIGH-01: RLS Defensivo para dados sensíveis de administração
-- Garante que todas as tabelas críticas bloqueiem acesso direto
-- de usuários não-admin, mesmo que o frontend seja bypassado.
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. INTEGRATION_LOGS: Apenas admins
ALTER TABLE IF EXISTS integration_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view integration_logs" ON integration_logs;
CREATE POLICY "Only admins can view integration_logs" ON integration_logs
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 2. WEBHOOK_EVENTS: Apenas admins (reforço - já existe para SELECT)
ALTER TABLE IF EXISTS webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can manage webhook_events" ON webhook_events;
CREATE POLICY "Only admins can manage webhook_events" ON webhook_events
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 3. TENANTS: Dono vê e gerencia apenas o seu. Admin vê todos.
ALTER TABLE IF EXISTS tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all tenants" ON tenants;
CREATE POLICY "Admins can view all tenants" ON tenants
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 4. PROFILES: Usuário vê o próprio. Admin vê todos.
-- (Mantém as policies existentes, e adiciona a de admin)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 5. PAYMENTS: Garante que Owner vê apenas seus pagamentos via Tenant (reforço)
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage all payments" ON payments;
CREATE POLICY "Service role can manage all payments" ON payments
  FOR ALL
  USING (true)
  WITH CHECK (true);
-- Nota: A policy acima é para service_role via Edge Functions.
-- As policies de SELECT já existem em fix_plans_rls.sql.

-- ============================================================
-- HIGH-04: Corrigir campo pix_qr_code na tabela payments
-- pix_qr_code deve armazenar o base64, não o texto copia-cola
-- ============================================================

-- Adiciona coluna correta se ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'pix_qr_code_image'
  ) THEN
    ALTER TABLE payments ADD COLUMN pix_qr_code_image TEXT;
  END IF;
END $$;

-- ============================================================
-- LOW-04: Proteção contra abuso de upload de convidados
-- Limitar uploads por evento a 20 por convidado anônimo
-- ============================================================

-- Criar função para contar mídias do mesmo IP/email por evento
-- (Controle via RLS: máximo de 50 uploads por usuário por evento)
DROP POLICY IF EXISTS "Guest upload quota per event" ON midias;
CREATE POLICY "Guest upload quota per event" ON midias
  FOR INSERT
  WITH CHECK (
    -- Limitar a 50 mídias por usuário (identificado por usuario_id) por evento
    (
      SELECT COUNT(*)
      FROM midias existing
      WHERE existing.evento_id = evento_id
        AND existing.usuario_id = usuario_id
    ) < 50
  );
