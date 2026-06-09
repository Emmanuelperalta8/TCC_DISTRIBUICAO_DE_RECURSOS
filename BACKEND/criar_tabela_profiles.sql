-- =============================================================
-- TABELA DE PERFIS DE USUÁRIOS — TCC Distribuição de Recursos
-- Executar no SQL Editor do Supabase (projeto dskbpsagetommnoylcwu)
-- =============================================================

-- 1. Tabela profiles (vinculada ao auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_usuario TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  role         TEXT        NOT NULL DEFAULT 'usuario'
                           CHECK (role IN ('admin', 'usuario')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado pode ler somente o próprio perfil
CREATE POLICY "read_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuário autenticado pode atualizar somente o próprio perfil
CREATE POLICY "update_own_profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Nota: operações de admin (listar todos, criar, excluir) usam a
-- service_role key no frontend, que ignora as políticas de RLS.

-- 3. Trigger: cria perfil automaticamente quando um novo usuário
--    se cadastra pelo Supabase Auth (signUp)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_usuario, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_usuario', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'usuario')
  );
  RETURN NEW;
END;
$$;

-- Remove trigger anterior (se existir) e recria
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- COMO CRIAR O PRIMEIRO ADMINISTRADOR
-- Após executar este script:
-- 1. Cadastre-se pelo formulário de cadastro da aplicação
-- 2. Execute a query abaixo substituindo o e-mail real:
--
--   UPDATE public.profiles
--   SET role = 'admin'
--   WHERE email = 'seu@email.com';
--
-- =============================================================
