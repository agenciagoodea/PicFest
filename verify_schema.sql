-- ============================================
-- VERIFICAÇÃO DO SCHEMA DO SUPABASE
-- ============================================
-- Execute este script para verificar se tudo foi criado corretamente

-- 1. Verificar todas as tabelas criadas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as num_columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar políticas RLS habilitadas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Contar políticas por tabela
SELECT 
  tablename,
  COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 4. Verificar planos inseridos
SELECT 
  nome,
  limite_storage / 1073741824 as storage_gb,
  limite_eventos,
  valor,
  recorrencia,
  ativo
FROM planos
ORDER BY valor;

-- 5. Verificar índices criados
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 6. Verificar funções auxiliares
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'is_event_organizer')
ORDER BY routine_name;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Tabelas: 6 (assinaturas, depoimentos, eventos, midias, planos, profiles)
-- RLS: Todas as 6 tabelas devem ter rowsecurity = true
-- Políticas: Cada tabela deve ter múltiplas políticas
-- Planos: 4 planos (Gratuito, Básico, Pro, Premium)
-- Índices: 6 índices (idx_*)
-- Funções: 2 funções (is_admin, is_event_organizer)
