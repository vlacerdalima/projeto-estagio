# COMPARAÇÃO DE RESTAURANTES

## VISÃO GERAL

Feature exclusiva para desktop que permite comparar métricas entre dois restaurantes lado a lado.

---

## FUNCIONALIDADES

### Modo de Comparação
- Botão "comparar" no `CardControls` (apenas desktop)
- Layout em duas colunas (um restaurante por lado)
- Seleção independente de restaurantes

### Cards Disponíveis
1. **Vendas** (`sales`)
2. **Faturamento** (`revenue`)
3. **Produto Mais Vendido** (`produto`)
4. **Ticket Médio** (`ticketMedio`)
5. **Vendas por Turno** (`turno`)

**Limite**: Máximo 4 cards visíveis simultaneamente  
**Padrão**: Vendas + Faturamento

### Indicadores Visuais
- **▲ Verde**: Restaurante com valor maior (melhor)
- **▼ Vermelho**: Restaurante com valor menor (pior)

---

## ARQUITETURA

### Componentes
- `ComparisonView.tsx`: View principal de comparação
- `Home.tsx`: Orquestra modo de comparação
- `CardControls.tsx`: Botão de ativação

### Hooks
- `useRestaurantData`: Chamado 2x (um por restaurante)
- `useSmartphoneDetection`: Desativa feature em mobile

---

## INTEGRAÇÃO

**APIs Utilizadas** (por restaurante):
- `/api/restaurante/[id]/vendas`
- `/api/restaurante/[id]/faturamento`
- `/api/restaurante/[id]/produto-mais-vendido`
- `/api/restaurante/[id]/vendas-por-turno`
- `/api/restaurante/[id]/ticket-medio`

**Total**: 10 chamadas API quando ambos restaurantes estão selecionados

---
