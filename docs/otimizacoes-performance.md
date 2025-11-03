# OTIMIZAÇÕES DE PERFORMANCE

## VISÃO GERAL

Índices SQL implementados para garantir que queries de 500k+ registros executem em ≤ 2 segundos.

---

## ÍNDICES IMPLEMENTADOS

### Sales (Vendas)
```sql
CREATE INDEX idx_sales_store_created ON sales(store_id, created_at);
CREATE INDEX idx_sales_store ON sales(store_id);
CREATE INDEX idx_sales_channel_id ON sales(channel_id);
```

### Payments (Pagamentos)
```sql
CREATE INDEX idx_payments_sale_id ON payments(sale_id);
CREATE INDEX idx_payments_sale_value ON payments(sale_id, value);
```

### Products (Produtos)
```sql
CREATE INDEX idx_products_id ON products(id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_product_sales_sale_id ON product_sales(sale_id);
CREATE INDEX idx_product_sales_product_quantity ON product_sales(product_id, quantity);
CREATE INDEX idx_product_sales_sale_product ON product_sales(sale_id, product_id) INCLUDE (quantity);
```

### Stores (Restaurantes)
```sql
CREATE INDEX idx_stores_name ON stores(name);
CREATE INDEX idx_stores_name_id ON stores(name, id);
```

### Channels (Canais)
```sql
CREATE INDEX idx_channels_id ON channels(id);
```

---

## QUERIES OTIMIZADAS

Todos os cards de métricas são otimizados:
- Vendas, Faturamento, Ticket Médio
- Produto Mais Vendido, Ranking de Produtos
- Vendas por Turno, Vendas por Canal
- Sazonalidade de Produtos

**Arquivo SQL**: `database/database-indexes.sql`

---

## IMPACTO ESPERADO

- Redução de **70-90%** no tempo de queries
- Melhoria em JOINs e agregações
- Otimização de filtros por período

---
