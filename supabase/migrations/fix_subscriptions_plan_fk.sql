-- ============================================================
-- MIGRATION: Corrigir FKs de plan_id em subscriptions e payments
-- Execute no SQL Editor do Supabase (picfest project)
-- ============================================================

-- ============================================================
-- TABELA: subscriptions
-- ============================================================

-- 1. Remover FK antiga
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;

-- 2. Garantir que plan_id é nullable
ALTER TABLE subscriptions
  ALTER COLUMN plan_id DROP NOT NULL;

-- 3. Recriar FK com ON DELETE SET NULL
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_id_fkey
  FOREIGN KEY (plan_id)
  REFERENCES plans(id)
  ON DELETE SET NULL;

-- ============================================================
-- TABELA: payments
-- ============================================================

-- 4. Remover FK antiga da tabela payments
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_plan_id_fkey;

-- 5. Garantir que plan_id é nullable
ALTER TABLE payments
  ALTER COLUMN plan_id DROP NOT NULL;

-- 6. Recriar FK com ON DELETE SET NULL
ALTER TABLE payments
  ADD CONSTRAINT payments_plan_id_fkey
  FOREIGN KEY (plan_id)
  REFERENCES plans(id)
  ON DELETE SET NULL;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- Resultado esperado: 'n' (SET NULL) para ambas as constraints
-- ============================================================
-- SELECT conname, confdeltype
-- FROM pg_constraint
-- WHERE conname IN ('subscriptions_plan_id_fkey', 'payments_plan_id_fkey');
