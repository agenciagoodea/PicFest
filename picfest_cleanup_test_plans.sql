-- picfest_cleanup_test_plans.sql
-- Este script remove planos de teste antigos com segurança.
-- Ele só exclui planos que tenham slugs específicos de teste,
-- desde que NÃO existam assinaturas ativas vinculadas a eles.

BEGIN;

-- 1. Identificar planos de teste
-- Aqui consideramos planos de teste:
-- A) Planos com nomes ou slugs contendo 'test', 'teste'
-- B) Planos antigos inativos ('starter', 'premium') se não usados.

WITH PlanosTeste AS (
    SELECT id, slug, name
    FROM plans
    WHERE slug IN ('starter', 'premium', 'teste', 'test-plan')
       OR name ILIKE '%teste%'
),
AssinaturasAtivas AS (
    SELECT plan_id
    FROM subscriptions
    WHERE status IN ('active', 'trialing')
)
-- 2. Deletar apenas se não houver assinatura ativa
DELETE FROM plans
WHERE id IN (
    SELECT id FROM PlanosTeste
)
AND id NOT IN (
    SELECT plan_id FROM AssinaturasAtivas
);

COMMIT;

-- Nota: Este script pode ser executado com segurança no SQL Editor do Supabase.
-- Atualizado: Tabela corrigida de 'subscription_plans' para 'plans'.
