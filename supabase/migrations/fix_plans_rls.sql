-- ============================================================
-- CORREÇÃO DE RLS E DADOS - EXECUTE NO SQL EDITOR DO SUPABASE
-- ============================================================

-- 1. Permitir leitura pública dos planos ativos (qualquer usuário, até não logado)
DROP POLICY IF EXISTS "Public can read active plans" ON plans;
CREATE POLICY "Public can read active plans" ON plans
  FOR SELECT USING (is_active = true);

-- 2. Permitir que admins façam tudo
DROP POLICY IF EXISTS "Admins have full access" ON plans;
CREATE POLICY "Admins have full access" ON plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 3. Leitura pública de subscriptions (para que organizador veja a sua)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- 4. Leitura pública de tenants pelo dono
DROP POLICY IF EXISTS "Users can view own tenant" ON tenants;
CREATE POLICY "Users can view own tenant" ON tenants
  FOR SELECT USING (owner_id = auth.uid());

-- Permissão para inserir tenants (necessário para criação automática)
DROP POLICY IF EXISTS "Users can create own tenant" ON tenants;
CREATE POLICY "Users can create own tenant" ON tenants
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- 5. Popular planos padrão (caso a tabela esteja vazia ou tenha apenas o starter de testes)
-- Só insere se o slug não existir, para não duplicar
INSERT INTO plans (name, slug, description, price, currency, interval, interval_count, features_json, limits_json, is_active)
VALUES
  (
    'Gratuito', 'gratuito', 'Para começar a explorar a plataforma.',
    0.00, 'BRL', 'month', 1,
    '{"items": ["1 Evento ativo", "Até 50 Mídias", "QR Code básico", "Galeria pública"]}',
    '{"events": 1, "media": 50, "download": false}',
    true
  ),
  (
    'Básico', 'basico', 'Para organizadores em crescimento.',
    59.90, 'BRL', 'month', 1,
    '{"items": ["5 Eventos ativos", "Até 500 Mídias", "Download em lote", "QR Code personalizado", "Suporte via chat"]}',
    '{"events": 5, "media": 500, "download": true}',
    true
  ),
  (
    'Pro', 'pro', 'Para quem quer escalar sem limites.',
    129.90, 'BRL', 'month', 1,
    '{"items": ["Eventos Ilimitados", "Mídias Ilimitadas", "Download em lote", "QR Code Premium", "Suporte Prioritário", "Relatórios avançados"]}',
    '{"events": 0, "media": 0, "download": true}',
    true
  )
ON CONFLICT (slug) DO NOTHING;
-- 6. RLS para Pagamentos (Admins podem ver tudo, usuários veem os seus)
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- 7. RLS para Webhook Events (Apenas admins podem ver)
DROP POLICY IF EXISTS "Admins can view webhook events" ON webhook_events;
CREATE POLICY "Admins can view webhook events" ON webhook_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
