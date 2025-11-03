# FILTROS DE PERÍODO (ANO E MÊS)

## VISÃO GERAL

Sistema de filtros dinâmicos que permite selecionar ano e mês específicos para análise dos dados. Dropdowns mostram apenas períodos com dados disponíveis no banco.

---

## FUNCIONALIDADES

### Dropdowns Dinâmicos
- **Ano**: Lista anos que possuem vendas no banco
- **Mês**: Lista meses filtrados pelo ano selecionado (ou todos se ano = "Todos")
- **Opção "Todos"**: Remove filtro específico

### Comportamento Inteligente
- Reset automático: Se mês selecionado não existe no ano escolhido, reseta para "Todos os meses"
- Filtro dinâmico: Meses disponíveis mudam baseado no ano selecionado

---

## ARQUITETURA

### Componente Principal
**`PeriodSelector.tsx`**: Gerencia dropdowns de ano e mês

### API
**`/api/restaurante/[id]/periodos-disponiveis`**: Retorna anos e meses disponíveis

```typescript
{
  years: number[];           // [2024, 2023, 2022, ...]
  monthsByYear: {           // { 2024: [1,2,3,...], 2023: [6,7,8,...] }
    [year: number]: number[];
  }
}
```

### Função Utilitária
**`buildDateFilter`** (`lib/dateFilter.ts`): Constrói filtros SQL seguros com prepared statements

---

## INTEGRAÇÃO

### Parâmetros de Query
Todas as APIs aceitam:
- `period`: 'mensal' | 'anual'
- `year`: Ano específico ou 'todos'
- `month`: Mês específico (1-12) ou 'todos'

### APIs Atualizadas
Todas as rotas em `/api/restaurante/[id]/` respeitam os filtros:
- `/vendas`, `/faturamento`, `/produto-mais-vendido`
- `/vendas-por-turno`, `/ticket-medio`, `/vendas-por-canal`
- `/produtos-ranking`, etc.

---

## SEGURANÇA

**Prevenção SQL Injection**: Usa prepared statements via `buildDateFilter`

```typescript
const { filter, params } = buildDateFilter(year, month, period, 's.');
await pool.query(`SELECT ... WHERE store_id = $1 ${filter}`, [id, ...params]);
```

---
