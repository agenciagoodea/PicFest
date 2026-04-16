-- Corrige o erro 500 (Infinite Recursion) no banco
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Garante que o próprio usuário continue conseguindo ver seu perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING ( id = auth.uid() );
