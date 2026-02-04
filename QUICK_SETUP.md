# Guia Rápido: Aplicar Schema no Supabase

## 🎯 Opção Mais Simples: Dashboard do Supabase (RECOMENDADO)

Esta é a forma mais confiável e rápida:

### Passo a Passo:

1. **Acesse o SQL Editor**:
   - Vá para: https://supabase.com/dashboard/project/jqeymlzaaswqqowodhte/sql/new

2. **Copie o Schema**:
   - Abra o arquivo `supabase_schema.sql`
   - Selecione todo o conteúdo (Ctrl+A)
   - Copie (Ctrl+C)

3. **Execute no Dashboard**:
   - Cole no SQL Editor do Supabase
   - Clique em **Run** (ou Ctrl+Enter)
   - Aguarde a execução (pode levar alguns segundos)

4. **Verifique**:
   - Vá em **Table Editor** no menu lateral
   - Você deve ver 6 tabelas criadas:
     - ✅ profiles
     - ✅ planos
     - ✅ assinaturas
     - ✅ eventos
     - ✅ midias
     - ✅ depoimentos

---

## 🔧 Opção Alternativa: Script Automatizado

Se preferir usar um script automatizado, você tem duas opções:

### Opção A: PowerShell (Windows)

Execute no terminal do PowerShell:

```powershell
# Instalar dependência
npm install @supabase/supabase-js

# Executar script
node setup-supabase.js
```

### Opção B: Python

Se tiver Python instalado:

```bash
# Instalar dependência
pip install requests

# Executar script
python setup-supabase.py
```

---

## 📦 Criar Bucket de Storage

Após criar as tabelas, você precisa criar o bucket para armazenar as mídias:

### Via Dashboard (RECOMENDADO):

1. Acesse: https://supabase.com/dashboard/project/jqeymlzaaswqqowodhte/storage/buckets
2. Clique em **Create a new bucket**
3. Nome: `midias`
4. Marque **Public bucket**
5. Clique em **Create bucket**

### Configurar Políticas do Bucket:

Após criar, vá em **Policies** e adicione:

```sql
-- Leitura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'midias' );

-- Upload autenticado
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'midias' 
  AND auth.role() = 'authenticated'
);

-- Deletar próprias mídias
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'midias' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## ✅ Verificação Final

Execute esta query no SQL Editor para confirmar:

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar planos inseridos
SELECT nome, valor, recorrencia FROM planos;
```

Você deve ver:
- 6 tabelas criadas
- 4 planos (Gratuito, Básico, Pro, Premium)

---

## 🚀 Pronto!

Após executar o schema e criar o bucket, sua aplicação estará 100% conectada ao Supabase!

Reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

E teste a aplicação! 🎉
