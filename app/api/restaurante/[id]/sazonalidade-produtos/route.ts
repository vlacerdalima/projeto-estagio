import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { buildDateFilter } from '@/lib/dateFilter';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'anual';
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    
    const { filter: filterClause, params: dateParams } = buildDateFilter(year, month, period, 's.');
    
    // Query para calcular sazonalidade de produtos baseada em vendas reais
    // Tenta várias estruturas de tabela, assim como outras queries de produtos
    const queries = [
      // Tenta product_sales (snake_case)
      {
        sql: `
          WITH vendas_por_mes AS (
            SELECT 
              p.name as nome_produto,
              p.id as product_id,
              EXTRACT(MONTH FROM s.created_at) as mes,
              SUM(ps.quantity) as total_mes
            FROM sales s
            JOIN product_sales ps ON s.id = ps.sale_id
            JOIN products p ON ps.product_id = p.id
            WHERE s.store_id = $1 ${filterClause}
            GROUP BY p.id, p.name, EXTRACT(MONTH FROM s.created_at)
          ),
          baseline_por_produto AS (
            SELECT 
              nome_produto,
              product_id,
              AVG(total_mes) as baseline
            FROM vendas_por_mes
            GROUP BY product_id, nome_produto
            HAVING COUNT(DISTINCT mes) >= 6  -- Precisa ter pelo menos 6 meses de dados
          ),
          lift_por_mes AS (
            SELECT 
              vpm.nome_produto,
              vpm.mes,
              vpm.total_mes,
              bp.baseline,
              CASE 
                WHEN bp.baseline > 0 THEN ((vpm.total_mes::decimal / bp.baseline) - 1) * 100
                ELSE 0
              END as lift
            FROM vendas_por_mes vpm
            JOIN baseline_por_produto bp ON vpm.product_id = bp.product_id
          ),
          pico_por_produto AS (
            SELECT 
              nome_produto,
              mes as mes_pico,
              MAX(lift) as max_lift,
              MAX(total_mes) as total_mes_pico
            FROM lift_por_mes
            WHERE lift >= 80  -- Lift mínimo de 80%
            GROUP BY nome_produto, mes
            HAVING MAX(lift) = (
              SELECT MAX(lift) 
              FROM lift_por_mes lpm2 
              WHERE lpm2.nome_produto = lift_por_mes.nome_produto
            )
          ),
          produtos_sazonais AS (
            SELECT DISTINCT ON (ppp.nome_produto)
              ppp.nome_produto,
              ppp.mes_pico,
              ROUND(ppp.max_lift::numeric, 0) as lift,
              (SELECT ARRAY_AGG(total_mes ORDER BY mes)
               FROM lift_por_mes lpm3
               WHERE lpm3.nome_produto = ppp.nome_produto
               GROUP BY lpm3.nome_produto) as pontos_sazonalidade
            FROM pico_por_produto ppp
            ORDER BY ppp.nome_produto, ppp.max_lift DESC
          )
          SELECT 
            nome_produto as nome,
            CASE mes_pico::integer
              WHEN 1 THEN 'Jan'
              WHEN 2 THEN 'Fev'
              WHEN 3 THEN 'Mar'
              WHEN 4 THEN 'Abr'
              WHEN 5 THEN 'Mai'
              WHEN 6 THEN 'Jun'
              WHEN 7 THEN 'Jul'
              WHEN 8 THEN 'Ago'
              WHEN 9 THEN 'Set'
              WHEN 10 THEN 'Out'
              WHEN 11 THEN 'Nov'
              WHEN 12 THEN 'Dez'
              ELSE 'N/A'
            END as mes_pico,
            lift::integer as lift,
            pontos_sazonalidade
          FROM produtos_sazonais
          ORDER BY lift DESC
          LIMIT 5
        `,
        name: 'product_sales + products'
      },
      // Tenta ProductSales (PascalCase)
      {
        sql: `
          WITH vendas_por_mes AS (
            SELECT 
              p.name as nome_produto,
              p.id as product_id,
              EXTRACT(MONTH FROM s.created_at) as mes,
              SUM(ps.quantity) as total_mes
            FROM sales s
            JOIN ProductSales ps ON s.id = ps.saleId
            JOIN Products p ON ps.productId = p.id
            WHERE s.store_id = $1 ${filterClause}
            GROUP BY p.id, p.name, EXTRACT(MONTH FROM s.created_at)
          ),
          baseline_por_produto AS (
            SELECT 
              nome_produto,
              product_id,
              AVG(total_mes) as baseline
            FROM vendas_por_mes
            GROUP BY product_id, nome_produto
            HAVING COUNT(DISTINCT mes) >= 6
          ),
          lift_por_mes AS (
            SELECT 
              vpm.nome_produto,
              vpm.mes,
              vpm.total_mes,
              bp.baseline,
              CASE 
                WHEN bp.baseline > 0 THEN ((vpm.total_mes::decimal / bp.baseline) - 1) * 100
                ELSE 0
              END as lift
            FROM vendas_por_mes vpm
            JOIN baseline_por_produto bp ON vpm.product_id = bp.product_id
          ),
          pico_por_produto AS (
            SELECT 
              nome_produto,
              mes as mes_pico,
              MAX(lift) as max_lift
            FROM lift_por_mes
            WHERE lift >= 80
            GROUP BY nome_produto, mes
            HAVING MAX(lift) = (
              SELECT MAX(lift) 
              FROM lift_por_mes lpm2 
              WHERE lpm2.nome_produto = lift_por_mes.nome_produto
            )
          ),
          produtos_sazonais AS (
            SELECT DISTINCT ON (ppp.nome_produto)
              ppp.nome_produto,
              ppp.mes_pico,
              ROUND(ppp.max_lift::numeric, 0) as lift,
              (SELECT ARRAY_AGG(total_mes ORDER BY mes)
               FROM lift_por_mes lpm3
               WHERE lpm3.nome_produto = ppp.nome_produto
               GROUP BY lpm3.nome_produto) as pontos_sazonalidade
            FROM pico_por_produto ppp
            ORDER BY ppp.nome_produto, ppp.max_lift DESC
          )
          SELECT 
            nome_produto as nome,
            CASE mes_pico::integer
              WHEN 1 THEN 'Jan' WHEN 2 THEN 'Fev' WHEN 3 THEN 'Mar' WHEN 4 THEN 'Abr'
              WHEN 5 THEN 'Mai' WHEN 6 THEN 'Jun' WHEN 7 THEN 'Jul' WHEN 8 THEN 'Ago'
              WHEN 9 THEN 'Set' WHEN 10 THEN 'Out' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dez'
              ELSE 'N/A'
            END as mes_pico,
            lift::integer as lift,
            pontos_sazonalidade
          FROM produtos_sazonais
          ORDER BY lift DESC
          LIMIT 5
        `,
        name: 'ProductSales + Products'
      },
      // Tenta sale_products
      {
        sql: `
          WITH vendas_por_mes AS (
            SELECT 
              p.name as nome_produto,
              p.id as product_id,
              EXTRACT(MONTH FROM s.created_at) as mes,
              SUM(sp.quantity) as total_mes
            FROM sales s
            JOIN sale_products sp ON s.id = sp.sale_id
            JOIN products p ON sp.product_id = p.id
            WHERE s.store_id = $1 ${filterClause}
            GROUP BY p.id, p.name, EXTRACT(MONTH FROM s.created_at)
          ),
          baseline_por_produto AS (
            SELECT 
              nome_produto,
              product_id,
              AVG(total_mes) as baseline
            FROM vendas_por_mes
            GROUP BY product_id, nome_produto
            HAVING COUNT(DISTINCT mes) >= 6
          ),
          lift_por_mes AS (
            SELECT 
              vpm.nome_produto,
              vpm.mes,
              vpm.total_mes,
              bp.baseline,
              CASE 
                WHEN bp.baseline > 0 THEN ((vpm.total_mes::decimal / bp.baseline) - 1) * 100
                ELSE 0
              END as lift
            FROM vendas_por_mes vpm
            JOIN baseline_por_produto bp ON vpm.product_id = bp.product_id
          ),
          pico_por_produto AS (
            SELECT 
              nome_produto,
              mes as mes_pico,
              MAX(lift) as max_lift
            FROM lift_por_mes
            WHERE lift >= 80
            GROUP BY nome_produto, mes
            HAVING MAX(lift) = (
              SELECT MAX(lift) 
              FROM lift_por_mes lpm2 
              WHERE lpm2.nome_produto = lift_por_mes.nome_produto
            )
          ),
          produtos_sazonais AS (
            SELECT DISTINCT ON (ppp.nome_produto)
              ppp.nome_produto,
              ppp.mes_pico,
              ROUND(ppp.max_lift::numeric, 0) as lift,
              (SELECT ARRAY_AGG(total_mes ORDER BY mes)
               FROM lift_por_mes lpm3
               WHERE lpm3.nome_produto = ppp.nome_produto
               GROUP BY lpm3.nome_produto) as pontos_sazonalidade
            FROM pico_por_produto ppp
            ORDER BY ppp.nome_produto, ppp.max_lift DESC
          )
          SELECT 
            nome_produto as nome,
            CASE mes_pico::integer
              WHEN 1 THEN 'Jan' WHEN 2 THEN 'Fev' WHEN 3 THEN 'Mar' WHEN 4 THEN 'Abr'
              WHEN 5 THEN 'Mai' WHEN 6 THEN 'Jun' WHEN 7 THEN 'Jul' WHEN 8 THEN 'Ago'
              WHEN 9 THEN 'Set' WHEN 10 THEN 'Out' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dez'
              ELSE 'N/A'
            END as mes_pico,
            lift::integer as lift,
            pontos_sazonalidade
          FROM produtos_sazonais
          ORDER BY lift DESC
          LIMIT 5
        `,
        name: 'sale_products + products'
      }
    ];
    
    // Tentar cada query até uma funcionar
    for (const query of queries) {
      try {
        const result = await pool.query(query.sql, [id, ...dateParams]);
        
        if (result.rows.length > 0) {
          const produtos = result.rows.map(row => ({
            nome: row.nome,
            mesPico: row.mes_pico,
            lift: parseInt(row.lift) || 0,
            pontosSazonalidade: Array.isArray(row.pontos_sazonalidade) 
              ? row.pontos_sazonalidade.map((p: any) => parseFloat(p) || 0)
              : null
          }));
          
          return NextResponse.json({ produtos });
        }
      } catch (err: any) {
        // Tenta próxima query
        console.log(`Query ${query.name} falhou:`, err.message);
      }
    }
    
    // Se nenhuma query funcionou ou não há produtos sazonais, retorna vazio
    return NextResponse.json({ produtos: [] });
    
  } catch (error) {
    console.error('❌ Erro ao buscar sazonalidade de produtos:', error);
    return NextResponse.json({
      produtos: []
    });
  }
}

