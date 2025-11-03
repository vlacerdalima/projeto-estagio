# DECISÕES DE ARQUITETURA

## VISÃO GERAL

Documentação das principais decisões arquiteturais tomadas durante o desenvolvimento do projeto.

---

## SQL RAW vs ORM

### Decisão: Manter SQL Raw

**Escolha**: SQL raw com `pg` ao invés de Prisma/Sequelize ORM

### Justificativa

1. **Sistema Customizado**: Projeto já possui `buildDateFilter` e queries com fallbacks
2. **Prazo Limitado**: Desafio técnico de 1 semana não justificava migração
3. **Funcionamento Adequado**: Sistema atual funciona corretamente com prepared statements
4. **Risco vs Benefício**: Risco de introduzir bugs superava benefícios no contexto

### Implementação

- **Biblioteca**: `pg` (PostgreSQL client)
- **Segurança**: Prepared statements ($1, $2, etc.)
- **Função Customizada**: `buildDateFilter` para filtros de data seguros
- **Localização**: `lib/db.ts`, `lib/dateFilter.ts`

---

## CONSIDERAÇÕES FUTURAS

Para projetos de longo prazo, considerar migração para ORM devido a:
- Type safety aprimorado
- Migrações versionadas
- Schema centralizado
- Manutenibilidade em projetos maiores

---
