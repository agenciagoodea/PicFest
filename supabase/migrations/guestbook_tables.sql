-- ============================================================
-- MIGRAÇÃO: LIVRO DE ASSINATURAS (GUESTBOOK)
-- Execute no SQL Editor do Supabase (picfest project)
-- ============================================================

CREATE TABLE IF NOT EXISTS event_guestbook (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    guest_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    instagram TEXT,
    mensagem TEXT,
    foto_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Evitar duplicidade de convidados no mesmo evento (mesmo profile)
ALTER TABLE event_guestbook ADD CONSTRAINT unique_guest_per_event UNIQUE (evento_id, guest_id);

-- RLS
ALTER TABLE event_guestbook ENABLE ROW LEVEL SECURITY;

-- Organizadores podem ler e gerenciar os guestbooks de seus eventos
DROP POLICY IF EXISTS "Organizer can read own event guestbooks" ON event_guestbook;
CREATE POLICY "Organizer can read own event guestbooks" ON event_guestbook
  FOR ALL USING (
      tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
      OR
      evento_id IN (SELECT id FROM eventos WHERE organizador_id = auth.uid())
  );

-- Permitir inserção por anônimos e convidados (para quando o convidado faz o upload)
-- Isso vai precisar permitir inserção se o evento for ativo
DROP POLICY IF EXISTS "Anyone can insert into guestbook" ON event_guestbook;
CREATE POLICY "Anyone can insert into guestbook" ON event_guestbook
  FOR INSERT WITH CHECK (true);
