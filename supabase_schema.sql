-- ============================================
-- PICFEST - SCHEMA COMPLETO DO BANCO DE DADOS
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/jqeymlzaaswqqowodhte/sql/new

-- ============================================
-- 1. TABELAS
-- ============================================

-- 1.1 Tabela de Perfis (Usuários)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'organizador', 'convidado')),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  instagram TEXT,
  foto_perfil TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Tabela de Planos
CREATE TABLE IF NOT EXISTS planos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  limite_storage BIGINT NOT NULL, -- em bytes
  limite_eventos INTEGER NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  recorrencia TEXT NOT NULL CHECK (recorrencia IN ('mensal', 'anual')),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizador_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES planos(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('ativa', 'cancelada', 'expirada')),
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_fim TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Tabela de Eventos
CREATE TABLE IF NOT EXISTS eventos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug_curto TEXT UNIQUE NOT NULL,
  data_evento TIMESTAMPTZ NOT NULL,
  organizador_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado')),
  config_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Tabela de Mídias (Fotos e Vídeos)
CREATE TABLE IF NOT EXISTS midias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('foto', 'video')),
  legenda TEXT,
  url TEXT NOT NULL,
  aprovado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Tabela de Depoimentos
CREATE TABLE IF NOT EXISTS depoimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizador_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  foto_url TEXT,
  estrelas INTEGER CHECK (estrelas >= 1 AND estrelas <= 5),
  texto TEXT NOT NULL,
  aprovado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_eventos_organizador ON eventos(organizador_id);
CREATE INDEX IF NOT EXISTS idx_eventos_slug ON eventos(slug_curto);
CREATE INDEX IF NOT EXISTS idx_midias_evento ON midias(evento_id);
CREATE INDEX IF NOT EXISTS idx_midias_aprovado ON midias(aprovado);
CREATE INDEX IF NOT EXISTS idx_assinaturas_organizador ON assinaturas(organizador_id);
CREATE INDEX IF NOT EXISTS idx_depoimentos_aprovado ON depoimentos(aprovado);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE midias ENABLE ROW LEVEL SECURITY;
ALTER TABLE depoimentos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3.1 Políticas para PROFILES
-- ============================================

CREATE POLICY "Usuários podem ver seu próprio perfil" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis" 
  ON profiles FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins podem gerenciar todos os perfis" 
  ON profiles FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- 3.2 Políticas para PLANOS
-- ============================================

CREATE POLICY "Todos podem ver planos ativos" 
  ON planos FOR SELECT 
  USING (ativo = TRUE);

CREATE POLICY "Admins podem gerenciar planos" 
  ON planos FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- 3.3 Políticas para ASSINATURAS
-- ============================================

CREATE POLICY "Organizadores podem ver suas assinaturas" 
  ON assinaturas FOR SELECT 
  USING (auth.uid() = organizador_id);

CREATE POLICY "Admins podem ver todas as assinaturas" 
  ON assinaturas FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins podem gerenciar assinaturas" 
  ON assinaturas FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- 3.4 Políticas para EVENTOS
-- ============================================

CREATE POLICY "Todos podem ver eventos ativos" 
  ON eventos FOR SELECT 
  USING (status = 'ativo');

CREATE POLICY "Organizadores podem criar eventos" 
  ON eventos FOR INSERT 
  WITH CHECK (auth.uid() = organizador_id);

CREATE POLICY "Organizadores podem gerenciar seus eventos" 
  ON eventos FOR ALL 
  USING (auth.uid() = organizador_id);

CREATE POLICY "Admins podem gerenciar todos os eventos" 
  ON eventos FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- 3.5 Políticas para MÍDIAS
-- ============================================

CREATE POLICY "Todos podem ver mídias aprovadas" 
  ON midias FOR SELECT 
  USING (aprovado = TRUE);

CREATE POLICY "Organizadores podem ver mídias de seus eventos" 
  ON midias FOR SELECT 
  USING (EXISTS (SELECT 1 FROM eventos WHERE id = evento_id AND organizador_id = auth.uid()));

CREATE POLICY "Usuários autenticados podem fazer upload de mídias" 
  ON midias FOR INSERT 
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Organizadores podem aprovar mídias de seus eventos" 
  ON midias FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM eventos WHERE id = evento_id AND organizador_id = auth.uid()));

CREATE POLICY "Admins podem gerenciar todas as mídias" 
  ON midias FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- 3.6 Políticas para DEPOIMENTOS
-- ============================================

CREATE POLICY "Todos podem ver depoimentos aprovados" 
  ON depoimentos FOR SELECT 
  USING (aprovado = TRUE);

CREATE POLICY "Organizadores podem criar depoimentos" 
  ON depoimentos FOR INSERT 
  WITH CHECK (auth.uid() = organizador_id);

CREATE POLICY "Admins podem gerenciar todos os depoimentos" 
  ON depoimentos FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- 4. DADOS INICIAIS (SEED)
-- ============================================

-- 4.1 Planos de Assinatura
INSERT INTO planos (nome, limite_storage, limite_eventos, valor, recorrencia, ativo) VALUES
  ('Gratuito', 1073741824, 1, 0.00, 'mensal', TRUE), -- 1GB, 1 evento
  ('Básico', 5368709120, 5, 29.90, 'mensal', TRUE),  -- 5GB, 5 eventos
  ('Pro', 21474836480, 20, 79.90, 'mensal', TRUE),   -- 20GB, 20 eventos
  ('Premium', 107374182400, 100, 199.90, 'mensal', TRUE) -- 100GB, 100 eventos
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. FUNÇÕES AUXILIARES
-- ============================================

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é organizador do evento
CREATE OR REPLACE FUNCTION is_event_organizer(event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM eventos 
    WHERE id = event_id AND organizador_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
