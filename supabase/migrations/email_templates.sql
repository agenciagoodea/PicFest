-- ============================================================
-- MIGRAÇÃO: TEMPLATES DE E-MAIL
-- Execute no SQL Editor do Supabase (picfest project)
-- ============================================================

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Admins podem fazer tudo
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed de templates básicos
INSERT INTO email_templates (slug, subject, html_content) VALUES
('pagamento_aprovado', 'Seu pagamento foi aprovado!', '<h1>Olá {{nome}},</h1><p>Seu pagamento para o evento {{evento}} foi aprovado com sucesso.</p>'),
('pagamento_pendente', 'Pagamento pendente', '<h1>Olá {{nome}},</h1><p>O pagamento para o evento {{evento}} está pendente.</p>'),
('compra_adicional', 'Compra de Adicional Confirmada', '<h1>Olá {{nome}},</h1><p>Sua compra do adicional {{adicional}} foi confirmada.</p>')
ON CONFLICT (slug) DO NOTHING;
