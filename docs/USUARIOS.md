# USUÁRIOS E PERMISSÕES

## VISÃO GERAL

Sistema de controle de acesso baseado em email. Usuários podem ter acesso total ou restrito a restaurantes específicos.

---

## USUÁRIOS CONFIGURADOS

### DEV (Acesso Total)
- **Email**: `dev@nola.br`
- **Senha**: `nola2025`
- **Acesso**: Todos os restaurantes
- **Configuração**: Whitelist hardcoded na API (`app/api/restaurantes/route.ts`)

### ALVES (Acesso Restrito)
- **Email**: `alves@usuario.com`
- **Senha**: `alvesUser`
- **Acesso**: 3 restaurantes com prefixo "Alves - "
  - Alves - Almeida de Jesus
  - Alves - Azevedo de Minas
  - Alves - Carvalho de da Cunha
- **Configuração**: Tabela `user_restaurants` (inserir registros manualmente)

---

## FUNCIONAMENTO

### Lógica de Acesso
1. **Whitelist**: Verifica se email está na whitelist → acesso total
2. **Tabela**: Busca em `user_restaurants` → acesso restrito aos restaurantes vinculados
3. **Bloqueio**: Email não encontrado → sem acesso

### Configuração SQL
Arquivo: `database/user-restaurants-permissions.sql`  
Tabela: `user_restaurants` (user_email, restaurant_id)

---
