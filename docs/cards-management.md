# GERENCIAMENTO DE CARDS - SISTEMA DE DELETAR E ADICIONAR

## VISÃO GERAL
Sistema implementado para permitir que o usuário gerencie os cards visualizados na tela. O usuário pode deletar cards indesejados e adicionar cards removidos de volta à visualização.

---

## FUNCIONALIDADES IMPLEMENTADAS

### 1. DELETAR CARDS
- Cada card possui um botão **X vermelho** no canto superior direito
- Ao clicar no **X**, o card é removido da visualização
- O card não é deletado permanentemente, apenas oculto

### 2. ADICIONAR CARDS
- Botão **"cards"** no header (canto superior direito)
- Ao clicar, abre um dropdown mostrando os cards disponíveis (que não estão sendo exibidos)
- Ao clicar em um card no dropdown, ele volta a aparecer na tela

### 3. BOTÃO X EM CADA CARD
- Posicionado no canto superior direito de cada card
- Estilo: Vermelho (text-red-500), tamanho 6x6
- Efeito hover: fundo vermelho claro e texto mais escuro

---

## ARQUITETURA DO CÓDIGO

### ESTADOS DE VISIBILIDADE
```typescript
const [visibleCards, setVisibleCards] = useState({
  sales: true,      // Card de Vendas
  revenue: true,    // Card de Faturamento
  produto: true,    // Card de Produto Mais Vendido
  turno: true       // Card de Vendas por Turno
});
```

**Como funciona:**
- Cada propriedade (`sales`, `revenue`, `produto`, `turno`) controla a visibilidade de um card
- `true` = card visível na tela
- `false` = card oculto (pode ser adicionado via dropdown)

### ESTADO DO DROPDOWN
```typescript
const [showCardsDropdown, setShowCardsDropdown] = useState(false);
```
Controla se o dropdown de cards disponíveis está aberto ou fechado.

---

## FUNÇÕES PRINCIPAIS

### removeCard()
```typescript
const removeCard = (cardType: 'sales' | 'revenue' | 'produto' | 'turno') => {
  setVisibleCards(prev => ({ ...prev, [cardType]: false }));
};
```

**Propósito:** Remove um card da visualização.

**Parâmetros:**
- `cardType`: Tipo do card a ser removido

**Comportamento:**
- Define a propriedade do card específico como `false`
- O card desaparece da tela instantaneamente
- O card fica disponível no dropdown para ser adicionado novamente

### addCard()
```typescript
const addCard = (cardType: 'sales' | 'revenue' | 'produto' | 'turno') => {
  setVisibleCards(prev => ({ ...prev, [cardType]: true }));
  setShowCardsDropdown(false);
};
```

**Propósito:** Adiciona um card de volta à visualização.

**Parâmetros:**
- `cardType`: Tipo do card a ser adicionado

**Comportamento:**
- Define a propriedade do card específico como `true`
- O card aparece na tela
- Fecha o dropdown automaticamente

---

## DETALHES DE IMPLEMENTAÇÃO

### BOTÃO DE DELETAR (X)
```tsx
<button
  onClick={() => removeCard('sales')}
  className="delete-button absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
>
  ✕
</button>
```

**Características:**
- `absolute top-2 right-2`: Posicionamento no canto superior direito
- `delete-button`: Classe identificadora para evitar conflito com drag & drop
- Efeitos hover suaves para melhor UX

### PREVENÇÃO DE CONFLITO COM DRAG & DROP
```typescript
const handleMouseDown = (type, e: React.MouseEvent) => {
  // Verificar se o clique foi no botão de deletar
  const target = e.target as HTMLElement;
  if (target.classList.contains('delete-button')) {
    e.stopPropagation();
    removeCard(type);
    return;
  }
  
  // ... resto da lógica de drag & drop
};
```

**Problema resolvido:**
- Sem essa verificação, clicar no X também inicia o arraste do card
- A classe `delete-button` identifica o botão X
- `e.stopPropagation()` impede que o evento de arraste seja ativado

### DROPDOWN DE CARDS DISPONÍVEIS
```tsx
{!visibleCards.sales && (
  <button onClick={() => addCard('sales')}>
    Vendas
  </button>
)}
```

**Lógica:**
- Só mostra os cards que **NÃO** estão visíveis
- `!visibleCards.sales` = se sales não está visível, mostra o botão
- Ao clicar, o card é adicionado de volta

### MENSAGEM "TODOS VISÍVEIS"
```tsx
{(visibleCards.sales && visibleCards.revenue && visibleCards.produto && visibleCards.turno) && (
  <div>Todos os cards estão visíveis</div>
)}
```

**Quando aparece:**
- Todos os 4 cards estão sendo exibidos
- Não há cards disponíveis para adicionar
- Mostra mensagem informativa ao usuário

---

## INTERAÇÃO DO USUÁRIO

### FLUXO DE DELETAR
1. Usuário vê um card na tela
2. Clica no **X** vermelho (canto superior direito)
3. Card desaparece imediatamente
4. Card fica disponível no botão "cards"

### FLUXO DE ADICIONAR
1. Usuário clica no botão **"cards"**
2. Dropdown abre mostrando cards disponíveis
3. Usuário clica em um card
4. Card aparece na tela
5. Dropdown fecha automaticamente

---

## ESTADO INICIAL

Todos os 4 cards começam **visíveis** por padrão:
```typescript
const [visibleCards, setVisibleCards] = useState({
  sales: true,
  revenue: true,
  produto: true,
  turno: true
});
```

---

## RESET DE POSIÇÃO

Quando um card é removido e depois adicionado novamente:
- A posição X/Y volta para 0 (posição original no grid)
- Reset acontece em `handleSelect()` quando um novo restaurante é selecionado

---

## INTEGRAÇÃO COM DADOS

Os cards dependem dos dados do restaurante:
- Se não houver restaurante selecionado, nenhum card é exibido
- Mesmo ocultando cards visuais, os dados continuam sendo buscados das APIs
- Ao adicionar um card de volta, os dados já estão disponíveis (não precisa buscar novamente)

---

## ESTRUTURA DO HTML

### Header (controls)
```
restaurante [dropdown]  [cards button]  período [anual | mensal]
```

### Grid de Cards
```
[Card 1: Vendas]     [Card 2: Faturamento]     [Card 3: Produto]
[Card 4: Turno]      [Vazio]                    [Vazio]
```

### Botão X em cada Card
```
┌────────────────────────────┐
│                         ✕  │  ← Botão X (top-right)
│   Conteúdo do Card         │
│                            │
└────────────────────────────┘
```

---

## CASOS DE USO

### CASO 1: Usuário remove apenas 1 card
- Dropdown mostra 1 opção
- Total de 3 cards visíveis + 1 disponível

### CASO 2: Usuário remove todos os cards
- Dropdown mostra 4 opções
- Botão "cards" fica com todas as opções
- Mensagem desaparece pois há cards disponíveis

### CASO 3: Usuário remove e re-adiciona um card
- Card volta para a posição original no grid
- Mantém os dados já carregados
- Não precisa buscar dados novamente das APIs

---

## VANTAGENS DA IMPLEMENTAÇÃO

✅ **Não deleta dados**: Card apenas oculto, dados preservados
✅ **Interface limpa**: Remove clutter visual conforme necessidade
✅ **Flexibilidade**: Usuário escolhe quais métricas ver
✅ **Sem rebuild**: Dados já carregados, apenas toggle visual
✅ **Performance**: Renderiza apenas cards necessários
✅ **UX intuitiva**: X vermelho universalmente reconhecido
✅ **Feedback visual**: Dropdown mostra exatamente o que está disponível

---

## TECNOLOGIAS UTILIZADAS

- **React Hooks**: `useState` para gerenciar estado
- **TypeScript**: Type-safe para propriedades dos cards
- **Tailwind CSS**: Estilização dos botões e cards
- **Event Handling**: Prevenção de propagação no botão X
- **Conditional Rendering**: Renderiza cards baseado em estado

---

## FUNCIONALIDADES RECÉM-IMPLEMENTADAS

### 1. LINHA DIVISÓRIA
- Linha preta fina separando área de controle (restaurante, período, cards) da área de cards
- Estende de ponta a ponta da tela (`w-screen`)
- Cards não podem ultrapassar esta linha (limite superior)

### 2. RANKING DE PRODUTOS
- Card de "Produto Mais Vendido" possui seta ▶/▼
- Ao clicar, expande mostrando ranking completo
- Exibe todos os produtos ordenados por quantidade vendida
- Atualiza automaticamente quando muda período (mensal/anual)
- Posicionamento absoluto para não afetar layout dos outros cards
- Estado de loading durante carregamento dos dados

**API:** `/api/restaurante/[id]/produtos-ranking`

### 3. LIMITES DE ARRASTO
Os cards têm limites em todas as direções:
- **Superior:** Não pode ultrapassar linha divisória
- **Inferior:** Não pode sair pela parte inferior da janela
- **Esquerda/Direita:** Não pode sair pelas bordas laterais da tela

### 4. SISTEMA DE LIMITADORES
```typescript
// Limite vertical (topo e fundo)
const cardTopAfterTranslate = cardRect.top + (newY - currentPosition.y);
if (cardTopAfterTranslate < lineY) {
  constrainedY = currentPosition.y - (cardRect.top - lineY);
}

const cardBottomAfterTranslate = cardRect.bottom + (newY - currentPosition.y);
if (cardBottomAfterTranslate > windowHeight) {
  constrainedY = currentPosition.y + (windowHeight - cardRect.bottom);
}

// Limite horizontal (esquerda e direita)
if (newCardLeft < 0) {
  constrainedX = currentPosition.x - cardLeft;
} else if (newCardRight > windowWidth) {
  constrainedX = currentPosition.x + (windowWidth - (cardLeft + cardWidth));
}
```

### 5. GRID COM ALINHAMENTO
- Grid usa `items-start` e `content-start` para alinhamento consistente
- Cards usam `self-start` individualmente
- Cards não se expandem juntos quando um tem conteúdo extra

### 6. CORREÇÕES DE VISUAL
- Centralização dos dados no card de vendas por turno
- Cores mais escuras e visíveis no ranking de produtos
- Título "Ranking Completo" em negrito e maiúsculo

---
## FUTURAS MELHORIAS

Possíveis extensões do sistema:

1. **Persistência**: Salvar preferências de cards via localStorage
2. **Mais cards**: Adicionar novos tipos de métricas
3. **Drag & Drop entre seções**: Reordenar cards
4. **Filtros avançados**: Mostrar apenas cards específicos por período
5. **Templates**: Salvar layouts customizados
6. **Redução da complexidade dos cards**: Filtrar por tipo de prato ou mostrar o top 10 ou 100 , invés de todos.
7. **Histórico de posições**: Salvar posições dos cards depois de arrastar

---


