-- ====================================================================
-- CORREÇÃO DE RECURSÃO RLS E PERMISSÃO DE REGISTRO
-- ====================================================================

-- 1. Remover políticas problemáticas que causam recursão infinita
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Admins podem gerenciar todos os perfis" ON profiles;

-- 2. Recriar políticas usando a função is_admin() 
-- Esta função é SECURITY DEFINER, por isso ignora o RLS na subconsulta
CREATE POLICY "Admins podem ver todos os perfis" 
  ON profiles FOR SELECT 
  USING (is_admin());

CREATE POLICY "Admins podem gerenciar todos os perfis" 
  ON profiles FOR ALL 
  USING (is_admin());

-- 3. Adicionar política de INSERT para novos usuários
-- Sem esta política, o Supabase impede a criação do perfil após o SignUp
CREATE POLICY "Usuários podem inserir seu próprio perfil" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 4. Garantir que a função is_admin existe e está correta
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE 'RLS de perfis corrigido com sucesso!';
