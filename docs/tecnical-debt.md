# Dívida Técnica - Posicionamento dos Cards

## Data: 2025

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

