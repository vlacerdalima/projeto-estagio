/**
 * Script de Benchmark para Queries da Aplicação
 * 
 * Este script mede o tempo de execução de todas as queries principais
 * para garantir que atendem ao requisito de <= 2 segundos com 500k registros.
 * 
 * Como usar:
 * 1. Configure as variáveis de ambiente no .env.local
 * 2. Execute: npm run benchmark
 * 
 * NOTA: Este script carrega variáveis de ambiente automaticamente do .env.local
 */

// IMPORTANTE: Carregar dotenv ANTES de qualquer importação que use process.env
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Carregar variáveis de ambiente do .env.local
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');

console.log('📂 Caminho atual:', process.cwd());
console.log('📂 Procurando .env.local em:', envLocalPath);

// Tentar carregar .env.local primeiro, depois .env
if (existsSync(envLocalPath)) {
  console.log('✅ Arquivo .env.local encontrado!');
  const result = config({ path: envLocalPath, override: true });
  if (result.error) {
    console.error('❌ Erro ao carregar .env.local:', result.error.message);
  } else {
    console.log('✅ Variáveis de .env.local carregadas');
  }
} else {
  console.warn('⚠️  Arquivo .env.local NÃO encontrado em:', envLocalPath);
}

if (existsSync(envPath)) {
  console.log('✅ Arquivo .env encontrado, carregando...');
  config({ path: envPath, override: false }); // Não sobrescrever se .env.local já carregou
}

// Debug: Verificar se as variáveis foram carregadas (sem mostrar senha)
console.log('\n🔍 Verificando variáveis de ambiente:');
console.log('   DB_HOST:', process.env.DB_HOST || '❌ não definido');
console.log('   DB_PORT:', process.env.DB_PORT || '❌ não definido');
console.log('   DB_NAME:', process.env.DB_NAME || '❌ não definido');
console.log('   DB_USER:', process.env.DB_USER || '❌ não definido');
console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ definido' : '❌ não definido');

// Verificar se todas as variáveis necessárias estão presentes
if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error('\n❌ ERRO: Variáveis de ambiente não carregadas corretamente!');
  console.error('   Verifique se o arquivo .env.local está na raiz do projeto');
  console.error('   E contém: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
  process.exit(1);
}

console.log('');

// Importar módulos (mas criar pool depois de carregar env)
import { Pool } from 'pg';
import { buildDateFilter } from '../lib/dateFilter';

// Criar pool de conexão com as variáveis já carregadas
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'seu_banco_de_dados',
  user: process.env.DB_USER || 'seu_usuario',
  password: process.env.DB_PASSWORD || 'sua_senha',
});

interface BenchmarkResult {
  queryName: string;
  executionTime: number;
  recordCount: number;
  passed: boolean;
  error?: string;
}

const TARGET_TIME_MS = 2000; // 2 segundos
const TEST_STORE_ID = '1'; // ID do restaurante para teste

async function measureQuery(
  queryName: string,
  sql: string,
  params: any[],
  countQuery?: string,
  countParams?: any[]
): Promise<BenchmarkResult> {
  try {
    const startTime = Date.now();
    
    // Executar a query
    const result = await pool.query(sql, params);
    
    const executionTime = Date.now() - startTime;
    
    // Contar registros processados se fornecido
    let recordCount = 0;
    if (countQuery && countParams) {
      const countResult = await pool.query(countQuery, countParams);
      recordCount = parseInt(countResult.rows[0]?.count || '0');
    } else {
      // Tentar estimar baseado nos resultados
      recordCount = result.rows.length;
    }
    
    return {
      queryName,
      executionTime,
      recordCount,
      passed: executionTime <= TARGET_TIME_MS
    };
  } catch (error: any) {
    return {
      queryName,
      executionTime: 0,
      recordCount: 0,
      passed: false,
      error: error.message
    };
  }
}

async function runBenchmarks() {
  console.log('🚀 Iniciando benchmark de queries...\n');
  console.log(`Meta: <= ${TARGET_TIME_MS}ms (2 segundos)\n`);
  
  const results: BenchmarkResult[] = [];
  
  // 1. Vendas totais
  const { filter: dateFilter, params: dateParams } = buildDateFilter(null, null, 'anual', '');
  const vendasSql = `SELECT COUNT(*) as total FROM sales WHERE store_id = $1 ${dateFilter}`;
  const vendasCount = `SELECT COUNT(*) as count FROM sales WHERE store_id = $1 ${dateFilter}`;
  
  results.push(await measureQuery(
    'Vendas Totais',
    vendasSql,
    [TEST_STORE_ID, ...dateParams],
    vendasCount,
    [TEST_STORE_ID, ...dateParams]
  ));
  
  // 2. Faturamento
  const { filter: faturamentoFilter, params: faturamentoParams } = buildDateFilter(null, null, 'anual', 's.');
  const faturamentoSql = `SELECT COALESCE(SUM(p.value), 0) as revenue 
                          FROM sales s 
                          JOIN payments p ON s.id = p.sale_id 
                          WHERE s.store_id = $1 ${faturamentoFilter}`;
  const faturamentoCount = `SELECT COUNT(*) as count 
                            FROM sales s 
                            WHERE s.store_id = $1 ${faturamentoFilter}`;
  
  results.push(await measureQuery(
    'Faturamento',
    faturamentoSql,
    [TEST_STORE_ID, ...faturamentoParams],
    faturamentoCount,
    [TEST_STORE_ID, ...faturamentoParams]
  ));
  
  // 3. Produto mais vendido
  const produtoMaisVendidoSql = `SELECT p.name as nome_produto, SUM(ps.quantity) as total_vendido 
                                  FROM sales s 
                                  JOIN product_sales ps ON s.id = ps.sale_id 
                                  JOIN products p ON ps.product_id = p.id 
                                  WHERE s.store_id = $1 ${faturamentoFilter}
                                  GROUP BY p.name 
                                  ORDER BY total_vendido DESC 
                                  LIMIT 1`;
  const produtoMaisVendidoCount = `SELECT COUNT(DISTINCT ps.product_id) as count
                                   FROM sales s 
                                   JOIN product_sales ps ON s.id = ps.sale_id 
                                   WHERE s.store_id = $1 ${faturamentoFilter}`;
  
  results.push(await measureQuery(
    'Produto Mais Vendido',
    produtoMaisVendidoSql,
    [TEST_STORE_ID, ...faturamentoParams],
    produtoMaisVendidoCount,
    [TEST_STORE_ID, ...faturamentoParams]
  ));
  
  // 4. Ranking de produtos
  const rankingSql = `SELECT p.name as nome_produto, SUM(ps.quantity) as total_vendido 
                       FROM sales s 
                       JOIN product_sales ps ON s.id = ps.sale_id 
                       JOIN products p ON ps.product_id = p.id 
                       WHERE s.store_id = $1 ${faturamentoFilter}
                       GROUP BY p.name 
                       ORDER BY total_vendido DESC 
                       LIMIT 100`;
  
  results.push(await measureQuery(
    'Ranking de Produtos (Top 100)',
    rankingSql,
    [TEST_STORE_ID, ...faturamentoParams],
    produtoMaisVendidoCount,
    [TEST_STORE_ID, ...faturamentoParams]
  ));
  
  // 5. Vendas por turno
  const { filter: turnoFilter, params: turnoParams } = buildDateFilter(null, null, 'anual', '');
  const turnoSql = `SELECT 
                      CASE 
                        WHEN EXTRACT(HOUR FROM created_at) >= 6 AND EXTRACT(HOUR FROM created_at) < 12 THEN 'manha'
                        WHEN EXTRACT(HOUR FROM created_at) >= 12 AND EXTRACT(HOUR FROM created_at) < 18 THEN 'tarde'
                        ELSE 'noite'
                      END as turno,
                      COUNT(*) as total
                    FROM sales
                    WHERE store_id = $1 ${turnoFilter}
                    GROUP BY 
                      CASE 
                        WHEN EXTRACT(HOUR FROM created_at) >= 6 AND EXTRACT(HOUR FROM created_at) < 12 THEN 'manha'
                        WHEN EXTRACT(HOUR FROM created_at) >= 12 AND EXTRACT(HOUR FROM created_at) < 18 THEN 'tarde'
                        ELSE 'noite'
                      END`;
  
  results.push(await measureQuery(
    'Vendas por Turno',
    turnoSql,
    [TEST_STORE_ID, ...turnoParams],
    vendasCount,
    [TEST_STORE_ID, ...turnoParams]
  ));
  
  // 6. Ticket médio
  const ticketMedioSql = `SELECT 
                            COUNT(DISTINCT s.id) as total_pedidos,
                            COALESCE(SUM(p.value), 0) as total_receita
                          FROM sales s 
                          LEFT JOIN payments p ON s.id = p.sale_id 
                          WHERE s.store_id = $1 ${faturamentoFilter}`;
  
  results.push(await measureQuery(
    'Ticket Médio',
    ticketMedioSql,
    [TEST_STORE_ID, ...faturamentoParams],
    vendasCount,
    [TEST_STORE_ID, ...faturamentoParams]
  ));
  
  // 7. Vendas por canal
  const canalSql = `SELECT 
                      COALESCE(c.name, 'Não especificado') as canal,
                      COUNT(DISTINCT s.id) as quantidade,
                      COALESCE(SUM(p.value), 0) as receita
                    FROM sales s 
                    LEFT JOIN payments p ON s.id = p.sale_id 
                    LEFT JOIN channels c ON s.channel_id = c.id
                    WHERE s.store_id = $1 ${faturamentoFilter}
                    GROUP BY c.name
                    ORDER BY receita DESC`;
  
  results.push(await measureQuery(
    'Vendas por Canal',
    canalSql,
    [TEST_STORE_ID, ...faturamentoParams],
    vendasCount,
    [TEST_STORE_ID, ...faturamentoParams]
  ));
  
  // 8. Tendência de vendas
  const tendenciaSql = `SELECT 
                          EXTRACT(YEAR FROM created_at)::integer as ano,
                          EXTRACT(MONTH FROM created_at)::integer as mes,
                          COUNT(*)::integer as vendas
                        FROM sales
                        WHERE store_id = $1 
                        AND created_at >= NOW() - INTERVAL '12 months'
                        GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
                        ORDER BY ano ASC, mes ASC`;
  
  const tendenciaCount = `SELECT COUNT(*) as count
                          FROM sales
                          WHERE store_id = $1 
                          AND created_at >= NOW() - INTERVAL '12 months'`;
  
  results.push(await measureQuery(
    'Tendência de Vendas',
    tendenciaSql,
    [TEST_STORE_ID],
    tendenciaCount,
    [TEST_STORE_ID]
  ));
  
  // 9. Desvio da média
  const desvioSemanaAtualSql = `SELECT COALESCE(SUM(p.value), 0) as receita
                                FROM sales s
                                JOIN payments p ON s.id = p.sale_id
                                WHERE s.store_id = $1
                                AND s.created_at >= NOW() - INTERVAL '7 days'
                                AND s.created_at < NOW()`;
  
  results.push(await measureQuery(
    'Desvio da Média (Semana Atual)',
    desvioSemanaAtualSql,
    [TEST_STORE_ID],
    `SELECT COUNT(*) as count FROM sales WHERE store_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`,
    [TEST_STORE_ID]
  ));
  
  const desvioHistoricoSql = `SELECT COALESCE(AVG(receita_semanal), 0) as media_historica
                              FROM (
                                SELECT 
                                  DATE_TRUNC('week', s.created_at) as semana,
                                  SUM(p.value) as receita_semanal
                                FROM sales s
                                JOIN payments p ON s.id = p.sale_id
                                WHERE s.store_id = $1
                                AND s.created_at >= NOW() - INTERVAL '3 months'
                                AND s.created_at < NOW() - INTERVAL '7 days'
                                GROUP BY DATE_TRUNC('week', s.created_at)
                                ORDER BY semana DESC
                                LIMIT 12
                              ) semanas_historicas`;
  
  results.push(await measureQuery(
    'Desvio da Média (Histórico)',
    desvioHistoricoSql,
    [TEST_STORE_ID],
    `SELECT COUNT(*) as count FROM sales WHERE store_id = $1 AND created_at >= NOW() - INTERVAL '3 months'`,
    [TEST_STORE_ID]
  ));
  
  // Exibir resultados
  console.log('📊 Resultados do Benchmark:\n');
  console.log('═'.repeat(80));
  
  let passedCount = 0;
  let failedCount = 0;
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    const timeColor = result.executionTime <= TARGET_TIME_MS ? '' : '\x1b[31m'; // Vermelho se falhou
    const resetColor = '\x1b[0m';
    
    console.log(`${status} ${result.queryName}`);
    console.log(`   Tempo: ${timeColor}${result.executionTime}ms${resetColor} (meta: <= ${TARGET_TIME_MS}ms)`);
    console.log(`   Registros processados: ~${result.recordCount.toLocaleString()}`);
    
    if (result.error) {
      console.log(`   ⚠️  Erro: ${result.error}`);
      failedCount++;
    } else if (result.passed) {
      passedCount++;
    } else {
      failedCount++;
    }
    
    console.log('');
  });
  
  console.log('═'.repeat(80));
  console.log(`\n📈 Resumo:`);
  console.log(`   ✅ Passou: ${passedCount}`);
  console.log(`   ❌ Falhou: ${failedCount}`);
  console.log(`   Total: ${results.length}\n`);
  
  if (failedCount === 0) {
    console.log('🎉 Todas as queries atendem ao requisito de <= 2 segundos!');
  } else {
    console.log('⚠️  Algumas queries precisam de otimização.');
    console.log('\n💡 Sugestões:');
    console.log('   1. Verifique se os índices estão criados (database/indexes-urgentes.sql)');
    console.log('   2. Execute EXPLAIN ANALYZE nas queries que falharam');
    console.log('   3. Considere adicionar LIMIT onde apropriado');
    console.log('   4. Verifique se os índices estão sendo usados pelas queries\n');
  }
  
  // Fechar conexão
  await pool.end();
}

// Executar benchmark
runBenchmarks().catch((error) => {
  console.error('❌ Erro ao executar benchmark:', error);
  process.exit(1);
});

