-- ============================================
-- ÍNDICES URGENTES PARA OTIMIZAÇÃO CRÍTICA (CORRIGIDO)
-- Execute estes comandos PRIMEIRO para garantir performance <= 2s com 500k registros
-- ============================================
-- 
-- NOTA: Todos os índices aqui foram testados e não usam funções não-IMMUTABLE
-- ============================================

-- ============================================
-- ÍNDICE CRÍTICO: PRODUCT_SALES para ranking
-- ============================================
-- Otimiza JOIN entre sales, product_sales e products
-- ESSENCIAL para queries de ranking de produtos
CREATE INDEX IF NOT EXISTS idx_product_sales_sale_product 
ON product_sales(sale_id, product_id) 
INCLUDE (quantity);

-- Índice adicional para GROUP BY product_id em queries de ranking
CREATE INDEX IF NOT EXISTS idx_product_sales_product_store 
ON product_sales(product_id, sale_id);

-- ============================================
-- ÍNDICES PARA VENDAS COM FILTRO DE PERÍODO
-- ============================================
-- O índice idx_sales_store_created (do arquivo database-indexes.sql) já otimiza
-- queries por período. Não precisamos de índice parcial com data dinâmica.

-- ============================================
-- ÍNDICE PARA DELIVERY_SECONDS (tempo médio entrega)
-- ============================================
-- Otimiza queries que usam delivery_seconds com filtros
-- Usa IS NOT NULL (que é IMMUTABLE) ao invés de NOW()
CREATE INDEX IF NOT EXISTS idx_sales_delivery_store 
ON sales(store_id, delivery_seconds) 
WHERE delivery_seconds IS NOT NULL;

-- ============================================
-- ÍNDICE PARA PAYMENTS COM VALOR
-- ============================================
-- Melhora queries de faturamento e ticket médio
-- Otimiza SUM(p.value) quando já tem sale_id filtrado
CREATE INDEX IF NOT EXISTS idx_payments_sale_id_covering 
ON payments(sale_id) 
INCLUDE (value);

-- ============================================
-- ÍNDICES PARA DELIVERY_SALES (se existir)
-- ============================================
-- Para otimizar queries de tempo médio de entrega por região
CREATE INDEX IF NOT EXISTS idx_delivery_sales_sale_id 
ON delivery_sales(sale_id);

-- ============================================
-- ÍNDICES PARA DELIVERY_ADDRESSES (se existir)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_delivery_sale_id 
ON delivery_addresses(delivery_sale_id);

CREATE INDEX IF NOT EXISTS idx_delivery_addresses_neighborhood 
ON delivery_addresses(neighborhood);

-- ============================================
-- VERIFICAÇÃO DE ÍNDICES CRIADOS
-- ============================================
-- Execute após criar os índices para verificar:
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('sales', 'payments', 'products', 'product_sales', 'delivery_sales', 'delivery_addresses')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================
-- ANÁLISE DE TAMANHO DOS ÍNDICES
-- ============================================
-- Execute para verificar o tamanho dos índices:
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename IN ('sales', 'payments', 'products', 'product_sales')
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================
-- ESTATÍSTICAS DE USO DOS ÍNDICES
-- ============================================
-- Execute para verificar se os índices estão sendo usados:
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN ('sales', 'payments', 'products', 'product_sales')
ORDER BY idx_scan DESC;

