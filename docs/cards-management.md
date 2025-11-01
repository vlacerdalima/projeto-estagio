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
  sales: true,                // Card de Vendas
  revenue: true,              // Card de Faturamento
  produto: true,              // Card de Produto Mais Vendido
  turno: true,                // Card de Vendas por Turno
  ticketMedio: true,          // Card de Ticket Médio
  canal: true,                // Card de Vendas por Canal
  produtoRemovido: false,     // Card de Produto Mais Removido
  tendencia: false,           // Card de Tendência de Crescimento
  desvioMedia: false,         // Card de Desvio da Média Histórica
  tempoMedioEntrega: false    // Card de Tempo Médio de Entrega
});
```

**Como funciona:**
- Cada propriedade controla a visibilidade de um card
- `true` = card visível na tela
- `false` = card oculto (pode ser adicionado via dropdown)
- Template "geral" inicia com 6 cards visíveis por padrão

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
{Object.values(visibleCards).every(v => v) && (
  <div>Todos os cards estão visíveis</div>
)}
```

**Quando aparece:**
- Todos os 10 cards estão sendo exibidos
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

O template "geral" começa com **6 cards visíveis** por padrão:
```typescript
const [visibleCards, setVisibleCards] = useState({
  sales: true,
  revenue: true,
  produto: true,
  turno: true,
  ticketMedio: true,
  canal: true,
  produtoRemovido: false,
  tendencia: false,
  desvioMedia: false,
  tempoMedioEntrega: false
});
```

Os templates específicos ativam diferentes combinações de cards conforme a necessidade analítica.

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
- Outros cards mantêm suas posições (não se movem)

### CASO 2: Usuário remove todos os cards
- Dropdown mostra todas as 10 opções disponíveis
- Botão "cards" fica com todas as opções
- Mensagem desaparece pois há cards disponíveis

### CASO 3: Usuário remove e re-adiciona um card
- Card aparece novamente na sua posição original
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

### 7. ESTADOS DE LOADING
- Implementado estado de loading para cards que fazem queries complexas
- Exibe "Carregando dados..." enquanto busca informações
- Cards com loading: Produto Mais Vendido (ranking), Ticket Médio

### 8. OTIMIZAÇÕES SQL
- Índices de banco de dados implementados para performance
- Arquivo: `database/database-indexes.sql`
- Redução esperada de 70-90% no tempo de queries
- Execute o arquivo SQL no banco para aplicar

### 9. NOVO CARD: TICKET MÉDIO
- Exibe o valor médio gasto por pedido no período selecionado
- Mostra variação percentual vs período anterior
- Indicadores visuais: ▲ verde (aumento) ou ▼ vermelho (queda)
- API: `/api/restaurante/[id]/ticket-medio`
- Formato monetário brasileiro (R$ X,XX)

### 10. NOVO CARD: VENDAS POR CANAL
- Exibe distribuição de vendas por canal (Presencial, Delivery, etc.)
- Gráfico de barras horizontais
- Informações: nome do canal, quantidade de pedidos, receita total, percentual
- API: `/api/restaurante/[id]/vendas-por-canal`
- Mapeia IDs de canal (channel_id) para nomes legíveis
- Suporta JOIN com tabela `channels` ou fallback para IDs

### 11. NOVO CARD: PRODUTO MAIS REMOVIDO
- Exibe o produto mais removido dos pedidos no período
- Mostra nome e quantidade total de remoções
- API: `/api/restaurante/[id]/produto-mais-removido`

### 12. NOVO CARD: TENDÊNCIA DE CRESCIMENTO
- Exibe taxa de crescimento mensal de vendas
- Gráfico de linha mostrando evolução dos últimos 12 meses
- Indicador visual: ▲ verde (crescimento) ou ▼ vermelho (queda)
- API: `/api/restaurante/[id]/tendencia-vendas`
- Sempre mostra últimos 12 meses (não depende de período)

### 13. NOVO CARD: DESVIO DA MÉDIA HISTÓRICA
- Compara semana atual com média histórica semanal
- Mostra receita atual, média histórica e percentual de desvio
- Indicador visual: ▲ verde (acima da média) ou ▼ vermelho (abaixo)
- API: `/api/restaurante/[id]/desvio-media`
- Sempre compara últimos 7 dias vs histórico

### 14. NOVO CARD: TEMPO MÉDIO DE ENTREGA
- Exibe tempo médio de entrega em minutos
- Mostra variação percentual vs período anterior
- Indicador visual: ▲ vermelho (aumento de tempo) ou ▼ verde (redução)
- API: `/api/restaurante/[id]/tempo-medio-entrega`
- Formato: "X min" seguido de variação
- Disponível no template "produtos" por padrão
- Valores mockados: 45 min (padrão) se campo `delivery_time` não existir no banco

### 15. CARDS DISPONÍVEIS
Total de 10 cards no sistema:
1. **Vendas** - Contagem total de vendas
2. **Faturamento** - Receita total
3. **Produto Mais Vendido** - Com ranking expandível
4. **Vendas por Turno** - Distribuição por manhã/tarde/noite
5. **Ticket Médio** - Valor médio por pedido
6. **Vendas por Canal** - Distribuição por canal de venda
7. **Produto Mais Removido** - Produto mais removido dos pedidos
8. **Tendência de Crescimento** - Taxa de crescimento mensal
9. **Desvio da Média Histórica** - Comparação com média semanal
10. **Tempo Médio de Entrega** - Tempo médio de entrega em minutos

### 16. AJUSTES DE VISUAL
- Texto "período" removido antes dos botões mensal/anual
- Cards de vendas por canal com texto branco para contraste em fundo escuro
- Todas as legendas e nomes de canais em cor branca
- Percentuais e quantidades de pedidos em cores mais claras

### 17. SISTEMA DE SPAWN E POSICIONAMENTO DOS CARDS

#### ARQUITETURA DE POSICIONAMENTO

O sistema de cards usa uma abordagem híbrida de **CSS Grid** + **posição absoluta** + **transform** para permitir arrastar cards sem afetar outros quando deletados.

**Componentes:**
1. **Container Grid**: Define a estrutura base de colunas (1/2/3 dependendo do tamanho da tela)
2. **Posições Base**: Calculadas via `getBoundingClientRect()` na inicialização
3. **Transform**: Usado para arrastar cards sem sair do fluxo do grid
4. **useRef**: Controla se as posições já foram calculadas (cálculo único)

**Fluxo:**
```typescript
// 1. Calcular posições iniciais (apenas uma vez)
useEffect(() => {
  if (hasCalculatedInitialStyles.current) return;
  
  // 2. Para cada card visível:
  visibleCardsInOrder.forEach((cardType) => {
    // 3. Buscar altura real do card
    const cardHeight = cardRef.getBoundingClientRect().height;
    
    // 4. Encontrar coluna com menor altura (algoritmo de masonry)
    let minHeight = columnHeights[0];
    let targetColumn = 0;
    for (let i = 1; i < numColumns; i++) {
      if (columnHeights[i] < minHeight) {
        minHeight = columnHeights[i];
        targetColumn = i;
      }
    }
    
    // 5. Atribuir posição (left, top, width)
    styles[cardType] = {
      left: `${targetColumn * (columnWidth + gap)}px`,
      top: `${columnHeights[targetColumn]}px`,
      width: `${columnWidth}px`
    };
    
    // 6. Atualizar altura acumulada da coluna
    columnHeights[targetColumn] += cardHeight + verticalGap;
  });
  
  setCardStyles(styles);
  hasCalculatedInitialStyles.current = true;
}, [visibleCards, currentTemplate]);
```

#### ALGORITMO DE MASONRY

Os cards são posicionados usando o algoritmo de masonry (Pinterest-style):
- **Primeira posição**: Topo da coluna (top = 0)
- **Próximas posições**: Base da coluna com menor altura acumulada
- **Gap vertical**: 8px entre cards na mesma coluna
- **Gap horizontal**: 16px entre colunas

**Vantagens:**
- Distribuição uniforme entre colunas
- Sem espaços grandes inutilizados
- Colunas independentes (uma não afeta a outra)

#### ISOLAMENTO DE DELETAR CARDS

**Problema:** Quando um card é deletado, outros se moviam porque o grid era recalculado.

**Solução:** Uso de `useRef` para garantir que posições são calculadas apenas uma vez:
```typescript
const hasCalculatedInitialStyles = useRef(false);

useEffect(() => {
  if (hasCalculatedInitialStyles.current) return; // ← Retorna se já calculou
  hasCalculatedInitialStyles.current = true;
  // ... calcular posições ...
}, [visibleCards, currentTemplate]);
```

**Resultado:** 
- Cards mantêm suas posições originais quando outro é deletado
- Apenas o card deletado desaparece da tela
- Não há reorganização indesejada do layout

#### TEMPLATES E ORDEM DE CARDS

Cada template (geral, vendas, faturamento, produtos) define quais cards aparecem por padrão:

**Template "geral":**
- Vendas, Faturamento, Produto Mais Vendido, Vendas por Turno, Ticket Médio, Vendas por Canal

**Template "vendas":**
- Vendas, Produto Mais Vendido, Vendas por Turno, Vendas por Canal, Tendência de Crescimento, Desvio da Média Histórica

**Template "faturamento":**
- Faturamento, Ticket Médio

**Template "produtos":**
- Produto Mais Vendido, Produto Mais Removido, **Tempo Médio de Entrega**

**Ordem de renderização:**
A ordem dos cards segue a definição em `allCardsOrder`:
```typescript
const allCardsOrder = [
  'sales', 'revenue', 'ticketMedio', 'turno', 
  'tendencia', 'canal', 'produto', 'produtoRemovido', 
  'desvioMedia', 'tempoMedioEntrega'
];
```

Esta ordem determina:
1. **Prioridade de spawn**: Primeiros cards na lista vão primeiro
2. **Coluna inicial**: `índice % numColumns` define a coluna
3. **Posição na ordem de empilhamento**: Usado no algoritmo de masonry

#### POSICIONAMENTO COM TRANSFORM

**Estilo aplicado:**
```typescript
// Base: posição calculada pelo algoritmo
style={{ left: '0px', top: '0px', width: '320px' }}

// Transform: deslocamento do usuário
style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
```

**Vantagem:** O transform não afeta o cálculo de altura dos outros cards, mantendo o layout estável durante o drag.

#### RESUMO DE RECURSOS

✅ **Posições preservadas** ao deletar cards
✅ **Drag and drop** funcional sem afetar layout  
✅ **Masonry layout** automático (distribuição inteligente)
✅ **3 colunas** no desktop, 2 no tablet, 1 no mobile
✅ **Colunas independentes** com altura própria
✅ **Gap consistente** entre cards

### 18. RESPONSIVIDADE MOBILE (MOBILE-FRIENDLY)
A aplicação é totalmente responsiva e funciona corretamente em dispositivos móveis.

#### LAYOUT RESPONSIVO

**Breakpoints Tailwind:**
- **Mobile (< 768px)**: Layout em 1 coluna, padding reduzido
- **Tablet (768px - 1024px)**: Layout em 2 colunas
- **Desktop (≥ 1024px)**: Layout em 3 colunas completo

**Grid Adaptativo:**
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
```
- Mobile: 1 coluna (todos os cards empilhados verticalmente)
- Tablet: 2 colunas (melhor distribuição)
- Desktop: 3 colunas (layout completo)

**Padding Responsivo:**
- Mobile: `px-4` (16px de cada lado)
- Desktop: `md:px-20` (80px de cada lado)

**Menu Superior:**
- Mobile: Layout vertical (`flex-col`)
- Desktop: Layout horizontal (`md:flex-row`)

**Tamanhos de Texto:**
- Mobile: `text-xl` para valores grandes
- Desktop: `md:text-3xl` para melhor legibilidade em telas grandes

**Padding dos Cards:**
- Mobile: `p-4` (espaçamento interno menor)
- Desktop: `md:p-6` (espaçamento interno maior)

#### SUPORTE A TOUCH EVENTS (DRAG AND DROP)

O sistema de arrastar e soltar funciona tanto com **mouse** quanto com **toque** em dispositivos móveis.

**Implementação Dual (Mouse + Touch):**
```typescript
// Função reutilizável para ambos
const startDrag = (type, clientX, clientY) => {
  // Lógica comum de arraste
};

// Handler para mouse
const handleMouseDown = (type, e: React.MouseEvent) => {
  startDrag(type, e.clientX, e.clientY);
};

// Handler para touch
const handleTouchStart = (type, e: React.TouchEvent) => {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    startDrag(type, touch.clientX, touch.clientY);
  }
};
```

**Eventos Touch Implementados:**
- `onTouchStart`: Inicia o arraste ao tocar no card
- `onTouchMove`: Atualiza a posição enquanto arrasta
- `onTouchEnd`: Finaliza o arraste ao soltar

**Classe CSS Especial:**
- `touch-none`: Previne scroll acidental durante o arraste
- Adicionada em todos os cards arrastáveis

**Proteção contra Scroll:**
```typescript
const handleTouchMove = (e: TouchEvent) => {
  e.preventDefault(); // Previne scroll da página
  // ... lógica de movimento
};
```

#### DROPDOWNS RESPONSIVOS

**Dropdown de Restaurantes:**
- Largura adaptável: `max-w-[calc(100vw-2rem)]`
- Não ultrapassa os limites da tela mobile
- Alinhamento ajustado para mobile (`left-0` em mobile, `left-auto` em desktop)

**Dropdown de Cards:**
- Mesma largura em mobile e desktop (48 - `w-48`)
- Posicionamento inteligente para não sair da tela

#### ORDEM DOS CARDS EM MOBILE

Em dispositivos móveis, os cards aparecem em ordem vertical seguindo `allCardsOrder`:
1. **Vendas** (topo)
2. **Faturamento**
3. **Ticket Médio**
4. **Vendas por Turno**
5. **Tendência de Crescimento**
6. **Vendas por Canal**
7. **Produto Mais Vendido**
8. **Produto Mais Removido**
9. **Desvio da Média Histórica**
10. **Tempo Médio de Entrega** (fim)

**Nota:** Como o grid é de 1 coluna em mobile, a ordem vertical corresponde à ordem em `allCardsOrder`.

#### FOOTER RESPONSIVO

- Mobile: `bottom-2 right-3` (posicionamento mais próximo das bordas)
- Desktop: `md:bottom-4 md:right-6` (posicionamento original)

#### COMO TESTAR MOBILE

1. **Navegador Desktop:**
   - Abra DevTools (F12)
   - Ative modo responsivo (Ctrl+Shift+M)
   - Selecione um dispositivo ou dimensões customizadas
   - Teste arrastar cards com mouse (simula toque)

2. **Dispositivo Real:**
   - Certifique-se que o servidor está escutando em `0.0.0.0` (ver `package.json`)
   - Acesse pelo IP local da máquina (ex: `http://192.168.1.100:3000`)
   - Teste arrastar cards com o dedo

3. **Funcionalidades a Testar:**
   - ✅ Drag and drop funciona com toque
   - ✅ Layout se adapta corretamente
   - ✅ Dropdowns não saem da tela
   - ✅ Menu superior se reorganiza
   - ✅ Textos são legíveis
   - ✅ Botões são clicáveis (área de toque adequada)

#### COMPATIBILIDADE

**Funciona em:**
- ✅ Smartphones (iOS e Android)
- ✅ Tablets
- ✅ Navegadores mobile (Chrome, Safari, Firefox)
- ✅ Telas touch

**Funcionalidades Mantidas:**
- ✅ Drag and drop (via touch)
- ✅ Deletar cards (toque no X)
- ✅ Adicionar cards (toque no dropdown)
- ✅ Selecionar restaurante
- ✅ Mudar período (mensal/anual)
- ✅ Visualizar todos os dados

#### LIMITAÇÕES CONHECIDAS

Nenhuma limitação conhecida. A aplicação foi totalmente adaptada para mobile e todas as funcionalidades estão disponíveis.

#### TROUBLESHOOTING MOBILE

**Problema:** Cards não arrastam no mobile
- **Solução:** Verifique se a classe `touch-none` está presente no card
- **Solução:** Verifique se os eventos `onTouchStart`, `onTouchMove`, `onTouchEnd` estão configurados

**Problema:** Layout quebrado em mobile
- **Solução:** Verifique se as classes responsivas Tailwind estão corretas (`md:`, `lg:`)
- **Solução:** Limpe o cache do navegador

**Problema:** Dropdown sai da tela
- **Solução:** Verifique se `max-w-[calc(100vw-2rem)]` está configurado
- **Solução:** Ajuste o `left-0` ou `left-auto` conforme necessário

**Problema:** Texto muito pequeno/grande
- **Solução:** Verifique os breakpoints de texto (`text-xl md:text-3xl`)
- **Solução:** Ajuste conforme necessário nos componentes

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


