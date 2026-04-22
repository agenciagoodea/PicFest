-- ============================================================
-- MIGRATION: Corrigir FK subscriptions_plan_id_fkey
-- Objetivo: Permitir que planos de teste sejam removidos sem
-- quebrar a constraint de chave estrangeira.
-- 
-- A estratégia é alterar o comportamento de ON DELETE RESTRICT
-- para ON DELETE SET NULL, de forma que ao remover um plano,
-- o campo plan_id das assinaturas seja automaticamente nulificado.
-- ============================================================

-- 1. Remover a constraint existente
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;

-- 2. Recriar com ON DELETE SET NULL
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_id_fkey
  FOREIGN KEY (plan_id)
  REFERENCES plans(id)
  ON DELETE SET NULL;

-- 3. Garantir que a coluna plan_id permite NULL (caso não permita)
ALTER TABLE subscriptions
  ALTER COLUMN plan_id DROP NOT NULL;

-- Verificação:
-- SELECT conname, confdeltype FROM pg_constraint WHERE conname = 'subscriptions_plan_id_fkey';
-- 'a' = NO ACTION, 'r' = RESTRICT, 'c' = CASCADE, 'n' = SET NULL, 'd' = SET DEFAULT
-- O resultado esperado após essa migration é 'n' (SET NULL)
