-- ÍNDICES SQL PARA OTIMIZAÇÃO DO SISTEMA DE CARDS
-- Execute estes comandos no banco de dados para melhorar a performance das queries

-- ============================================
-- ÍNDICES PARA VENDAS (SALES)
-- ============================================

-- Índice para buscas por store_id e período (usado em todas as queries de cards)
CREATE INDEX IF NOT EXISTS idx_sales_store_created 
ON sales(store_id, created_at);

-- Índice para buscas por store_id isoladamente
CREATE INDEX IF NOT EXISTS idx_sales_store 
ON sales(store_id);

-- ============================================
-- ÍNDICES PARA PAGAMENTOS (PAYMENTS)
-- ============================================

-- Índice para JOIN com sales por sale_id
CREATE INDEX IF NOT EXISTS idx_payments_sale_id 
ON payments(sale_id);

-- Índice compost para buscas por sale_id e value (usado em faturamento e ticket médio)
CREATE INDEX IF NOT EXISTS idx_payments_sale_value 
ON payments(sale_id, value);

-- ============================================
-- ÍNDICES PARA PRODUTOS (PRODUCTS/PRODUCT_SALES)
-- ============================================

-- Índice para busca de produtos por ID
CREATE INDEX IF NOT EXISTS idx_products_id 
ON products(id);

-- Índice para nome do produto (usado no produto mais vendido e ranking)
CREATE INDEX IF NOT EXISTS idx_products_name 
ON products(name);

-- Índice para product_sales por sale_id
CREATE INDEX IF NOT EXISTS idx_product_sales_sale_id 
ON product_sales(sale_id);

-- Índice composto para product_sales (product_id e quantity)
CREATE INDEX IF NOT EXISTS idx_product_sales_product_quantity 
ON product_sales(product_id, quantity);

-- ============================================
-- ÍNDICES COMPOSTOS ADICIONAIS (OTIMIZAÇÕES ESPECÍFICAS)
-- ============================================

-- Índice para queries de vendas por turno (usa EXTRACT(HOUR FROM created_at))
CREATE INDEX IF NOT EXISTS idx_sales_store_hour 
ON sales(store_id, EXTRACT(HOUR FROM created_at));

-- Índice para buscas de vendas em um período específico
CREATE INDEX IF NOT EXISTS idx_sales_date_range 
ON sales(store_id, created_at) WHERE created_at >= NOW() - INTERVAL '60 days';

-- ============================================
-- NOTAS DE OTIMIZAÇÃO
-- ============================================

/*
BENEFÍCIOS ESPERADOS:
- Redução de 70-90% no tempo de queries com múltiplas vendas
- Melhoria na performance de JOINs entre sales, payments e products
- Otimização de agregações (SUM, COUNT, AVG)
- Aceleração de filtros por período (mensal/anual)

QUERIES OTIMIZADAS:
1. Vendas totais (sales)
2. Faturamento (revenue)
3. Produto mais vendido (product_sales + products)
4. Vendas por turno (EXTRACT HOUR)
5. Ticket médio (payments + sales)
6. Ranking de produtos (product_sales)

MONITORAMENTO:
- Verificar uso dos índices: EXPLAIN ANALYZE nas queries
- Monitorar tamanho dos índices no banco
- Considerar re-indexação periódica em tabelas grandes
*/

-- ============================================
-- QUERY PARA VERIFICAR ÍNDICES CRIADOS
-- ============================================

-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('sales', 'payments', 'products', 'product_sales')
-- ORDER BY tablename, indexname;

-- ============================================
-- COMPANDOS PARA REMOVER ÍNDICES (SE NECESSÁRIO)
-- ============================================

-- DROP INDEX IF EXISTS idx_sales_store_created;
-- DROP INDEX IF EXISTS idx_sales_store;
-- DROP INDEX IF EXISTS idx_payments_sale_id;
-- DROP INDEX IF EXISTS idx_payments_sale_value;
-- DROP INDEX IF EXISTS idx_products_id;
-- DROP INDEX IF EXISTS idx_products_name;
-- DROP INDEX IF EXISTS idx_product_sales_sale_id;
-- DROP INDEX IF EXISTS idx_product_sales_product_quantity;
-- DROP INDEX IF EXISTS idx_sales_store_hour;
-- DROP INDEX IF EXISTS idx_sales_date_range;

