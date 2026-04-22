-- showcase_and_profile.sql
-- Adiciona suporte a personalização da vitrine e detalhes do perfil.

BEGIN;

-- 1. Configuração da Vitrine nos Eventos
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS showcase_config JSONB DEFAULT '{
  "primaryColor": "#ff3366",
  "welcomeTitle": "Bem-vindo ao nosso evento!",
  "welcomeSubtitle": "Compartilhe suas memórias em tempo real.",
  "showGuestbook": true,
  "theme": "dark"
}'::jsonb;

-- 2. Campos extras no perfil (se não existirem)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

COMMIT;
