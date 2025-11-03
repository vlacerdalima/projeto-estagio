# GERENCIAMENTO DE CARDS

## VISÃO GERAL

Sistema de dashboard interativo com 12 cards de métricas que podem ser gerenciados pelo usuário. Cards podem ser removidos ou adicionados dinamicamente através da interface.

---

## FUNCIONALIDADES

### Remover Cards
- Botão **X** no canto superior direito de cada card
- Card é ocultado da visualização (não deletado permanentemente)

### Adicionar Cards
- Botão **"cards"** no header abre dropdown
- Lista apenas cards não visíveis no momento
- Ao selecionar, card reaparece na tela

### Drag and Drop
- Cards podem ser arrastados livremente pela tela
- Suporta mouse e touch events (mobile)
- Limites automáticos: não ultrapassa linha divisória superior, bordas da tela ou parte inferior da janela
- Posições são preservadas ao deletar outros cards
- Correção automática de posições quando template muda

---

## CARDS DISPONÍVEIS

Total de 12 cards implementados:

1. **Vendas** - Contagem total de vendas
2. **Faturamento** - Receita total
3. **Produto Mais Vendido** - Com ranking expandível (▶/▼)
4. **Vendas por Turno** - Distribuição manhã/tarde/noite
5. **Ticket Médio** - Valor médio por pedido + variação
6. **Vendas por Canal** - Distribuição por canal (gráfico de barras)
7. **Produto Mais Removido** - Produto mais removido dos pedidos
8. **Tendência de Crescimento** - Taxa de crescimento mensal (gráfico linha)
9. **Desvio da Média Histórica** - Comparação semana atual vs média
10. **Tempo Médio de Entrega** - Tempo médio em minutos + variação
11. **Sazonalidade de Produtos** - Produtos com padrão sazonal (lift ≥ 80%)
12. **Clientes Recorrentes Inativos** - Clientes com ≥3 compras sem comprar há 30 dias

---

## ARQUITETURA TÉCNICA

### Estado de Visibilidade
```typescript
interface VisibleCards {
  sales: boolean;
  revenue: boolean;
  produto: boolean;
  turno: boolean;
  ticketMedio: boolean;
  canal: boolean;
  produtoRemovido: boolean;
  tendencia: boolean;
  desvioMedia: boolean;
  tempoMedioEntrega: boolean;
  sazonalidade: boolean;
  clientesRecorrentesSumidos: boolean;
}
```

### Gerenciamento de Estado
- Hook `useCardVisibility`: Gerencia visibilidade e templates
- Hook `useRestaurantData`: Busca dados das APIs
- Hook `useCardDrag`: Controla arrastar e soltar

### Posicionamento
- **Algoritmo Masonry**: Distribuição automática em colunas
- **Layout Responsivo**: 1 coluna (mobile), 2 (tablet), 3 (desktop)
- **Transform CSS**: Usado para arrastar cards sem afetar layout
- **Limites**: Cards não podem ultrapassar linha divisória superior
- **Correção Automática**: Cards fora dos limites são reposicionados ao mudar template

---

## TEMPLATES

Cada template define quais cards aparecem por padrão:

- **geral**: Vendas, Faturamento, Produto, Turno, Ticket Médio, Canal, Tempo Médio Entrega
- **vendas**: Vendas, Produto, Turno, Canal, Tendência, Desvio Média, Clientes Recorrentes Inativos
- **faturamento**: Faturamento, Ticket Médio
- **produtos**: Produto, Produto Removido, Tempo Médio Entrega, Sazonalidade

---

## COMPONENTES PRINCIPAIS

- `CardsGrid.tsx`: Renderização dos cards com layout grid
- `CardControls.tsx`: Botões de template e dropdown de cards
- `DraggableCard.tsx`: Componente base para cards arrastáveis
- `app/page.tsx`: Página principal que orquestra os componentes

---

## INTEGRAÇÃO COM APIs

Todos os cards buscam dados de rotas específicas em `/api/restaurante/[id]/`:

- `/vendas` - Total de vendas
- `/faturamento` - Receita total
- `/produto-mais-vendido` - Produto mais vendido
- `/produtos-ranking` - Ranking completo de produtos
- `/vendas-por-turno` - Vendas por turno do dia
- `/ticket-medio` - Ticket médio
- `/vendas-por-canal` - Vendas por canal
- `/produto-mais-removido` - Produto mais removido
- `/tendencia-vendas` - Tendência de crescimento
- `/desvio-media` - Desvio da média histórica
- `/tempo-medio-entrega` - Tempo médio de entrega
- `/sazonalidade-produtos` - Produtos sazonais
- `/clientes-recorrentes-sumidos` - Clientes inativos

---

## DETALHES TÉCNICOS

### Prevenção de Conflito Drag & Drop
A classe `delete-button` identifica o botão X e previne conflito com arraste.

### Responsividade
- Breakpoints Tailwind: `md:` (768px), `lg:` (1024px)
- Suporte touch events para mobile
- Layout adaptativo com grid CSS

### Performance
- Posições calculadas apenas uma vez (`useRef`)
- Cards deletados não afetam posições dos outros
- Dados carregados uma vez, apenas toggle visual de exibição

---
