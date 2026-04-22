-- upgrade_organizer_features.sql
-- Adiciona suporte a logos de eventos e travas de planos.

BEGIN;

-- 1. Novos campos na tabela planos para identificar planos gratuitos
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_free_tier BOOLEAN DEFAULT false;

-- Marcar plano free atual (se existir)
UPDATE plans SET is_free_tier = true WHERE slug = 'free';

-- 2. Novos campos na tabela eventos para suporte a logos
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS logo_path TEXT;

-- 3. Função para exclusão segura de evento (será chamada pelo service para limpar storage também)
-- Aqui garantimos que ao deletar um evento, as mídias associadas também sejam removidas (cascata)
-- Note: A remoção física do storage deve ser feita via SDK/Edge Function, mas o DB limpa aqui.

ALTER TABLE midias 
  DROP CONSTRAINT IF EXISTS midias_evento_id_fkey,
  ADD CONSTRAINT midias_evento_id_fkey 
  FOREIGN KEY (evento_id) 
  REFERENCES eventos(id) 
  ON DELETE CASCADE;

ALTER TABLE event_plan_addons
  DROP CONSTRAINT IF EXISTS event_plan_addons_evento_id_fkey,
  ADD CONSTRAINT event_plan_addons_evento_id_fkey 
  FOREIGN KEY (evento_id) 
  REFERENCES eventos(id) 
  ON DELETE CASCADE;

ALTER TABLE event_guestbook
  DROP CONSTRAINT IF EXISTS event_guestbook_evento_id_fkey,
  ADD CONSTRAINT event_guestbook_evento_id_fkey 
  FOREIGN KEY (evento_id) 
  REFERENCES eventos(id) 
  ON DELETE CASCADE;

COMMIT;
