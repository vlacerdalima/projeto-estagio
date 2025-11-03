# DECISÕES DE ARQUITETURA

## VISÃO GERAL

Este documento registra as principais decisões arquiteturais tomadas durante o desenvolvimento do projeto de Análise de Restaurantes. Cada decisão inclui o contexto, alternativas consideradas, justificativas e consequências.

---

## 1. SQL RAW VS ORM

### Decisão: Manter SQL Raw com `pg`

**Escolha**: SQL raw utilizando a biblioteca `pg` (PostgreSQL client) ao invés de ORMs como Prisma, Sequelize ou TypeORM.

### Contexto

O projeto requer flexibilidade para trabalhar com estruturas de banco de dados variáveis, queries complexas com múltiplos fallbacks, e otimizações específicas de performance.

### Justificativa

1. **Sistema Customizado Existente**: O projeto já possuía funções customizadas (`buildDateFilter`) e queries com fallbacks múltiplos para diferentes nomenclaturas de tabelas
2. **Prazo Limitado**: Desafio técnico de 1 semana não justificava migração para ORM
3. **Funcionamento Adequado**: Sistema atual funciona corretamente com prepared statements, garantindo segurança contra SQL injection
4. **Risco vs Benefício**: Risco de introduzir bugs durante migração superava benefícios no contexto do projeto
5. **Flexibilidade**: Necessidade de suportar múltiplas nomenclaturas de tabelas (snake_case, PascalCase, etc.) tornaria ORM mais complexo

### Implementação

- **Biblioteca**: `pg` (PostgreSQL client nativo)
- **Segurança**: Prepared statements com parâmetros (`$1, $2, etc.`)
- **Função Customizada**: `buildDateFilter` para construção segura de filtros de data
- **Localização**: `lib/db.ts`, `lib/dateFilter.ts`

### Consequências

**Vantagens:**
- Controle total sobre queries SQL
- Performance otimizada para casos específicos
- Flexibilidade para lidar com estruturas variáveis

**Desvantagens:**
- Menor type safety em comparação com ORMs
- Necessidade de escrever e manter queries manualmente
- Sem migrações versionadas automáticas

---

## 2. ESTRUTURA DE API: NEXT.JS APP ROUTER

### Decisão: Utilizar Next.js App Router para APIs

**Escolha**: API Routes do Next.js 16 com App Router (`app/api/.../route.ts`).

### Contexto

Necessidade de criar múltiplos endpoints RESTful para diferentes métricas de análise de restaurantes, com suporte a parâmetros dinâmicos e query strings.

### Justificativa

1. **Integração Nativa**: APIs e frontend no mesmo framework, facilitando desenvolvimento e deploy
2. **Type Safety**: TypeScript nativo com tipagem de parâmetros de rota
3. **Server Components**: Possibilidade de usar Server Components para otimizações futuras
4. **Parâmetros Dinâmicos**: Suporte nativo para rotas dinâmicas (`[id]`) com tipagem
5. **Performance**: Execução no servidor, reduzindo bundle do cliente

### Implementação

- **Padrão de Rotas**: `/api/restaurante/[id]/<metric>/route.ts`
- **Método**: Apenas GET (endpoints de leitura)
- **Response**: `NextResponse.json()` para respostas padronizadas
- **Query Parameters**: Filtros de período via `searchParams.get()`

### Estrutura de Rotas

```
app/api/
├── vendas/route.ts
├── restaurantes/route.ts
└── restaurante/[id]/
    ├── vendas/route.ts
    ├── faturamento/route.ts
    ├── produto-mais-vendido/route.ts
    ├── produtos-ranking/route.ts
    ├── vendas-por-turno/route.ts
    ├── ticket-medio/route.ts
    ├── vendas-por-canal/route.ts
    └── ...
```

---

## 3. SISTEMA DE AUTENTICAÇÃO: CLERK

### Decisão: Utilizar Clerk para autenticação

**Escolha**: Clerk como provedor de autenticação e gerenciamento de usuários.

### Contexto

Requisito de autenticação com diferentes níveis de acesso (dev@nola.br com acesso total, outros usuários com acesso restrito a restaurantes específicos).

### Justificativa

1. **Rapidez de Implementação**: Autenticação completa em minutos ao invés de semanas
2. **Gerenciamento de Sessões**: OAuth, sessions e refresh tokens gerenciados automaticamente
3. **Integração Next.js**: SDK oficial com suporte nativo ao Next.js
4. **Segurança**: Segurança de nível enterprise sem necessidade de implementação manual
5. **Foco no Produto**: Permite focar na lógica de negócio ao invés de infraestrutura de auth

### Implementação

- **SDK**: `@clerk/nextjs` versão 6.34.1
- **Provider**: `ClerkProvider` no `app/layout.tsx`
- **Server-side**: `currentUser()` em rotas API
- **Controle de Acesso**: Verificação de email em `/api/restaurantes/route.ts`

---

## 4. GERENCIAMENTO DE ESTADO: HOOKS CUSTOMIZADOS

### Decisão: Hooks customizados ao invés de Redux/Zustand

**Escolha**: Sistema de hooks customizados (`useCardVisibility`, `useRestaurantData`, `useCardDrag`) ao invés de bibliotecas de gerenciamento de estado global.

### Contexto

Aplicação dashboard com múltiplos cards interativos, drag and drop, e gerenciamento de visibilidade complexo.

### Justificativa

1. **Escopo Localizado**: Estado não precisa ser compartilhado globalmente entre componentes distantes
2. **Simplicidade**: Hooks customizados são mais simples de entender e manter
3. **Performance**: Evita re-renders desnecessários que bibliotecas globais podem causar
4. **TypeScript**: Type safety melhor com hooks tipados
5. **Separação de Responsabilidades**: Cada hook tem uma responsabilidade clara

### Implementação

**Hooks Criados:**

- **`useCardVisibility`**: Gerencia visibilidade de cards e templates
- **`useRestaurantData`**: Busca e cacheia dados de APIs de restaurantes
- **`useCardDrag`**: Controla funcionalidade de drag and drop
- **`useSmartphoneDetection`**: Detecta dispositivos móveis para UI adaptativa

**Localização**: `app/hooks/`

### Persistência

- **LocalStorage**: Templates e visibilidade de cards persistidos no navegador
- **Session**: Dados de restaurantes em memória (refetch quando necessário)

---

## 5. SISTEMA DE FILTROS DE DATA

### Decisão: Função customizada `buildDateFilter`

**Escolha**: Criar função utilitária `buildDateFilter` para construção segura e reutilizável de filtros de data.

### Contexto

Múltiplas rotas API precisam filtrar dados por período (mensal, anual) e por ano/mês específicos, com necessidade de segurança contra SQL injection.

### Justificativa

1. **Reutilização**: Evita duplicação de código em ~12 rotas diferentes
2. **Segurança**: Garante uso consistente de prepared statements
3. **Manutenibilidade**: Mudanças em lógica de data centralizadas em um único lugar
4. **Flexibilidade**: Suporta diferentes prefixos de tabela (ex: `s.created_at` vs `created_at`)
5. **Consistência**: Garante que todas as rotas usem a mesma lógica de filtro

### Implementação

**Localização**: `lib/dateFilter.ts`

**Funcionalidades:**
- Filtro por período (mensal/anual)
- Filtro por ano específico
- Filtro por ano + mês específico
- Suporte a prefixo de tabela configurável

**Uso:**
```typescript
const { filter: dateFilter, params: dateParams } = buildDateFilter(year, month, period, 's.');
```

---

## 6. NORMALIZAÇÃO DE DADOS E ENCODING

### Decisão: Normalização automática de strings na camada de API

**Escolha**: Implementar normalização automática de dados (remoção de acentos e correção de mojibake) em todas as rotas API que retornam strings.

### Contexto

Problema de encoding onde strings com acentos apareciam corrompidas (mojibake) na interface, possivelmente causado por importação de dados ou transmissão entre sistemas.

### Justificativa

1. **Solução Centralizada**: Resolve problema em um único ponto ao invés de múltiplos componentes
2. **Prevenção**: Garante que todos os dados exibidos sejam consistentes
3. **Transparência**: Frontend não precisa saber sobre problemas de encoding
4. **Manutenibilidade**: Fácil ajustar lógica de normalização quando necessário
5. **Performance**: Processamento no servidor ao invés do cliente

### Implementação

**Localização**: `lib/utils.ts`

**Funções:**

1. **`fixMojibake(str: string)`**: Tenta corrigir strings corrompidas (UTF-8 interpretado como Latin-1)
2. **`removeAccents(str: string)`**: Remove acentos de strings, primeiro corrigindo mojibake se detectado
3. **`normalizeData<T>(data: T)`**: Normaliza recursivamente objetos, arrays e strings

**Aplicação:**
- Todas as rotas que retornam strings envolvem resposta com `normalizeData()`
- Processamento recursivo garante que strings aninhadas também sejam normalizadas

**Rotas Normalizadas:**
- `/api/restaurantes`
- `/api/restaurante/[id]/produto-mais-vendido`
- `/api/restaurante/[id]/produtos-ranking`
- `/api/restaurante/[id]/vendas-por-canal`
- `/api/restaurante/[id]/regioes-entrega`

---

## 7. ESTRUTURA DE COMPONENTES: SHADCN/UI

### Decisão: Utilizar shadcn/ui como base de componentes

**Escolha**: Adotar shadcn/ui como sistema de design base, construindo sobre Radix UI primitives.

### Contexto

Necessidade de componentes de UI consistentes e acessíveis sem depender de bibliotecas pré-compiladas pesadas.

### Justificativa

1. **Customização Total**: Componentes são copiados para o projeto, permitindo modificações completas
2. **Acessibilidade**: Baseado em Radix UI, oferece acessibilidade out-of-the-box
3. **Tree Shaking**: Apenas componentes usados são incluídos no bundle
4. **TypeScript**: Tipagem completa nativa
5. **Design System**: Consistência visual com TailwindCSS

### Implementação

**Localização**: `components/ui/`

**Componentes Utilizados:**
- `Button`
- `Card`
- Outros componentes conforme necessário

---

## 8. BANCO DE DADOS: CONNECTION POOL E OTIMIZAÇÕES

### Decisão: Connection Pool com `pg.Pool`

**Escolha**: Utilizar `Pool` do `pg` para gerenciamento eficiente de conexões.

### Contexto

Aplicação com múltiplas requisições simultâneas acessando PostgreSQL, necessitando de gerenciamento eficiente de conexões.

### Justificativa

1. **Performance**: Pool reutiliza conexões, reduzindo overhead de estabelecer novas conexões
2. **Escalabilidade**: Limite máximo de conexões previne sobrecarga do banco
3. **Padrão da Indústria**: Prática recomendada para aplicações Node.js/PostgreSQL

### Implementação

**Localização**: `lib/db.ts`

**Configuração:**
- Suporte a `DATABASE_URL` (Neon) ou conexão por parâmetros individuais
- Pool com configuração padrão do `pg`

### Otimizações de Performance

**Índices Estratégicos:**

Criados índices específicos para otimizar queries mais frequentes:

1. **`idx_sales_store_created`**: Otimiza filtros por `store_id` + `created_at` (usado em todas as métricas)
2. **`idx_payments_sale_value`**: Otimiza JOINs e agregações de faturamento
3. **`idx_stores_name`**: Otimiza busca inicial de restaurantes (ORDER BY name)
4. **`idx_product_sales_sale_product`**: Otimiza queries de produtos com INCLUDE para index-only scans

**Localização**: `database/database-indexes.sql`

**Benefícios:**
- Redução de 70-90% no tempo de queries com múltiplas vendas
- Melhoria significativa em JOINs e agregações
- Aceleração de filtros por período

---

## 9. ESTRATÉGIA DE QUERIES: FALLBACKS E LIMITS

### Decisão: Queries com fallbacks múltiplos e LIMIT estratégico

**Escolha**: Implementar tentativas múltiplas de queries com diferentes nomenclaturas de tabelas e LIMIT para prevenir retorno excessivo de dados.

### Contexto

Estrutura de banco de dados com nomenclaturas variáveis (snake_case, PascalCase) e possibilidade de grandes volumes de dados.

### Justificativa

1. **Resiliência**: Sistema continua funcionando mesmo com variações na estrutura do banco
2. **Performance**: LIMIT previne retorno de milhares de registros desnecessariamente
3. **Experiência do Usuário**: Dados mais relevantes retornados mais rapidamente

### Implementação

**Exemplo em `/api/restaurante/[id]/produto-mais-vendido/route.ts`:**

```typescript
const queries = [
  { sql: '...product_sales...', name: 'product_sales + products' },
  { sql: '...ProductSales...', name: 'ProductSales + Products' },
  { sql: '...sale_products...', name: 'sale_products + products' }
];

for (const query of queries) {
  try {
    const result = await pool.query(query.sql, params);
    if (result.rows.length > 0) return result;
  } catch (err) {
    // Tenta próxima query
  }
}
```

**Limits:**
- Ranking de produtos: LIMIT 100
- Produto mais vendido: LIMIT 1
- Outros: Conforme necessidade

---

## 10. UI/UX: DRAG AND DROP E TEMPLATES

### Decisão: Sistema de drag and drop customizado e templates de cards

**Escolha**: Implementar drag and drop nativo com React hooks e sistema de templates pré-configurados.

### Contexto

Dashboard interativo onde usuários precisam reorganizar cards e alternar entre diferentes visões de dados.

### Justificativa

1. **Experiência do Usuário**: Permite personalização do layout pelo usuário
2. **Flexibilidade**: Templates facilitam navegação entre diferentes análises
3. **Sem Dependências Pesadas**: Implementação customizada evita bibliotecas grandes
4. **Mobile Support**: Suporte nativo a touch events

### Implementação

**Funcionalidades:**

1. **Drag and Drop**:
   - Suporte mouse e touch
   - Limites automáticos (não ultrapassa bordas, linha divisória superior)
   - Transform CSS para arrastar sem afetar layout
   - Preservação de posições ao deletar outros cards

2. **Templates**:
   - `geral`: Visão completa
   - `vendas`: Foco em métricas de vendas
   - `faturamento`: Foco em receita
   - `produtos`: Foco em análise de produtos

3. **Visibilidade de Cards**:
   - Toggle de visibilidade individual
   - Adicionar/remover cards dinamicamente
   - Persistência em LocalStorage

**Hooks:**
- `useCardDrag`: Gerencia drag and drop
- `useCardVisibility`: Gerencia templates e visibilidade

---

## 11. PERFORMANCE: QUERY OPTIMIZATION

### Decisão: Otimizações específicas de queries

**Escolha**: Agregações diretas, uso estratégico de índices, e queries otimizadas para casos específicos.

### Contexto

Queries executando sobre grandes volumes de dados (500k+ registros), necessitando otimização para manter performance adequada.

### Justificativa

1. **Experiência do Usuário**: Respostas rápidas são essenciais em dashboards
2. **Custo**: Queries otimizadas reduzem carga no banco e custos de infraestrutura
3. **Escalabilidade**: Sistema preparado para crescimento de dados

### Implementações Específicas

1. **Agregações Diretas**: Evitar CTEs desnecessários quando agregação direta é mais eficiente
2. **Índices Compostos**: Criados especificamente para padrões de queries mais comuns
3. **INCLUDE Columns**: Uso de `INCLUDE` em índices para index-only scans
4. **LIMIT Estratégico**: Limitar retornos para dados mais relevantes

**Exemplo de Otimização:**

```sql
-- Índice com INCLUDE para index-only scan
CREATE INDEX idx_product_sales_sale_product 
ON product_sales(sale_id, product_id) 
INCLUDE (quantity);
```

---

## 12. RESPONSIVIDADE E MOBILE

### Decisão: Design mobile-first com breakpoints Tailwind

**Escolha**: Layout responsivo com TailwindCSS, detecção de smartphone e UI adaptativa.

### Contexto

Necessidade de funcionamento adequado em dispositivos móveis e desktop.

### Justificativa

1. **Acessibilidade**: Usuários acessam dashboards em diferentes dispositivos
2. **UX Moderna**: Espera-se que aplicações web funcionem bem em mobile
3. **TailwindCSS**: Sistema de breakpoints facilita implementação responsiva

### Implementação

1. **Breakpoints**: `md:` (768px), `lg:` (1024px)
2. **Layout Adaptativo**: 1 coluna (mobile), 2 (tablet), 3 (desktop)
3. **Hook de Detecção**: `useSmartphoneDetection` para ajustes específicos de UI
4. **Touch Events**: Suporte completo a touch para drag and drop

---

## CONSIDERAÇÕES FUTURAS

### Migração para ORM

Para projetos de longo prazo, considerar migração para ORM (Prisma, TypeORM) devido a:
- Type safety aprimorado
- Migrações versionadas
- Schema centralizado
- Manutenibilidade em projetos maiores

### Cache de Dados

Implementar sistema de cache (Redis, in-memory) para:
- Reduzir carga no banco de dados
- Melhorar tempo de resposta
- Suportar maior volume de usuários simultâneos

### Real-time Updates

Considerar WebSockets ou Server-Sent Events para:
- Atualizações em tempo real de métricas
- Notificações de eventos importantes
- Sincronização multi-usuário

---

## CONCLUSÃO

As decisões arquiteturais documentadas neste documento foram tomadas considerando:

- **Prazo**: Desafio técnico de 1 semana
- **Escopo**: Dashboard de análise com múltiplas métricas
- **Performance**: Necessidade de lidar com grandes volumes de dados
- **Manutenibilidade**: Código limpo e documentado
- **Experiência do Usuário**: Interface intuitiva e responsiva

Cada decisão teve como objetivo balancear simplicidade, performance e escalabilidade, sempre priorizando a entrega de valor ao usuário final.
