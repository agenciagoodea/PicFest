# Instruções para Configurar o Supabase

## 1. Executar o Script SQL

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard/project/jqeymlzaaswqqowodhte
2. No menu lateral, clique em **SQL Editor**
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo `supabase_schema.sql`
5. Cole no editor SQL
6. Clique em **Run** (ou pressione Ctrl+Enter)

## 2. Criar o Bucket de Storage

1. No dashboard do Supabase, vá em **Storage**
2. Clique em **Create a new bucket**
3. Nome do bucket: `midias`
4. Marque como **Public bucket** (para permitir acesso público às mídias)
5. Clique em **Create bucket**

### Configurar Políticas do Bucket

Após criar o bucket, configure as políticas:

1. Clique no bucket `midias`
2. Vá na aba **Policies**
3. Adicione as seguintes políticas:

**Política 1: Leitura Pública**
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'midias' );
```

**Política 2: Upload Autenticado**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'midias' 
  AND auth.role() = 'authenticated'
);
```

**Política 3: Organizadores podem deletar suas mídias**
```sql
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'midias' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 3. Verificar a Configuração

Execute esta query no SQL Editor para verificar se tudo foi criado:

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 4. Criar Usuário Admin (Opcional)

Para criar um usuário administrador inicial:

```sql
-- Primeiro, crie um usuário no Authentication do Supabase
-- Depois, execute este SQL substituindo o UUID pelo ID do usuário criado:

INSERT INTO profiles (id, role, nome, email)
VALUES (
  'UUID-DO-USUARIO-CRIADO',
  'admin',
  'Administrador',
  'admin@picfest.com'
);
```

## 5. Estrutura Criada

### Tabelas:
- ✅ `profiles` - Usuários do sistema
- ✅ `planos` - Planos de assinatura
- ✅ `assinaturas` - Assinaturas ativas
- ✅ `eventos` - Eventos criados
- ✅ `midias` - Fotos e vídeos
- ✅ `depoimentos` - Avaliações

### Storage:
- ✅ Bucket `midias` - Armazenamento de fotos/vídeos

### Segurança:
- ✅ RLS habilitado em todas as tabelas
- ✅ Políticas de acesso configuradas
- ✅ Funções auxiliares criadas

## 6. Próximos Passos

Após executar o script:

1. Verifique se todas as tabelas foram criadas
2. Crie o bucket de storage `midias`
3. Configure as políticas do bucket
4. Teste a conexão da aplicação
5. Crie um usuário admin se necessário

## Troubleshooting

### Erro: "relation already exists"
- Algumas tabelas já existem. Você pode:
  - Ignorar o erro (o script usa `IF NOT EXISTS`)
  - Ou deletar as tabelas existentes primeiro

### Erro ao criar políticas
- Verifique se o RLS está habilitado na tabela
- Verifique se não há políticas duplicadas

### Bucket não aparece
- Certifique-se de estar no projeto correto
- Verifique as permissões da sua conta
