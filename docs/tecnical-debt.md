# Dívida Técnica - Posicionamento dos Cards

## Data: 29/10

## Problema Identificado

Existe um bug conhecido onde os cards arrastáveis movem-se de volta para o canto superior direito da tela (ou para suas posições iniciais no grid) quando o usuário troca entre os períodos "mensal" e "anual".

### Descrição do Comportamento

1. Usuário arrasta um ou mais cards para posições customizadas
2. Usuário altera o período (de "mensal" para "anual" ou vice-versa)
3. Os dados são atualizados corretamente
4. **BUG**: Os cards que foram arrastados retornam para suas posições originais no grid, ignorando as posições customizadas do usuário

### Impacto no Usuário

- Experiência frustrante: usuário perde o layout personalizado que configurou
- Necessidade de reposicionar os cards toda vez que mudar o período
- Perda de produtividade e piora na experiência do usuário

## Análise Técnica

### Causa Raiz

O problema ocorre devido à interação entre:

1. **React Re-rendering**: Quando o período muda, os dados são atualizados, causando um re-render completo do componente
2. **CSS Grid Reflow**: O CSS Grid recalcula as posições dos elementos durante o re-render
3. **Transform CSS**: As posições dos cards são mantidas apenas via `transform: translate()`, que é relativo ao fluxo do documento. Quando o grid reorganiza, as posições relativas são recalculadas incorretamente

### Tentativas de Correção Realizadas

Várias abordagens foram testadas e descartadas:

1. **useLayoutEffect para reaplicar transforms**: Tentativa de reaplicar os estilos após cada render, mas não resolveu completamente
2. **Posicionamento absoluto**: Tentativa de mudar cards arrastados para `position: absolute`, mas apresentou problemas de cálculo de coordenadas relativas ao grid
3. **Múltiplas reaplicações**: Tentativa de reaplicar estilos em múltiplos frames usando `requestAnimationFrame`, mas ainda resultava em movimentos indesejados

## Decisão: Prorrogação da Correção

### Motivo da Prorrogação

**Escolha consciente de prorrogar a correção deste bug** pelos seguintes motivos:

1. **Complexidade Técnica**: A correção requer uma refatoração significativa do sistema de drag-and-drop e posicionamento
2. **Prioridades do Projeto**: Existem funcionalidades mais críticas que requerem atenção imediata
3. **Workaround Aceitável**: O bug não impede o uso básico da aplicação - é uma questão de experiência do usuário, não de funcionalidade crítica
4. **Escopo da Refatoração**: Uma solução adequada provavelmente exigiria:
   - Redesenho do sistema de posicionamento dos cards
   - Implementação de persistência de posições (localStorage ou backend)
   - Refatoração do sistema de grid para usar uma abordagem diferente (ex: absolute positioning desde o início)
   - Testes extensivos em diferentes tamanhos de tela e dispositivos

### Justificativa Técnica

- O sistema atual funciona corretamente para o caso de uso primário (arrastar e soltar cards)
- O bug só ocorre em uma situação específica (mudança de período)
- O esforço necessário para corrigir adequadamente seria desproporcional ao impacto atual do bug
- A aplicação permanece funcional e utilizável

## Possíveis Consequências da Prorrogação

### Consequências de Curto Prazo (Aceitáveis)

1. **Reclamações de Usuários**: Usuários podem reportar frustração ao perder o layout customizado
2. **Suporte Técnico**: Possível aumento em questões relacionadas a suporte
3. **Taxa de Adoção**: Alguns usuários podem evitar usar a funcionalidade de arrastar cards

### Consequências de Longo Prazo (Potenciais Riscos)

1. **Acúmulo de Dívida**: O problema pode se tornar mais difícil de resolver com o tempo, conforme o código cresce e mais funcionalidades são adicionadas
2. **Refatoração Mais Complexa**: Mudanças futuras no layout ou componentes podem tornar a correção ainda mais complexa
3. **Migração de Estado**: Se futuramente implementarmos estado global ou gerenciamento de layout mais sofisticado, será necessário lidar com este bug durante a migração
4. **Expectativas do Usuário**: Se a aplicação crescer e tiver mais usuários, este bug pode se tornar um ponto de dor mais significativo

### Mitigações Consideradas

Embora tenhamos escolhido prorrogar, as seguintes mitigações podem ser implementadas futuramente sem uma refatoração completa:

1. **Notificação ao Usuário**: Mostrar um aviso quando o período mudar, informando que as posições dos cards serão resetadas
2. **Salvamento Temporário**: Implementar um sistema simples de salvamento de posições no localStorage que persista entre mudanças de período (mas não entre sessões)
3. **Botão "Restaurar Layout"**: Permitir que o usuário salve e restaure layouts customizados manualmente

## Plano Futuro

### Quando Revisitar

Esta dívida técnica deve ser revisada quando:

1. **Novas Funcionalidades de Layout**: Se futuramente implementarmos funcionalidades que envolvam persistência ou gerenciamento de layout
2. **Refatoração do Sistema de Grid**: Se decidirmos refatorar o sistema de posicionamento por outros motivos
3. **Feedback Crítico**: Se o bug se tornar uma fonte significativa de feedback negativo dos usuários
4. **Mudança de Prioridades**: Se as prioridades do projeto mudarem e este item subir na lista

### Abordagem Recomendada para Correção Futura

Quando a correção for priorizada, recomenda-se:

1. **Análise Completa**: Revisar todas as tentativas anteriores e entender completamente o problema
2. **Design da Solução**: Criar um design técnico detalhado antes de implementar
3. **Proof of Concept**: Implementar um POC em uma branch separada para validar a abordagem
4. **Testes Abrangentes**: Criar testes para diferentes cenários (mudança de período, resize de tela, múltiplos cards, etc.)
5. **Incremental**: Considerar uma implementação incremental que permita reverter se necessário

### Estimativa (Quando Priorizado)

- **Análise e Design**: 2-4 horas
- **Implementação**: 4-8 horas
- **Testes e Ajustes**: 2-4 horas
- **Total**: 8-16 horas de desenvolvimento

## Status Atual

- ✅ **Bug Identificado e Documentado**
- ✅ **Decisão de Prorrogação Registrada**
- ⏸️ **Correção Prorrogada Indefinidamente**
- 📝 **Revisão Pendente** (a ser revisado conforme triggers listados acima)

---

## Dívida Técnica - Tela de Comparação


## Problema Identificado

A tela de comparação de restaurantes apresenta vários pontos que precisam ser otimizados e melhorados na interface.

### Descrição dos Problemas

1. **Otimização de Performance**: A tela de comparação pode ter performance subótima quando múltiplos restaurantes são comparados simultaneamente
2. **Interface do Usuário**: Há melhorias potenciais na organização visual e na experiência do usuário:
   - Layout dos dropdowns de seleção de restaurantes
   - Posicionamento e visibilidade dos filtros de período
   - Organização dos cards de comparação lado a lado
   - Espaçamento e alinhamento visual
3. **Funcionalidades Incompletas**: Algumas features podem não estar totalmente implementadas ou podem ter comportamento inesperado

### Impacto no Usuário

- Experiência do usuário pode ser melhorada
- Possível lentidão ao carregar comparações entre múltiplos restaurantes
- Interface pode ser mais intuitiva e visualmente organizada

## Análise Técnica

### Áreas Identificadas para Melhoria

1. **Performance**:
   - Verificar se há queries duplicadas ou otimizações necessárias nas chamadas de API
   - Avaliar se o carregamento de dados para comparação pode ser mais eficiente
   - Considerar implementação de cache ou otimização de re-renders

2. **UI/UX**:
   - Revisar layout e espaçamento dos elementos
   - Melhorar visibilidade e posicionamento dos controles de filtro
   - Otimizar a apresentação dos cards lado a lado para melhor leitura
   - Considerar feedback visual durante carregamento

3. **Funcionalidade**:
   - Garantir que todos os filtros de período funcionam corretamente
   - Validar que comparações são calculadas corretamente
   - Verificar edge cases (ex: sem dados, diferentes períodos)

## Decisão: Prorrogação da Otimização

### Motivo da Prorrogação

**Escolha consciente de prorrogar a otimização desta tela** pelos seguintes motivos:

1. **Funcionalidade Básica Funciona**: A tela de comparação atende às necessidades primárias do usuário
2. **Prioridades do Projeto**: Outras funcionalidades são mais críticas no momento
3. **Escopo de Melhoria**: As melhorias são principalmente incrementais (otimizações e refinamentos de UI)
4. **Tempo Estimado**: A otimização completa exigiria:
   - Análise detalhada de performance
   - Pesquisa de padrões de UI para comparações
   - Implementação de melhorias incrementais
   - Testes extensivos

### Justificativa Técnica

- A funcionalidade de comparação está operacional
- As melhorias são de natureza polida e incremental, não críticas
- O esforço pode ser melhor investido em funcionalidades mais críticas
- A tela pode ser melhorada em iterações futuras conforme feedback dos usuários

## Possíveis Consequências da Prorrogação

### Consequências de Curto Prazo (Aceitáveis)

1. **Experiência do Usuário Sub-ótima**: Interface pode não ser tão intuitiva quanto poderia
2. **Performance Adequada**: Pode haver lentidão menor em cenários específicos
3. **Feedback de Usuários**: Possível feedback sobre melhorias de interface

### Consequências de Longo Prazo (Potenciais Riscos)

1. **Acúmulo de Dívida**: Melhorias podem se tornar mais complexas com o tempo
2. **Expectativas dos Usuários**: Conforme o sistema cresce, usuários podem esperar uma experiência mais polida
3. **Refatoração Futura**: Mudanças futuras podem tornar a otimização mais complexa

### Mitigações Consideradas

1. **Feedback dos Usuários**: Coletar feedback específico sobre pain points na tela de comparação
2. **Melhorias Incrementais**: Implementar pequenas melhorias conforme oportunidade
3. **Monitoramento de Performance**: Acompanhar métricas de performance na tela

## Plano Futuro

### Quando Revisitar

Esta dívida técnica deve ser revisada quando:

1. **Feedback dos Usuários**: Se houver feedback significativo sobre problemas na tela de comparação
2. **Prioridade de Produto**: Se a funcionalidade de comparação se tornar mais central ao produto
3. **Novas Features**: Se novas funcionalidades forem adicionadas à tela de comparação
4. **Refatoração Geral**: Se houver uma refatoração geral do sistema de comparação

### Abordagem Recomendada para Otimização Futura

Quando a otimização for priorizada, recomenda-se:

1. **Análise de Performance**: Realizar profiling da tela para identificar gargalos específicos
2. **Pesquisa de UI**: Estudar padrões de UI para comparações em dashboards
3. **Implementação Incremental**: Implementar melhorias uma de cada vez para validar impacto
4. **Testes de Usuário**: Considerar testes com usuários reais para priorizar melhorias
5. **Métricas**: Definir métricas de sucesso (performance, satisfação do usuário)

## Status Atual

- ✅ **Problemas Identificados e Documentados**
- ✅ **Decisão de Prorrogação Registrada**
- ⏸️ **Otimização Prorrogada Indefinidamente**
- 📝 **Revisão Pendente** (a ser revisado conforme triggers listados acima)

---

## Dívida Técnica - Spawn dos Cards na Tela de Vendas

### Problema Identificado

Na tela de "vendas", os cards podem apresentar um posicionamento subótimo quando o card "Tendência de Crescimento" expande após carregar o gráfico, empurrando outros cards (como "Produto Mais Vendido") de forma incorreta.

### Decisão: Prorrogação da Correção

**Decisão consciente de prorrogar a correção** pelos seguintes motivos:

1. **Não é Urgente**: O problema não quebra nenhuma funcionalidade, é apenas um detalhe estético
2. **Impacto Limitado**: A funcionalidade continua operacional e utilizável
3. **Prioridades do Projeto**: Existem outras tarefas mais críticas no momento

### Status Atual

- ✅ **Problema Identificado**
- ✅ **Decisão de Prorrogação Registrada**
- ⏸️ **Correção Prorrogada Indefinidamente**

---

