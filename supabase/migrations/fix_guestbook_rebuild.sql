-- ============================================================
-- MIGRAÇÃO: CORREÇÃO GUESTBOOK (UPSERT PERMISSION)
-- ============================================================

-- Para que o comando .upsert() funcione no Supabase para convidados anônimos,
-- a política de RLS precisa permitir tanto INSERT quanto UPDATE.
-- Atualmente, muitos convidados não conseguiam salvar porque só havia permissão de INSERT.

-- 1. Remover políticas antigas limitadas
DROP POLICY IF EXISTS "Anyone can insert into guestbook" ON event_guestbook;

-- 2. Criar política que permite inserir e atualizar registros (necessário para o flow de upload múltiplo)
DROP POLICY IF EXISTS "Public can manage guestbook entries" ON event_guestbook;
CREATE POLICY "Public can manage guestbook entries"
  ON event_guestbook
  FOR ALL -- Permite SELECT, INSERT, UPDATE
  USING (true)
  WITH CHECK (true);

-- 3. Função para popular o Guestbook retroativamente (Análise de todos os envios)
-- Esta função percorre a tabela de mídias e cria entradas no guestbook para quem ainda não tem.
CREATE OR REPLACE FUNCTION rebuild_guestbook_from_media(p_evento_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO event_guestbook (evento_id, tenant_id, guest_id, nome, instagram, mensagem, foto_url)
    SELECT DISTINCT ON (m.evento_id, m.usuario_id)
        m.evento_id,
        e.organizador_id as tenant_id, -- Fallback para o ID do organizador se o tenant não estiver claro
        m.usuario_id as guest_id,
        p.nome,
        p.instagram,
        m.legenda as mensagem,
        p.foto_perfil as foto_url
    FROM midias m
    JOIN eventos e ON e.id = m.evento_id
    JOIN profiles p ON p.id = m.usuario_id
    WHERE m.evento_id = p_evento_id
      AND m.legenda IS NOT NULL
      AND m.legenda <> ''
    ON CONFLICT (evento_id, guest_id) DO UPDATE
    SET mensagem = EXCLUDED.mensagem,
        nome = EXCLUDED.nome;
END;
$$;
