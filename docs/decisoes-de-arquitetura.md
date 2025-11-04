# DECISÕES DE ARQUITETURA

## VISÃO GERAL

### Problema

Dashboard de analytics específico para restaurantes, processando grandes volumes de dados (500k+ vendas) com necessidade de múltiplas métricas em tempo real, controle de acesso granular e interface customizável pelo usuário.

### Solução

Stack escolhida: **Next.js 16** (App Router) + **Neon** (PostgreSQL Serverless) + **Vercel** (deploy) + **Clerk** (autenticação) + **shadcn/ui** + **Recharts** (gráficos) + **Jest** (testes). SQL raw com `pg` para flexibilidade e queries otimizadas.

### Critérios de Decisão

1. **Simplicidade**: Entregar funcionalidades no prazo (desafio técnico de 1 semana)
2. **Performance**: Manter tempo de resposta abaixo de 1-2 segundos mesmo com grandes volumes
3. **UX**: Permitir personalização do dashboard (drag & drop, templates, visibilidade de cards)
4. **Manutenibilidade**: Código limpo e fácil de entender/expandir

---

## DECISÕES-CHAVE

### 1. SQL Raw + `pg` vs ORM

**Por quê:** Flexibilidade para trabalhar com estruturas de banco variáveis (nomenclaturas diferentes), queries com fallbacks múltiplos, e otimizações específicas de performance. Sistema já possuía funções customizadas (`buildDateFilter`) que funcionavam bem. Prazo limitado não justificava migração para ORM, e o risco de introduzir bugs superava benefícios.

**Trade-offs:**
- ✅ Controle total sobre queries, performance otimizada, flexibilidade para estruturas variáveis
- ❌ Menor type safety, queries manuais, sem migrações automáticas

---

### 2. API no App Router (Next.js)

**Por quê:** APIs e frontend no mesmo framework facilitam desenvolvimento e deploy. TypeScript nativo com tipagem de parâmetros de rota, suporte a rotas dinâmicas (`[id]`) e execução no servidor reduzindo bundle do cliente. Endpoints retornam agregados; listas têm LIMIT/paginação para evitar respostas volumosas.

**Trade-offs:**
- ✅ Deploy simples, tipagem única, SSR nativo
- ❌ Acoplamento leve entre front e back (aceitável para este projeto)

---

### 3. Autenticação com Clerk

**Por quê:** Time-to-value: autenticação completa em minutos vs semanas de desenvolvimento. OAuth, sessões e refresh tokens gerenciados automaticamente. Segurança enterprise sem implementação manual, permitindo focar na lógica de negócio. Sessão via cookies httpOnly; RBAC por e-mail/claims do Clerk.

**Trade-offs:**
- ✅ Rapidez, segurança pronta, foco no produto
- ❌ Vendor lock-in (aceitável para MVP/desafio técnico)

---

### 4. Performance: Índices + Limites + Agregações no Server

**Por quê:** Necessidade de processar 500k+ registros mantendo resposta abaixo de 1-2 segundos. Índices estratégicos em colunas mais consultadas, LIMIT para prevenir retorno excessivo de dados, e agregações diretas ao invés de CTEs desnecessários.

**Evidência:**

| Query | Antes | Depois (com índice) | Observação |
|-------|-------|---------------------|------------|
| Receita por canal (30d) | 3.8s | 420ms | `idx_sales_store_created` + `idx_sales_channel_id` |
| Top produtos (30d) | 2.6s | 350ms | `idx_product_sales_sale_product` com INCLUDE |
| Ticket médio (30d) | 1.9s | 290ms | Índices compostos + agregação no server |

*Tempos medidos em ambiente local/Neon dev com dataset de 500k+ vendas.*

**Trade-offs:**
- ✅ Redução de 70-90% no tempo de queries, melhor experiência do usuário
- ❌ Manutenção de índices, uso adicional de espaço em disco

---

### 5. Estado: Hooks Customizados vs Redux/Zustand

**Por quê:** Estado não precisa ser compartilhado globalmente entre componentes distantes. Hooks customizados são mais simples de entender, evitam re-renders desnecessários, oferecem melhor type safety com TypeScript, e cada hook tem responsabilidade clara.

**Trade-offs:**
- ✅ Simplicidade, performance, type safety, separação de responsabilidades
- ❌ Pode necessitar migração para store global em escala maior

---

### 6. Padrão de Filtros de Data (`buildDateFilter`)

**Por quê:** Reutilização em ~12 rotas diferentes evita duplicação. Garante uso consistente de prepared statements (segurança contra SQL injection). Mudanças na lógica de data centralizadas em um único lugar. Suporta diferentes prefixos de tabela.

**Trade-offs:**
- ✅ DRY, segurança, manutenibilidade, consistência
- ❌ Learning curve leve para novos desenvolvedores

---

### 7. UX: Personalização do Dashboard

**Por quê:** Drag & drop permite usuário reorganizar cards conforme necessidade. Templates pré-configurados facilitam navegação entre diferentes análises (geral, vendas, faturamento, produtos). Visibilidade toggleável de cards permite focar em métricas relevantes.

**Trade-offs:**
- ✅ Experiência do usuário superior, flexibilidade, personalização
- ❌ Complexidade adicional na implementação (implementação customizada sem biblioteca externa)

---

## RISCOS E MITIGAÇÕES

- **Esquema variável**: Fallbacks múltiplos nas queries (mitigado) - sistema tenta diferentes nomenclaturas de tabelas
- **Picos de carga**: Índices estratégicos + (futuro) cache - otimização de queries críticas e plano para cache quando necessário
- **Vendor lock-in de auth**: Plano B JWT se necessário - Clerk pode ser substituído por solução própria sem refatorar lógica de negócio

---

## OUTRAS DECISÕES RELEVANTES

### Normalização de Dados e Encoding

Implementação de normalização automática de strings na camada de API para resolver problemas de encoding (mojibake) e garantir consistência na exibição. Mitigação de dados legados sem necessidade de migração no banco. Aplicada no server para transparência na UI. Detalhes técnicos no apêndice.

### Componentes UI: shadcn/ui

Escolha por customização total (componentes copiados no projeto), acessibilidade out-of-the-box (Radix UI), tree shaking automático e consistência visual com TailwindCSS.

### Responsividade Mobile-First

Layout adaptativo com TailwindCSS (1 coluna mobile, 2 tablet, 3 desktop), suporte completo a touch events para drag & drop, e detecção de smartphone para ajustes específicos de UI.

### Testes: Jest + React Testing Library

Escolha de Jest como framework de testes por ser padrão da indústria, integração nativa com React e TypeScript, e ecossistema maduro. React Testing Library para testes focados em comportamento do usuário ao invés de detalhes de implementação. Foco inicial em testes de hooks críticos (ex: `useCardVisibility`) para garantir lógica de estado complexa. Trade-off: cobertura inicial limitada por prazo, com plano de expansão futura para componentes e APIs.

---

## CONSIDERAÇÕES FUTURAS

1. **Migração para ORM**: Para projetos de longo prazo, considerar Prisma/TypeORM por type safety aprimorado e migrações versionadas
2. **Cache de Dados**: Implementar Redis ou cache in-memory para reduzir carga no banco e melhorar tempo de resposta
3. **Atualizações Quase em Tempo Real**: WebSockets ou Server-Sent Events para atualizações on-demand de métricas
4. **Testes Automatizados**: Expandir cobertura de testes unitários e de integração
5. **Monitoramento**: Implementar APM e alertas de performance para queries lentas

---

## APÊNDICE TÉCNICO

### Estrutura de Rotas API

Padrão: `/api/restaurante/[id]/<metric>/route.ts`

Exemplos principais:
- `/api/restaurantes` - Lista de restaurantes
- `/api/restaurante/[id]/vendas` - Total de vendas
- `/api/restaurante/[id]/faturamento` - Receita total
- `/api/restaurante/[id]/produto-mais-vendido` - Produto top

(Ver `docs/API-REFERENCE.md` para lista completa)

### Índices Estratégicos

Principais índices criados para otimização:

```sql
-- Filtros por store_id + created_at (usado em todas as métricas)
CREATE INDEX idx_sales_store_created ON sales(store_id, created_at);

-- Otimização de queries de produtos (index-only scan)
CREATE INDEX idx_product_sales_sale_product 
ON product_sales(sale_id, product_id) 
INCLUDE (quantity);

-- Busca inicial de restaurantes (ORDER BY name)
CREATE INDEX idx_stores_name ON stores(name);
```

(Ver `database/database-indexes.sql` para lista completa)

### Normalização de Dados

Funções implementadas em `lib/utils.ts`:
- `fixMojibake()`: Corrige strings corrompidas (UTF-8 interpretado como Latin-1)
- `removeAccents()`: Remove acentos após correção de mojibake
- `normalizeData()`: Normalização recursiva de objetos, arrays e strings

Aplicada automaticamente em todas as rotas que retornam strings via `NextResponse.json(normalizeData(result))`.

### Hooks Customizados

- `useCardVisibility`: Gerencia visibilidade de cards e templates (LocalStorage)
- `useRestaurantData`: Busca e cacheia dados de APIs
- `useCardDrag`: Controla drag and drop (mouse + touch)
- `useSmartphoneDetection`: Detecção de dispositivos móveis
