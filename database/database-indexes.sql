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
-- ÍNDICES PARA RESTAURANTES (STORES)
-- ============================================

-- Índice para ORDER BY name na busca inicial de restaurantes (CRÍTICO - primeira query do app)
CREATE INDEX IF NOT EXISTS idx_stores_name 
ON stores(name);

-- Índice otimizado para SELECT com ORDER BY (cobre id e name)
CREATE INDEX IF NOT EXISTS idx_stores_name_id 
ON stores(name, id);

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

-- NOTA: Índices com EXTRACT(HOUR) e NOW() foram removidos pois usam funções não-imutáveis
-- O índice idx_sales_store_created já otimiza essas queries suficientemente

-- Índice para JOIN com channels por channel_id (usado em vendas por canal)
CREATE INDEX IF NOT EXISTS idx_sales_channel_id 
ON sales(channel_id);

-- ============================================
-- ÍNDICES PARA CANAIS (CHANNELS)
-- ============================================

-- Índice para JOIN com sales por ID (geralmente já existe como PK, mas garantimos aqui)
CREATE INDEX IF NOT EXISTS idx_channels_id 
ON channels(id);

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
1. Lista de restaurantes (stores ORDER BY name) - OTIMIZADO com idx_stores_name
2. Vendas totais (sales) - OTIMIZADO com idx_sales_store_created
3. Faturamento (revenue) - OTIMIZADO com idx_sales_store_created e idx_payments_sale_value
4. Produto mais vendido (product_sales + products) - OTIMIZADO com idx_product_sales_sale_id
5. Vendas por turno - OTIMIZADO com idx_sales_store_created (EXTRACT HOUR é otimizado pelo índice composto)
6. Ticket médio (payments + sales) - OTIMIZADO com idx_sales_store_created e idx_payments_sale_value
7. Ranking de produtos (product_sales) - OTIMIZADO com idx_product_sales_sale_id
8. Vendas por canal (sales + channels) - OTIMIZADO com idx_sales_channel_id e idx_channels_id

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
-- WHERE tablename IN ('sales', 'payments', 'products', 'product_sales', 'stores', 'channels')
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
-- DROP INDEX IF EXISTS idx_stores_name;
-- DROP INDEX IF EXISTS idx_stores_name_id;
-- DROP INDEX IF EXISTS idx_sales_channel_id;
-- DROP INDEX IF EXISTS idx_channels_id;

