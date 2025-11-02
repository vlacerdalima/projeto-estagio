-- Tabela para gerenciar permissões de acesso de usuários aos restaurantes
-- Esta tabela associa usuários do Clerk aos restaurantes (stores) que eles podem acessar

CREATE TABLE IF NOT EXISTS user_restaurants (
  id SERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,  -- ID do usuário no Clerk
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(clerk_user_id, store_id)
);

-- Índice para busca rápida por usuário
CREATE INDEX IF NOT EXISTS idx_user_restaurants_clerk_id ON user_restaurants(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_restaurants_store_id ON user_restaurants(store_id);

-- Comentários sobre a estrutura
COMMENT ON TABLE user_restaurants IS 'Gerencia quais restaurantes cada usuário pode acessar';
COMMENT ON COLUMN user_restaurants.clerk_user_id IS 'ID do usuário retornado pelo Clerk';
COMMENT ON COLUMN user_restaurants.store_id IS 'Referência ao restaurante (stores table)';

-- Exemplo de inserção:
-- Para o usuário dev@nola.com (Clerk ID: user_xyz123) com acesso a TODOS os restaurantes:
-- Não insira nada - sem restrições = acesso total

-- Para o usuário user@nola.com (Clerk ID: user_abc456) com acesso a apenas 3 restaurantes:
-- INSERT INTO user_restaurants (clerk_user_id, store_id) VALUES
--   ('user_abc456', 1),
--   ('user_abc456', 2),
--   ('user_abc456', 3);

-- NOTA: Para obter o Clerk User ID:
-- 1. Faça login com a conta no app
-- 2. Consulte o Clerk Dashboard ou use a API do Clerk
-- 3. Ou crie uma rota temporária que exiba o ID do usuário atual

