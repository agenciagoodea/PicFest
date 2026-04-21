-- ============================================================
-- MIGRAÇÃO: TRIGGER DE FISCALIZAÇÃO DE LIMITES (BETA)
-- Impede inserções na tabela 'midias' se o limite do evento for atingido.
-- ============================================================

-- Função que valida o limite antes do insert
CREATE OR REPLACE FUNCTION check_media_limits_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_limits JSONB;
    v_current_photos INT;
    v_current_videos INT;
    v_max_photos INT;
    v_max_videos INT;
BEGIN
    -- 1. Obter limites consolidados via RPC
    v_limits := get_event_operational_limits(NEW.evento_id);
    v_max_photos := (v_limits->>'final_photos')::INT;
    v_max_videos := (v_limits->>'final_videos')::INT;

    -- 2. Obter contagens atuais de mídias do evento
    -- Usamos SELECT count(*) para garantir precisão real-time
    SELECT count(*) INTO v_current_photos FROM midias WHERE evento_id = NEW.evento_id AND tipo = 'foto';
    SELECT count(*) INTO v_current_videos FROM midias WHERE evento_id = NEW.evento_id AND tipo = 'video';

    -- 3. Validar conforme o tipo que está sendo inserido
    IF NEW.tipo = 'foto' THEN
        IF v_max_photos > 0 AND v_current_photos >= v_max_photos THEN
            RAISE EXCEPTION 'Limite de fotos atingido para este evento (%/%)', v_current_photos, v_max_photos;
        END IF;
    ELSIF NEW.tipo = 'video' THEN
        IF v_max_videos > 0 AND v_current_videos >= v_max_videos THEN
            RAISE EXCEPTION 'Limite de vídeos atingido para este evento (%/%)', v_current_videos, v_max_videos;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Criar o trigger
DROP TRIGGER IF EXISTS trg_enforce_media_limits ON midias;
CREATE TRIGGER trg_enforce_media_limits
BEFORE INSERT ON midias
FOR EACH ROW
EXECUTE FUNCTION check_media_limits_trigger();

COMMENT ON FUNCTION check_media_limits_trigger() IS 'Fiscaliza limites de mídias por evento somando Plano + Addons.';
