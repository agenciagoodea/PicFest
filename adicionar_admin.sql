-- ====================================================================
-- SCRIPT DEFINITIVO: CRIAÇÃO COMPLETA DE ADMIN (BYPASS DE REGISTRO)
-- Use este script se a tela de registro der erro de "Rate Limit"
-- ====================================================================

DO $$
DECLARE
  user_email TEXT := 'contato@agenciagoodea.com';
  user_name TEXT := 'Adriano Amorim Souza';
  user_password TEXT := '04039866@AAs';
  
  -- ID existente ou novo
  target_id UUID;
  encrypted_pw TEXT;
BEGIN
  -- 1. Verifica se o usuário já existe no auth.users
  SELECT id INTO target_id FROM auth.users WHERE email = user_email;

  IF target_id IS NULL THEN
    -- 2. Cria novo ID
    target_id := gen_random_uuid();
    
    -- 3. Prepara senha
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    encrypted_pw := crypt(user_password, gen_salt('bf'));

    -- 4. Insere no auth.users (Criação manual forçada)
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, recovery_token
    )
    VALUES (
      target_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
      user_email, encrypted_pw, now(), 
      '{"provider":"email","providers":["email"]}', 
      jsonb_build_object('nome', user_name),
      now(), now(), '', ''
    );
    RAISE NOTICE 'Usuário criado no Auth com sucesso.';
  ELSE
    RAISE NOTICE 'Usuário já existe no Auth (apenas atualizando perfil).';
  END IF;

  -- 5. Garante que o perfil existe na public.profiles com role ADMIN
  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (target_id, user_name, user_email, 'admin')
  ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    nome = EXCLUDED.nome;

  RAISE NOTICE 'Usuário % (%) agora é ADMINISTRADOR!', user_name, user_email;
END $$;
