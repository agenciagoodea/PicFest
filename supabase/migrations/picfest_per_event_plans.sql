-- ============================================================
-- MIGRAÇÃO: MODELO DE PLANO POR EVENTO — PicFest
-- Execute no SQL Editor do Supabase (picfest project)
-- Estratégia: APENAS ADICIONA, nunca remove dados existentes
-- ============================================================

-- ============================================================
-- PARTE 1: NOVOS CAMPOS NAS TABELAS EXISTENTES
-- ============================================================

-- Novos campos na tabela plans
ALTER TABLE plans ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'subscription';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- Novos campos na tabela eventos (vínculo de plano por evento — Opção B)
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS plan_snapshot JSONB;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS media_count_photos INT DEFAULT 0;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS media_count_videos INT DEFAULT 0;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_eventos_plan_id ON eventos(plan_id);

-- ============================================================
-- PARTE 2: TRIGGER AUTOMÁTICO DE CONTAGEM DE MÍDIAS
-- ============================================================

CREATE OR REPLACE FUNCTION update_event_media_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.tipo = 'foto' THEN
      UPDATE eventos SET media_count_photos = media_count_photos + 1 WHERE id = NEW.evento_id;
    ELSIF NEW.tipo = 'video' THEN
      UPDATE eventos SET media_count_videos = media_count_videos + 1 WHERE id = NEW.evento_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.tipo = 'foto' THEN
      UPDATE eventos SET media_count_photos = GREATEST(media_count_photos - 1, 0) WHERE id = OLD.evento_id;
    ELSIF OLD.tipo = 'video' THEN
      UPDATE eventos SET media_count_videos = GREATEST(media_count_videos - 1, 0) WHERE id = OLD.evento_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_event_media_count ON midias;
CREATE TRIGGER trg_update_event_media_count
  AFTER INSERT OR DELETE ON midias
  FOR EACH ROW EXECUTE FUNCTION update_event_media_count();

-- Sincronizar contadores com dados existentes
UPDATE eventos e
SET
  media_count_photos = (SELECT COUNT(*) FROM midias m WHERE m.evento_id = e.id AND m.tipo = 'foto'),
  media_count_videos = (SELECT COUNT(*) FROM midias m WHERE m.evento_id = e.id AND m.tipo = 'video');

-- ============================================================
-- PARTE 3: SEED DOS NOVOS PLANOS (por evento)
-- ============================================================

-- Desativar planos antigos (NÃO deletar — preserva external_reference dos pagamentos)
UPDATE plans SET is_active = false, billing_type = 'subscription'
WHERE slug IN ('gratuito', 'basico', 'pro', 'Gratuito', 'Básico', 'Pro');

-- Inserir novos planos por evento
-- sort_order define a ordem de exibição: 1=Free, 2=Fest, 3=Show
INSERT INTO plans (name, slug, description, price, currency, interval, interval_count, billing_type, sort_order, features_json, limits_json, is_active)
VALUES
  (
    'Free',
    'free',
    'Para testar a plataforma com um evento real.',
    0.00,
    'BRL',
    'unique',
    1,
    'single_event',
    1,
    '{"items": ["1 Evento", "20 Fotos", "5 Vídeos", "QR Code de upload", "Slideshow no telão"], "slideshow": true, "qr_upload": true, "download_files": false, "zip_download": false, "custom_cover": false, "branding": false}',
    '{"events": 1, "photos": 20, "videos": 5, "download": false, "zip": false}',
    true
  ),
  (
    'Fest',
    'fest',
    'A escolha ideal para festas e celebrações.',
    49.90,
    'BRL',
    'unique',
    1,
    'single_event',
    2,
    '{"items": ["1 Evento", "300 Fotos", "30 Vídeos", "QR Code personalizado", "Download individual", "Download em ZIP", "Capa customizada", "Sem marca d''água"], "slideshow": true, "qr_upload": true, "download_files": true, "zip_download": true, "custom_cover": true, "branding": true}',
    '{"events": 1, "photos": 300, "videos": 30, "download": true, "zip": true}',
    true
  ),
  (
    'Show',
    'show',
    'Para grandes eventos e produtoras profissionais.',
    99.90,
    'BRL',
    'unique',
    1,
    'single_event',
    3,
    '{"items": ["1 Evento", "1000 Fotos", "100 Vídeos", "QR Code premium", "Download individual", "Download em ZIP", "Capa customizada", "Sem marca d''água", "Processamento prioritário"], "slideshow": true, "qr_upload": true, "download_files": true, "zip_download": true, "custom_cover": true, "branding": true, "priority_processing": true}',
    '{"events": 1, "photos": 1000, "videos": 100, "download": true, "zip": true}',
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  billing_type = EXCLUDED.billing_type,
  sort_order = EXCLUDED.sort_order,
  features_json = EXCLUDED.features_json,
  limits_json = EXCLUDED.limits_json,
  is_active = EXCLUDED.is_active;

-- ============================================================
-- PARTE 4: RLS para leitura pública dos novos planos
-- ============================================================

-- Garantir que os novos planos são legíveis por qualquer um (já existe policy, mas reforça)
DROP POLICY IF EXISTS "Public can read active plans" ON plans;
CREATE POLICY "Public can read active plans" ON plans
  FOR SELECT USING (is_active = true);

-- Permitir que organizador atualize plan_id do seu próprio evento
DROP POLICY IF EXISTS "Organizer can update own event plan" ON eventos;
CREATE POLICY "Organizer can update own event plan" ON eventos
  FOR UPDATE USING (organizador_id = auth.uid())
  WITH CHECK (organizador_id = auth.uid());

-- ============================================================
-- VERIFICAÇÃO FINAL (execute para confirmar)
-- ============================================================
-- SELECT name, slug, price, billing_type, sort_order, limits_json FROM plans ORDER BY sort_order;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'eventos' AND column_name LIKE '%plan%';
