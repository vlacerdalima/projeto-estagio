# 🚀 Projeto Estágio

Aplicação desenvolvida como parte do processo para estágio, utilizando tecnologias modernas com foco em performance, escalabilidade e boas práticas de desenvolvimento.

---

## 🧩 Stack Principal
- **Next.js (App Router + TypeScript)**
- **TailwindCSS + shadcn/ui + Recharts**
- **Prisma ORM**
- **Better Auth (autenticação)**
- **Docker / Docker Compose**

---

## 📋 Configuração do Banco de Dados

### 1. Criar arquivo `.env.local`

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=seu_banco_de_dados
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
```

### 2. Ajustar o nome da tabela

No arquivo `app/api/vendas/route.ts`, ajuste a query SQL de acordo com sua tabela:

```typescript
// Se sua tabela não se chama "vendas", troque aqui
const result = await pool.query('SELECT COUNT(*) as total FROM vendas');
```

### 3. Iniciar o servidor

```bash
npm run dev
```

Acesse `http://localhost:3000` para ver o total de vendas.


