# Decisões de Arquitetura

## Uso de SQL Raw vs Prisma ORM

### Decisão: Manter SQL Raw ao invés de Prisma

**Data da Decisão**: Durante desenvolvimento do desafio técnico

### Contexto

Durante o desenvolvimento, foi avaliada a possibilidade de migrar o projeto para usar Prisma ORM ao invés das queries SQL raw com `pg`.

### Decisão Tomada

Optamos por **não migrar para Prisma** e manter o uso de SQL raw com prepared statements através do cliente `pg`.

### Justificativa

1. **Complexidade do Projeto**: O projeto já possui um sistema customizado de filtros de data (`buildDateFilter`) e queries complexas com fallbacks para diferentes estruturas de tabela
2. **Duração do Projeto**: Tratando-se de um desafio técnico com prazo limitado, a migração consumiria tempo valioso sem agregar valor significativo no curto prazo
3. **Funcionamento Atual**: O sistema já estava funcionando corretamente com SQL raw, utilizando prepared statements para segurança
4. **Risco vs. Benefício**: O risco de introduzir bugs durante a migração superava os benefícios de usar um ORM neste contexto específico

### Implementação Atual

- **Biblioteca**: `pg` (PostgreSQL client)
- **Segurança**: Prepared statements ($1, $2, etc.) para prevenir SQL injection
- **Abstração**: Função customizada `buildDateFilter` para construção segura de filtros de data
- **Localização**: `lib/db.ts` e `lib/dateFilter.ts`

### Considerações Futuras

Para projetos de longo prazo ou com equipes maiores, a migração para Prisma pode ser reconsiderada devido aos benefícios de:
- Type safety aprimorado
- Migrações versionadas
- Schema centralizado
- Manutenibilidade em projetos maiores

