
-- SCRIPT DE ATUALIZAÇÃO DA TABELA MIDIAS
-- Objetivo: Adicionar suporte a metadados de orientação e dimensões para mídias nativas

ALTER TABLE midias ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE midias ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE midias ADD COLUMN IF NOT EXISTS orientation TEXT;
ALTER TABLE midias ADD COLUMN IF NOT EXISTS duration NUMERIC;

-- Comentários para auxiliar na manutenção do banco
COMMENT ON COLUMN midias.width IS 'Largura da mídia em pixels (extraído na captura)';
COMMENT ON COLUMN midias.height IS 'Altura da mídia em pixels (extraído na captura)';
COMMENT ON COLUMN midias.orientation IS 'Orientação detectada: portrait ou landscape';
COMMENT ON COLUMN midias.duration IS 'Duração do vídeo em segundos (limite de 30s validado no frontend)';

-- Notificar o PostgREST para recarregar o schema cache (opcional, mas recomendado)
NOTIFY pgrst, 'reload schema';
