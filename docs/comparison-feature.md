# Feature de Comparação de Restaurantes

## Visão Geral

A feature de comparação permite que usuários comparem métricas e dados entre dois restaurantes diferentes lado a lado, facilitando análises comparativas. Esta funcionalidade é **exclusiva para desktop** e não está disponível em dispositivos móveis.

## Funcionalidades Principais

### 1. Modo de Comparação

- **Ativação**: Botão "comparar" no `CardControls` (visível apenas em desktop)
- **Layout**: Tela dividida em duas colunas, uma para cada restaurante
- **Estado**: Controlado por `isComparisonMode` no componente `Home`

### 2. Seleção de Restaurantes

Cada lado da comparação possui:
- **Dropdown de seleção**: Botão estilizado no topo que abre um menu de seleção
- **Busca em tempo real**: Campo de input para filtrar restaurantes por nome
- **Independência**: Cada lado pode selecionar um restaurante diferente

### 3. Cards de Comparação

#### Cards Disponíveis

A comparação suporta os seguintes tipos de cards:

1. **Vendas** (`sales`)
   - Total de vendas do período selecionado (mensal/anual)
   - Comparação visual com indicadores (▲/▼)

2. **Faturamento** (`revenue`)
   - Valor total faturado no período
   - Comparação visual com indicadores (▲/▼)

3. **Produto Mais Vendido** (`produto`)
   - Nome e quantidade do produto mais vendido
   - Comparação direta entre os dois restaurantes

4. **Ticket Médio** (`ticketMedio`)
   - Valor médio dos tickets
   - Indicação de variação vs período anterior
   - Comparação visual com indicadores (▲/▼)

5. **Vendas por Turno** (`turno`)
   - Distribuição de vendas entre manhã, tarde e noite
   - Comparação individual para cada turno

#### Gerenciamento de Cards

- **Adicionar**: Através do botão "cards" no `CardControls`
  - Mostra apenas cards ainda não adicionados
  - Limite máximo de 4 cards visíveis simultaneamente
  - O dropdown é contextual baseado no modo (comparação vs normal)

- **Remover**: Botão "X" centralizado entre os dois cards
  - Alinhado verticalmente com o card correspondente
  - Altura dinâmica baseada na altura do card
  - Remove o card de ambos os lados simultaneamente

#### Estado Padrão

Por padrão, a comparação inicia com:
- **Vendas** (`sales`)
- **Faturamento** (`revenue`)

### 4. Indicadores Visuais de Comparação

Para métricas numéricas comparáveis, o sistema exibe:

- **▲ Verde**: Indica que o restaurante daquele lado está melhor (valor maior)
- **▼ Vermelho**: Indica que o restaurante daquele lado está pior (valor menor)

**Cards com indicadores**:
- Vendas
- Faturamento
- Ticket Médio
- Vendas por Turno (individual para cada turno)

**Lógica de comparação**:
- Valores maiores são considerados melhores (higherIsBetter = true)
- Quando os valores são iguais, nenhum indicador é exibido
- Indicadores só aparecem quando ambos os restaurantes têm dados válidos

### 5. Integração com Período

A comparação respeita o período selecionado (mensal/anual):
- Todas as métricas são carregadas para o mesmo período
- O período é sincronizado entre ambos os restaurantes
- Mudanças no período atualizam ambos os lados simultaneamente

## Arquitetura Técnica

### Componentes Principais

#### `ComparisonView` (`app/components/ComparisonView.tsx`)

Componente principal que renderiza a view de comparação.

**Props**:
```typescript
interface ComparisonViewProps {
  period: Period;                          // Período selecionado (mensal/anual)
  onAddComparisonCard?: (cardType: ComparisonCardType) => void;
  onRemoveComparisonCard?: (cardType: ComparisonCardType) => void;
  visibleComparisonCards?: ComparisonCardType[];
}
```

**Tipos de Cards**:
```typescript
export type ComparisonCardType = 
  | 'sales' 
  | 'revenue' 
  | 'produto' 
  | 'ticketMedio' 
  | 'turno';
```

**Estado Interno**:
- `selectedRestaurant1`: ID do restaurante esquerdo
- `selectedRestaurant2`: ID do restaurante direito
- `showDropdown1/2`: Controla visibilidade dos dropdowns
- `search1/2`: Filtros de busca para cada dropdown
- `restaurants`: Lista completa de restaurantes (carregada do API)

**Hooks Utilizados**:
- `useRestaurantData`: Carrega dados de cada restaurante (chamado 2x)
- `useEffect`: Gerencia seleção de restaurantes e click outside

#### `Home` (`app/page.tsx`)

Componente principal que orquestra o modo de comparação.

**Estado**:
```typescript
const [isComparisonMode, setIsComparisonMode] = useState(false);
const [comparisonCards, setComparisonCards] = useState<ComparisonCardType[]>(['sales', 'revenue']);
```

**Funções de Gerenciamento**:
```typescript
const addComparisonCard = (cardType: string) => {
  const maxCards = 4;
  if (comparisonCards.length < maxCards && !comparisonCards.includes(cardType as ComparisonCardType)) {
    setComparisonCards(prev => [...prev, cardType as ComparisonCardType]);
  }
};

const removeComparisonCard = (cardType: ComparisonCardType) => {
  setComparisonCards(prev => prev.filter(c => c !== cardType));
};
```

**Renderização Condicional**:
```typescript
{isComparisonMode && !isSmartphone ? (
  <ComparisonView 
    period={period}
    visibleComparisonCards={comparisonCards}
    onAddComparisonCard={addComparisonCard}
    onRemoveComparisonCard={removeComparisonCard}
  />
) : (
  <CardsGrid ... />
)}
```

#### `CardControls` (`app/components/CardControls.tsx`)

Componente que gerencia os controles, incluindo o botão de comparação.

**Comportamento no Modo Comparação**:
- Botão "comparar" fica vermelho quando ativo
- Dropdown "cards" mostra apenas cards disponíveis para comparação
- Filtra corretamente cards já adicionados

**Lógica de Filtro**:
```typescript
const availableComparisonCards = isComparisonMode && comparisonCards
  ? ['sales', 'revenue', 'produto', 'ticketMedio', 'turno']
      .filter(card => !comparisonCards.includes(card))
  : [];
```

### Fluxo de Dados

1. **Ativação do Modo**:
   ```
   Usuário clica "comparar" 
   → setIsComparisonMode(true)
   → ComparisonView é renderizado
   ```

2. **Seleção de Restaurantes**:
   ```
   Usuário seleciona restaurante 1
   → setSelectedRestaurant1(id)
   → useRestaurantData(id, period) busca dados
   → Cards são atualizados com dados do restaurante 1
   ```

3. **Adição de Cards**:
   ```
   Usuário clica "cards" → seleciona card
   → addComparisonCard(cardType)
   → comparisonCards atualizado
   → ComparisonView re-renderiza com novo card
   ```

4. **Carregamento de Dados**:
   - Cada restaurante usa uma instância independente de `useRestaurantdynamicsData`
   - 6 chamadas API por restaurante (Promise.all)
   - Total: 12 chamadas API quando ambos restaurantes estão selecionados

### Hooks Reutilizados

#### `useRestaurantData`

Hook customizado que busca todos os dados de um restaurante.

**Chamadas no Modo Comparação**:
```typescript
const data1 = useRestaurantData(selectedRestaurant1, period);
const data2 = useRestaurantData(škectedRestaurant2, period);
```

**Endpoints Utilizados** (por restaurante):
- `/api/restaurante/[id]/vendas?period={period}`
- `/api/restaurante/[id]/faturamento?period={period}`
- `/api/restaurante/[id]/produto-mais-vendido?period={period}`
- `/api/restaurante/[id]/vendas-por-turno?period={period}`
- `/api/restaurante/[id]/ticket-medio?period={period}`
- `/api/restaurante/[id]/vendas-por-canal?period={period}`

## Design e UX

### Layout

- **Estrutura**: Layout flexbox em colunas
- **Espaçamento**: Gaps consistentes entre elementos (gap-0, gap-2, gap-3)
- **Responsividade**: Não disponível em mobile (restrição por design)

### Componentes Visuais

#### Headers de Restaurantes
- Botões grandes e destacados no topo
- Styling: `px-5 py-3 text-lg font-bold border-2 border-gray-300`
- Hover: `hover:bg-gray-50 hover:shadow-md`
- Centralizados em suas respectivas colunas

#### Dropdowns de Seleção
- `Card` component com bordas e sombras destacadas
- Busca com input no topo
- Scroll interno para listas longas (`max-h-48 overflow-y-auto`)
- Filtro case-insensitive em tempo real

#### Cards de Comparação
- Tamanho reduzido (`p-3`) comparado aos cards normais (`p-4 md:p-6`)
- Fontes menores (`text-xs`, `text-sm`, `text-lg`)
- Altura dinâmica com `h-full` para alinhamento
- Padding mínimo (`min-h-[80px]`) para consistência

#### Botões de Remoção (X)
- Centralizados entre os dois cards
- Alinhamento vertical dinâmico com `items-stretch`
- Styling: `border-2 border-red-400 border-dashed`
- Hover: `hover:bg-red-50 hover:text-red-700`

### Indicadores Visuais

#### Triângulos de Comparação
- **Verde** (`text-green-600`): ▲ - Restaurante está melhor
- **Vermelho** (`text-red-600`): ▼ - Restaurante está pior
- Posicionados no canto superior direito de cada card
- Tamanho: `text-lg` para métricas principais, `text-sm` para turnos

## Limitações e Restrições

### Limitações Funcionais

1. **Apenas Desktop**: Feature não disponível em smartphones
   - Detecção via `useSmartphoneDetection`
   - `isComparisonMode && !isSmartphone` na renderização condicional

2. **Limite de Cards**: Máximo de 4 cards visíveis simultaneamente
   - Implementado em `addComparisonCard`
   - Limite manual para evitar sobrecarga visual

3. **Cards Disponíveis**: Não inclui "Vendas por Canal"
   - Apenas 5 tipos de cards disponíveis para comparação
   - Card "canal" não está implementado no modo comparação

### Limitações Técnicas

1. **Performance**:
   - 12 chamadas API simultâneas quando ambos restaurantes estão selecionados
   - Sem cache implementado (dados sempre recarregados)
   - Re-renders podem ocorrer com mudanças de estado

2. **Estado**:
   - Estado de comparação não persiste entre sessões
   - Seleção de restaurantes é perdida ao sair do modo

3. **Validação**:
   - Não há validação se o restaurante existe antes de selecionar
   - Erros de API não são tratados de forma visual específica

## Casos de Uso

### 1. Comparação Rápida de Performance
**Cenário**: Gerente quer comparar vendas entre duas unidades
- Seleciona dois restaurantes
- Observa cards de Vendas e Faturamento (padrão)
- Usa indicadores visuais para identificar rapidamente qual está melhor

### 2. Análise de Produtos
**Cenário**: Analisar produtos mais vendidos entre lojas
- Adiciona card "Produto Mais Vendido"
- Compara produtos e quantidades entre restaurantes

### 3. Análise de Turnos
**Cenário**: Entender diferenças de performance por horário
- Adiciona card "Vendas por Turno"
- Compara distribuição manhã/tarde/noite
- Identifica padrões diferentes entre restaurantes

### 4. Análise de Ticket Médio
**Cenário**: Comparar eficiência de vendas
- Adiciona card "Ticket Médio"
- Observa variações percentuais vs período anterior
- Compara valores absolutos entre restaurantes

## Possíveis Melhorias Futuras

### Funcionalidades

1. **Mais Cards**:
   - Adicionar card "Vendas por Canal" também no modo comparação
   - Criar cards comparativos específicos (ex: "Diferença Percentual")

2. **Persistência**:
   - Salvar seleção de restaurantes no localStorage
   - Manter configuração de cards entre sessões

3. **Exportação**:
   - Botão para exportar comparação como imagem/PDF
   - Compartilhar link de comparação específica

4. **Histórico**:
   - Comparar períodos diferentes (último mês vs mês atual)
这时候回顾

### Técnicas

1. **Cache**:
   - Implementar cache de dados com TTL
   - Evitar refetch desnecessário ao alternar entre modos

2. **Otimização**:
   - Lazy loading de dados
   - Debounce na busca de restaurantes
   - Memoização de componentes

3. **Tratamento de Erros**:
   - Mensagens de erro específicas
   - Fallbacks visuais quando dados não estão disponíveis
   - Loading states mais informativos

4. **Acessibilidade**:
   - Suporte a teclado (navegação entre restaurantes)
   - ARIA labels adequados
   - Contraste aprimorado

## Testes Recomendados

### Testes Funcionais

- [ ] Seleção de dois restaurantes diferentes
- [ ] Busca funciona em ambos os dropdowns
- [ ] Adicionar/remover cards corretamente
- [ ] Limite de 4 cards é respeitado
- [ ] Indicadores aparecem corretamente
- [ ] Mudança de período atualiza ambos os lados
- [ ] Modo não aparece em smartphones

### Testes de Performance

- [ ] Carregamento com 2 restaurantes < 5s
- [ ] Busca de restaurantes é instantânea (< 100ms)
- [ ] Adição/remoção de cards é responsiva
- [ ] Scroll funciona suavemente nos dropdowns

### Testes de Edge Cases

- [ ] Restaurante sem dados não quebra a UI
- [ ] Selecionar mesmo restaurante em ambos os lados
- [ ] Múltiplas mudanças rápidas de período
- [ ] Alternar entre modos múltiplas vezes

## Glossário

- **ComparisonCardType**: Tipo TypeScript que define os cards disponíveis na comparação
- **Modo Comparação**: Estado da aplicação onde dois restaurantes são comparados lado a lado
- **Indicador Visual**: Triângulo verde/vermelho que mostra qual restaurante está melhor em uma métrica
- **Restaurante Esquerdo/Direito**: Referência posicional aos restaurantes no layout (restaurant1/restaurant2 no código)

