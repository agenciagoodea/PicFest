-- ============================================================
-- MIGRAÇÃO: ADICIONAIS E LIMITES CONSOLIDADOS POR EVENTO (ADDONS)
-- Execute no SQL Editor do Supabase (picfest project)
-- ============================================================

-- ============================================================
-- PARTE 1: TABELA DO CATÁLOGO DE ADICIONAIS (Admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_addons_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    addon_type TEXT NOT NULL DEFAULT 'fotos', -- fotos, videos, misto, recurso
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    extra_photos INT DEFAULT 0,
    extra_videos INT DEFAULT 0,
    extra_events INT DEFAULT 0,
    features_json JSONB DEFAULT '{}'::jsonb,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Catálogo (Leitura Pública para Ativos / Admin Total)
ALTER TABLE plan_addons_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active addons catalog" ON plan_addons_catalog;
CREATE POLICY "Public can read active addons catalog" ON plan_addons_catalog
  FOR SELECT USING (is_active = true AND is_visible = true);

-- ============================================================
-- PARTE 2: TABELA DE ADICIONAIS COMPRADOS POR EVENTO
-- ============================================================
CREATE TABLE IF NOT EXISTS event_plan_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    evento_id UUID REFERENCES eventos(id) NOT NULL,
    addon_id UUID REFERENCES plan_addons_catalog(id) ON DELETE SET NULL,
    payment_id UUID, -- será constraintado depois ou mantido solto por circularidade
    name_snapshot TEXT NOT NULL,
    type_snapshot TEXT NOT NULL,
    price_snapshot DECIMAL(10,2) NOT NULL,
    extra_photos_snapshot INT DEFAULT 0,
    extra_videos_snapshot INT DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, cancelled
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Adicionais Comprados
ALTER TABLE event_plan_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizer can read own event addons" ON event_plan_addons;
CREATE POLICY "Organizer can read own event addons" ON event_plan_addons
  FOR SELECT USING (
      tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
      OR
      evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid())
  );

-- ============================================================
-- PARTE 3: ATUALIZAÇÕES EM payments
-- ============================================================
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='purchase_type') THEN 
        ALTER TABLE payments ADD COLUMN purchase_type VARCHAR(50) DEFAULT 'plan';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='evento_id') THEN 
        ALTER TABLE payments ADD COLUMN evento_id UUID REFERENCES eventos(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='addon_id') THEN 
        ALTER TABLE payments ADD COLUMN addon_id UUID REFERENCES plan_addons_catalog(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- PARTE 4: RPC - CÁLCULO DE LIMITES CONSOLIDADOS DO EVENTO
-- ============================================================
-- Essa função retorna o limite final de um evento somando o snapshot do plano + todos os adicionais ativos
CREATE OR REPLACE FUNCTION get_event_operational_limits(p_evento_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_plan_snapshot JSONB;
    v_base_photos INT := 0;
    v_base_videos INT := 0;
    v_extra_photos INT := 0;
    v_extra_videos INT := 0;
    v_result JSONB;
BEGIN
    -- Obter plano base (snapshot no evento)
    SELECT plan_snapshot INTO v_plan_snapshot
    FROM eventos
    WHERE id = p_evento_id;

    -- Se tem plano, extrair (default null para 0)
    IF v_plan_snapshot IS NOT NULL THEN
        v_base_photos := COALESCE((v_plan_snapshot->'limits_json'->>'photos')::INT, 0);
        v_base_videos := COALESCE((v_plan_snapshot->'limits_json'->>'videos')::INT, 0);
    ELSE
        -- Fallback de plano gratuito caso não tenha snapshot
        v_base_photos := 20;
        v_base_videos := 5;
    END IF;

    -- Somar adicionais ativos para este evento
    SELECT COALESCE(SUM(extra_photos_snapshot), 0), COALESCE(SUM(extra_videos_snapshot), 0)
    INTO v_extra_photos, v_extra_videos
    FROM event_plan_addons
    WHERE evento_id = p_evento_id AND status = 'active';

    -- Retornar os totais somados
    v_result := jsonb_build_object(
        'base_photos', v_base_photos,
        'base_videos', v_base_videos,
        'extra_photos', v_extra_photos,
        'extra_videos', v_extra_videos,
        'final_photos', v_base_photos + v_extra_photos,
        'final_videos', v_base_videos + v_extra_videos
    );

    RETURN v_result;
END;
$$;

-- ============================================================
-- PARTE 5: SEED DE ALGUNS ADICIONAIS EXEMPLO
-- ============================================================
INSERT INTO plan_addons_catalog (name, slug, description, addon_type, price, extra_photos, extra_videos, is_active, is_visible, sort_order)
VALUES
  ('Pacote +100 Fotos', 'pack-100-fotos', 'Adiciona 100 fotos ao limite atual do seu evento. Ideal para pequenos imprevistos de sucesso.', 'fotos', 19.90, 100, 0, true, true, 1),
  ('Pacote +500 Fotos', 'pack-500-fotos', 'Adiciona 500 fotos. Muito mais espaço para cobrir todo o evento.', 'fotos', 49.90, 500, 0, true, true, 2),
  ('Pacote +50 Vídeos', 'pack-50-videos', 'Adiciona 50 vídeos ao limite do evento, perfeito para depoimentos de convidados.', 'videos', 39.90, 0, 50, true, true, 3),
  ('Super Pack Completo', 'super-pack-misto', 'Adiciona 1000 fotos e 100 vídeos ao evento de uma só vez.', 'misto', 99.90, 1000, 100, true, true, 4)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  extra_photos = EXCLUDED.extra_photos,
  extra_videos = EXCLUDED.extra_videos;
