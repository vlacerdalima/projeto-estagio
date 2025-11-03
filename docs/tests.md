# TESTES

## VISÃO GERAL

Testes automatizados organizados em **Tiers** de prioridade, focando nas funcionalidades críticas. Framework: Jest com React Testing Library.

---

## ESTRUTURA

```
__tests__/
├── utils/
│   ├── dateFilter.test.ts       # Filtros de data SQL (12 testes)
│   └── cardHelpers.test.ts       # Helpers de cards/drag (8 testes)
├── hooks/
│   └── useCardVisibility.test.tsx  # Hook de visibilidade (10 testes)
└── api/
    ├── vendas.route.test.ts      # API de vendas (4 testes)
    └── faturamento.route.test.ts # API de faturamento (5 testes)
```

---

## COBERTURA

### Tier 1: Essenciais (Implementado)
- **Funções Utilitárias**: `buildDateFilter`, `cardHelpers` - 20 testes
- **Hooks Customizados**: `useCardVisibility` - 10 testes
- **API Routes**: `/vendas`, `/faturamento` - 9 testes

### Tier 2: Componentes e UI (Implementado)
- **Componentes**: `DraggableCard`, `RestaurantSearch` - 19 testes
- **Formatação**: Lógica de formatação dos cards - 18 testes

**Total**: 84 testes passando em 8 arquivos

---

## EXECUÇÃO

```bash
npm test                 # Executar todos os testes
npm run test:watch      # Modo watch (desenvolvimento)
npm test -- --coverage  # Com cobertura
```

---

## CONFIGURAÇÃO

**Framework**: Jest com Next.js  
**Environment**: jsdom (testes React)  
**Setup**: `jest.setup.js` (polyfills para Next.js)  
**Mocks**: `pool.query`, `buildDateFilter`, `NextResponse`

---
