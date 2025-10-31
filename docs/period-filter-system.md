# SISTEMA DE FILTROS DE PERÍODO - ANO E MÊS

## VISÃO GERAL

Sistema implementado para permitir que o usuário filtre os dados dos cards por ano e mês específicos. Os dropdowns mostram apenas os períodos que realmente possuem dados no banco de dados, evitando que o usuário selecione períodos sem informações.

---

## FUNCIONALIDADES IMPLEMENTADAS

### 1. DROPDOWNS DINÂMICOS DE ANO E MÊS

- **Dropdown de Ano**: Localizado à esquerda, mostra apenas anos que possuem vendas no banco de dados
- **Dropdown de Mês**: Localizado à direita, mostra apenas meses que possuem dados
- **Opção "Todos"**: Ambos os dropdowns têm uma primeira opção "Todos os anos" / "Todos os meses" que remove o filtro específico

### 2. FILTRO INTELIGENTE DE MESES

- **Com "Todos os anos" selecionado**: Mostra todos os meses que têm dados em qualquer ano
- **Com ano específico selecionado**: Mostra apenas os meses daquele ano específico que possuem dados
- **Reset automático**: Se um mês específico estiver selecionado e o usuário escolher um ano que não tem dados naquele mês, o mês é resetado para "Todos os meses"

### 3. BUSCA AUTOMÁTICA DE PERÍODOS DISPONÍVEIS

- Quando um restaurante é selecionado, o sistema busca automaticamente quais anos e meses têm dados
- Os dropdowns são populados dinamicamente com base nos dados reais do banco

---

## ARQUITETURA DO CÓDIGO

### COMPONENTE PRINCIPAL: `PeriodSelector`

**Localização**: `components/PeriodSelector.tsx`

**Props**:
```typescript
interface PeriodSelectorProps {
  selected: Period;  // 'mensal' | 'anual' (mantido para compatibilidade)
  onSelect: (period: Period) => void;
  onYearChange?: (year: string | number) => void;  // Callback quando ano muda
  onMonthChange?: (month: string | number) => void;  // Callback quando mês muda
  restaurantId?: number | null;  // ID do restaurante selecionado
}
```

**Estados Internos**:
```typescript
const [selectedYear, setSelectedYear] = useState<string | number>('todos');
const [selectedMonth, setSelectedMonth] = useState<string | number>('todos');
const [availableYears, setAvailableYears] = useState<number[]>([]);
const [monthsByYear, setMonthsByYear] = useState<Record<number, number[]>>({});
const [loading, setLoading] = useState(false);
```

### API: `/api/restaurante/[id]/periodos-disponiveis`

**Localização**: `app/api/restaurante/[id]/periodos-disponiveis/route.ts`

**Função**: Busca anos e meses únicos que possuem vendas para um restaurante específico.

**Query SQL para Anos**:
```sql
SELECT DISTINCT EXTRACT(YEAR FROM created_at)::integer as year
FROM sales
WHERE store_id = $1
ORDER BY year DESC
```

**Query SQL para Meses**:
```sql
SELECT DISTINCT 
  EXTRACT(MONTH FROM created_at)::integer as month,
  EXTRACT(YEAR FROM created_at)::integer as year
FROM sales
WHERE store_id = $1
ORDER BY year DESC, month DESC
```

**Resposta da API**:
```typescript
{
  years: number[];  // Array de anos disponíveis [2024, 2023, 2022, ...]
  monthsByYear: {  // Objeto com meses agrupados por ano
    [year: number]: number[];  // { 2024: [1, 2, 3, ...], 2023: [6, 7, 8, ...] }
  }
}
```

---

## FLUXO DE FUNCIONAMENTO

### 1. SELEÇÃO DE RESTAURANTE

```
Usuário seleciona restaurante
    ↓
PeriodSelector detecta mudança em restaurantId
    ↓
Faz fetch para /api/restaurante/[id]/periodos-disponiveis
    ↓
Atualiza availableYears e monthsByYear
    ↓
Dropdowns são populados com períodos disponíveis
```

### 2. SELEÇÃO DE ANO

```
Usuário clica no dropdown de ano
    ↓
Vê opção "Todos os anos" + lista de anos disponíveis
    ↓
Seleciona um ano específico
    ↓
onYearChange é chamado
    ↓
selectedYear é atualizado
    ↓
getAvailableMonths() filtra meses para mostrar apenas do ano selecionado
    ↓
Se mês atual não tem dados no ano selecionado, mês é resetado para "todos"
```

### 3. SELEÇÃO DE MÊS

```
Usuário clica no dropdown de mês
    ↓
Vê opção "Todos os meses" + meses disponíveis (filtrados por ano se aplicável)
    ↓
Seleciona um mês específico
    ↓
onMonthChange é chamado
    ↓
selectedMonth é atualizado
```

### 4. ATUALIZAÇÃO DOS CARDS

```
Valores de ano/mês mudam
    ↓
useRestaurantData detecta mudança
    ↓
Refaz todas as chamadas de API com novos parâmetros
    ↓
Cards são atualizados com dados filtrados
```

---

## INTEGRAÇÃO COM APIs

### PARÂMETROS DE QUERY

Todas as APIs de dados agora aceitam três parâmetros opcionais:

1. **period**: `'mensal' | 'anual'` (mantido para compatibilidade)
2. **year**: Ano específico (ex: `2024`) ou omitido/`'todos'` para todos os anos
3. **month**: Mês específico (ex: `3` para março) ou omitido/`'todos'` para todos os meses

**Exemplo de URL**:
```
/api/restaurante/1/vendas?period=anual&year=2024&month=3
```

### FUNÇÃO UTILITÁRIA: `buildDateFilter`

**Localização**: `lib/dateFilter.ts`

**Função**: Constrói filtros SQL seguros usando prepared statements.

**Parâmetros**:
```typescript
buildDateFilter(
  year: string | null | undefined,
  month: string | null | undefined,
  period: string,
  tableAlias: string = '',
  paramIndex: number = 2
): { filter: string; params: any[] }
```

**Exemplos de Filtros Gerados**:

1. **Ano e mês específicos**:
   ```sql
   AND EXTRACT(YEAR FROM s.created_at) = $2 AND EXTRACT(MONTH FROM s.created_at) = $3
   ```
   Parâmetros: `[2024, 3]`

2. **Apenas ano específico**:
   ```sql
   AND EXTRACT(YEAR FROM s.created_at) = $2
   ```
   Parâmetros: `[2024]`

3. **Apenas mês específico** (sem ano):
   ```sql
   AND EXTRACT(MONTH FROM s.created_at) = $2
   ```
   Parâmetros: `[3]`

4. **"Todos" selecionado** (fallback para período padrão):
   ```sql
   AND s.created_at >= NOW() - INTERVAL '30 days'  -- Se period === 'mensal'
   ```
   Parâmetros: `[]`

**Segurança**: Usa prepared statements para prevenir SQL injection.

---

## APIs ATUALIZADAS

Todas as seguintes APIs foram atualizadas para aceitar filtros de ano/mês:

1. **`/api/restaurante/[id]/vendas`**
   - Filtra contagem de vendas por ano/mês

2. **`/api/restaurante/[id]/faturamento`**
   - Filtra receita total por ano/mês

3. **`/api/restaurante/[id]/produto-mais-vendido`**
   - Filtra produto mais vendido por ano/mês

4. **`/api/restaurante/[id]/vendas-por-turno`**
   - Filtra distribuição de vendas por turno por ano/mês

5. **`/api/restaurante/[id]/ticket-medio`**
   - Filtra ticket médio por ano/mês
   - Calcula período anterior automaticamente baseado no ano/mês selecionado

6. **`/api/restaurante/[id]/vendas-por-canal`**
   - Filtra vendas por canal por ano/mês

7. **`/api/restaurante/[id]/produtos-ranking`**
   - Filtra ranking de produtos por ano/mês

8. **`/api/restaurante/[id]/periodos-disponiveis`** (NOVA)
   - Retorna anos e meses que possuem dados

---

## CASOS DE USO

### CASO 1: Ver dados de um mês específico
1. Usuário seleciona restaurante
2. Seleciona ano (ex: 2024)
3. Seleciona mês (ex: Março)
4. Todos os cards mostram dados apenas de março de 2024

### CASO 2: Ver dados de um ano completo
1. Usuário seleciona restaurante
2. Seleciona ano (ex: 2024)
3. Deixa mês como "Todos os meses"
4. Todos os cards mostram dados de todo o ano de 2024

### CASO 3: Ver dados de um mês em qualquer ano
1. Usuário seleciona restaurante
2. Deixa ano como "Todos os anos"
3. Seleciona mês (ex: Dezembro)
4. Todos os cards mostram dados de dezembro de todos os anos disponíveis

### CASO 4: Ver todos os dados
1. Usuário seleciona restaurante
2. Deixa ano como "Todos os anos"
3. Deixa mês como "Todos os meses"
4. Todos os cards mostram dados completos (comportamento padrão)

---

## COMPORTAMENTO INTELIGENTE

### RESET AUTOMÁTICO DE MÊS

Quando um usuário seleciona um ano específico, se o mês atualmente selecionado não possui dados naquele ano, o mês é automaticamente resetado para "Todos os meses".

**Exemplo**:
- Mês atual: Março (3)
- Ano selecionado: 2024 (não tem dados em março de 2024)
- Resultado: Mês é resetado para "Todos os meses"

### FILTRO DINÂMICO DE MESES

O dropdown de meses muda dinamicamente baseado na seleção do ano:

- **Ano = "Todos"**: Mostra todos os meses que têm dados em qualquer ano
- **Ano = 2024**: Mostra apenas meses de 2024 que têm dados

---

## HOOK: `useRestaurantData`

**Localização**: `app/hooks/useRestaurantData.ts`

O hook foi atualizado para aceitar e passar parâmetros de ano/mês:

```typescript
export function useRestaurantData(
  selectedRestaurant: number | null,
  period: Period,
  year?: string | number,
  month?: string | number
)
```

**Comportamento**:
- Observa mudanças em `year` e `month`
- Quando mudam, refaz todas as chamadas de API com os novos parâmetros
- Atualiza os cards automaticamente com dados filtrados

---

## ESTADO NA PÁGINA PRINCIPAL

**Localização**: `app/page.tsx`

```typescript
const [selectedYear, setSelectedYear] = useState<string | number>('todos');
const [selectedMonth, setSelectedMonth] = useState<string | number>('todos');
```

Estes estados são passados para:
- `PeriodSelector` (via `onYearChange` e `onMonthChange`)
- `useRestaurantData` (para filtrar dados)

---

## EXPERIÊNCIA DO USUÁRIO

### FEEDBACK VISUAL

- **Loading**: Mostra "Carregando..." enquanto busca períodos disponíveis
- **Sem dados**: Mostra "Nenhum dado disponível" se não houver períodos
- **Seleção ativa**: Ano/mês selecionado fica destacado (background color accent)

### ESTADOS DO DROPDOWN

- **Fechado**: Mostra valor atual selecionado + seta para baixo
- **Aberto**: Seta rotaciona 180°, mostra lista de opções
- **Foco automático**: Input de busca recebe foco quando dropdown abre

---

## SEGURANÇA

### PREVENÇÃO DE SQL INJECTION

Todas as queries usam prepared statements através da função `buildDateFilter`:

```typescript
// ✅ SEGURO - Usa prepared statements
const { filter, params } = buildDateFilter(year, month, period, 's.');
await pool.query(`SELECT ... WHERE store_id = $1 ${filter}`, [id, ...params]);

// ❌ INSEGURO - Interpolação direta (NÃO usado)
// `WHERE EXTRACT(YEAR FROM created_at) = ${year}`  // NUNCA FAZER ISSO
```

---

## PERFORMANCE

### OTIMIZAÇÕES IMPLEMENTADAS

1. **Índices SQL**: As queries de filtro por ano/mês se beneficiam dos índices existentes em `created_at`
2. **Cache de Períodos**: Períodos disponíveis são buscados apenas quando o restaurante muda
3. **Queries Otimizadas**: `EXTRACT(YEAR FROM ...)` e `EXTRACT(MONTH FROM ...)` são rápidos com índices

### QUERIES RELACIONADAS

As queries de filtro usam os mesmos índices das queries principais:
- `idx_sales_store_created` - Otimiza filtros por store_id e created_at
- `idx_sales_store_id` - Otimiza filtros por store_id

---

## EXEMPLO DE USO COMPLETO

### CENÁRIO: Analisar dados de dezembro de 2023

1. **Usuário seleciona restaurante**
   - Dropdowns carregam períodos disponíveis
   - Anos: [2024, 2023, 2022]
   - Meses (todos): [12, 11, 10, ...]

2. **Usuário seleciona ano 2023**
   - Dropdown de meses atualiza
   - Meses disponíveis em 2023: [12, 11, 10, 8, 7, ...]
   - Se mês anterior (ex: 5) não existe em 2023, reset para "Todos os meses"

3. **Usuário seleciona mês 12 (Dezembro)**
   - Todos os cards atualizam
   - APIs são chamadas com `year=2023&month=12`
   - Cards mostram dados apenas de dezembro de 2023

4. **Cards exibem dados filtrados**
   - Vendas: Total de vendas em dez/2023
   - Faturamento: Receita de dez/2023
   - Produto Mais Vendido: Produto mais vendido em dez/2023
   - Vendas por Turno: Distribuição de dez/2023
   - Ticket Médio: Comparado com nov/2023
   - Vendas por Canal: Canais de dez/2023

---

## MANUTENÇÃO E EXTENSÃO

### ADICIONAR NOVA API COM FILTRO

Para adicionar uma nova API que respeite os filtros de ano/mês:

1. Importe a função utilitária:
   ```typescript
   import { buildDateFilter } from '@/lib/dateFilter';
   ```

2. Busque parâmetros da query:
   ```typescript
   const year = searchParams.get('year');
   const month = searchParams.get('month');
   const period = searchParams.get('period') || 'anual';
   ```

3. Construa o filtro:
   ```typescript
   const { filter: dateFilter, params: dateParams } = buildDateFilter(
     year, month, period, 's.'  // 's.' se usar alias 's' na query
   );
   ```

4. Use na query:
   ```typescript
   const result = await pool.query(
     `SELECT ... FROM sales s WHERE s.store_id = $1 ${dateFilter}`,
     [id, ...dateParams]
   );
   ```

### MODIFICAR LÓGICA DE FILTRO

Edite `lib/dateFilter.ts` para alterar como os filtros são construídos.

---

## TROUBLESHOOTING

### PROBLEMA: Dropdowns não mostram períodos

**Possíveis causas**:
1. Restaurante não selecionado → Dropdowns ficam vazios até seleção
2. Erro na API → Verificar console do navegador
3. Sem dados no banco → Mensagem "Nenhum dado disponível" aparece

**Solução**: Verificar se o restaurante foi selecionado e se há dados no banco.

### PROBLEMA: Cards não atualizam ao mudar ano/mês

**Possíveis causas**:
1. `useRestaurantData` não está observando `year` e `month`
2. Callbacks não estão sendo chamados

**Solução**: Verificar se `onYearChange` e `onMonthChange` estão conectados corretamente.

### PROBLEMA: Mês não reseta ao mudar ano

**Causa**: Lógica de reset pode não estar funcionando

**Solução**: Verificar a lógica no `PeriodSelector` quando ano muda.

---

## MELHORIAS FUTURAS POSSÍVEIS

1. **Cache de períodos**: Armazenar períodos disponíveis para evitar refetch ao reabrir dropdown
2. **Busca de períodos combinados**: Mostrar anos/meses apenas quando ambos têm dados (ex: mostrar dezembro apenas se tiver dados em algum ano)
3. **Filtros avançados**: Adicionar opção para filtrar por trimestre, semestre, etc.
4. **Comparação de períodos**: Permitir comparar dois períodos lado a lado
5. **Range de datas**: Selecionar período inicial e final (ex: de janeiro a março)

---

## ARQUIVOS MODIFICADOS/CRIADOS

### NOVOS ARQUIVOS:
- `app/api/restaurante/[id]/periodos-disponiveis/route.ts` - API para buscar períodos disponíveis
- `lib/dateFilter.ts` - Função utilitária para construir filtros SQL
- `docs/period-filter-system.md` - Esta documentação

### ARQUIVOS MODIFICADOS:
- `components/PeriodSelector.tsx` - Adicionado lógica de períodos dinâmicos
- `app/components/CardControls.tsx` - Adicionado prop `restaurantId`
- `app/page.tsx` - Adicionado estados de `selectedYear` e `selectedMonth`
- `app/hooks/useRestaurantData.ts` - Adicionado parâmetros `year` e `month`
- Todas as APIs em `app/api/restaurante/[id]/*/route.ts` - Atualizadas para aceitar filtros

---

## CONCLUSÃO

O sistema de filtros de período por ano e mês fornece uma experiência completa para análise de dados, permitindo que usuários explorem dados históricos de forma precisa e intuitiva, mostrando apenas os períodos que realmente possuem informações no banco de dados.

