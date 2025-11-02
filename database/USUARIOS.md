# 👥 Usuários Configurados

## 1️⃣ Usuário DEV (acesso total)

**Email:** dev@nola.br  
**Senha:** nola2025  
**Acesso:** TODOS os restaurantes  
**Configuração:** NENHUMA (padrão)

### ✅ Comportamento
- Usuário com email `dev@nola.br` tem acesso TOTAL
- Não precisa inserir nenhum registro no banco
- A API detecta automaticamente quando um usuário não tem restrições
- Retorna todos os restaurantes da tabela `stores`

### 🔍 Como Funciona

A lógica está em `app/api/restaurantes/route.ts`:

```typescript
// Whitelist de usuários permitidos
const ALLOWED_USERS = {
  'dev@nola.br': 'DEV', // Acesso total
};

// Se o email está na whitelist como DEV = acesso total
if (userType === 'DEV') {
  result = await pool.query('SELECT id, name FROM stores ORDER BY name');
}
```

## 2️⃣ Usuário ALVES (limitado)

**Email:** alves@usuario.com  
**Senha:** alvesUser  
**Acesso:** 3 restaurantes com prefixo "Alves - "  
**Exclusão:** NÃO inclui "Alves das Neves"  
**Status:** ✅ Configurado e funcional

### 📝 Restaurantes Permitidos
1. Alves - Almeida de Jesus
2. Alves - Azevedo de Minas
3. Alves - Carvalho de da Cunha

### ⚠️ NÃO Incluir
- ❌ Alves das Neves S.A. - Costa do Galho

---

## 🧪 Como Testar

### Testar DEV
1. Fazer login com `dev@nola.br` / `nola2025`
2. Verificar se vê TODOS os restaurantes no dropdown

### Testar ALVES
1. Fazer login com `alves@usuario.com` / `alvesUser`
2. Verificar se vê apenas os 3 restaurantes "Alves - "
3. Confirmar que NÃO aparece "Alves das Neves"

## 🎯 Resumo

| Usuário | Email | Acesso | Config SQL |
|---------|-------|--------|------------|
| DEV | dev@nola.br | Todos restaurantes | Whitelist hardcoded |
| ALVES | alves@usuario.com | 3 restaurantes "Alves - " | Inserir registros na tabela |
| Outros | Qualquer outro | Sem acesso | Bloqueado |

## ⚠️ Importante

- **DEV**: Email está na whitelist hardcoded na API
- **ALVES**: Precisa de registros na tabela `user_restaurants`
- **Outros**: Bloqueados automaticamente (sem acesso)
- **Novos usuários**: Precisam estar na whitelist OU ter registros na tabela

