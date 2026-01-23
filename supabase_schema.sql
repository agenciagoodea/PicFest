
-- ... (código anterior)

-- 8. Tabela de Depoimentos
CREATE TABLE depoimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizador_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  foto_url TEXT,
  estrelas INTEGER CHECK (estrelas >= 1 AND estrelas <= 5),
  texto TEXT NOT NULL,
  aprovado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para Depoimentos
ALTER TABLE depoimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved testimonials" ON depoimentos FOR SELECT USING (aprovado = TRUE);
CREATE POLICY "Organizers can create testimonials" ON depoimentos FOR INSERT WITH CHECK (auth.uid() = organizador_id);
CREATE POLICY "Admins can manage all testimonials" ON depoimentos FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
