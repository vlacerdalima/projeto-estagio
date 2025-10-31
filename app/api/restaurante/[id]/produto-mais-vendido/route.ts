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
    
    // Primeiro, vamos tentar descobrir qual tabela tem os produtos
    // Vou tentar várias possibilidades baseado na estrutura conhecida
    const queries = [
      // Tenta product_sales (snake_case)
      {
        sql: `SELECT p.name as nome_produto, SUM(ps.quantity) as total_vendido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN products p ON ps.product_id = p.id 
              WHERE s.store_id = $1 ${filterClause}
              GROUP BY p.name 
              ORDER BY total_vendido DESC 
              LIMIT 1`,
        name: 'product_sales + products'
      },
      // Tenta ProductSales (PascalCase)  
      {
        sql: `SELECT p.name as nome_produto, SUM(ps.quantity) as total_vendido 
              FROM sales s 
              JOIN ProductSales ps ON s.id = ps.saleId 
              JOIN Products p ON ps.productId = p.id 
              WHERE s.store_id = $1 ${filterClause}
              GROUP BY p.name 
              ORDER BY total_vendido DESC 
              LIMIT 1`,
        name: 'ProductSales + Products'
      },
      // Tenta sale_products
      {
        sql: `SELECT p.name as nome_produto, SUM(sp.quantity) as total_vendido 
              FROM sales s 
              JOIN sale_products sp ON s.id = sp.sale_id 
              JOIN products p ON sp.product_id = p.id 
              WHERE s.store_id = $1 ${filterClause}
              GROUP BY p.name 
              ORDER BY total_vendido DESC 
              LIMIT 1`,
        name: 'sale_products + products'
      }
    ];
    
    for (const query of queries) {
      try {
        const result = await pool.query(query.sql, [id, ...dateParams]);
        
        if (result.rows.length > 0 && result.rows[0].nome_produto) {
          return NextResponse.json({
            nome: result.rows[0].nome_produto,
            total: parseInt(result.rows[0].total_vendido)
          });
        }
      } catch (err: any) {
        // Tenta próxima query
      }
    }
    return NextResponse.json({ nome: null, total: 0 });
    
  } catch (error) {
    console.error('❌ Erro ao buscar produto mais vendido:', error);
    return NextResponse.json({
      nome: null,
      total: 0
    });
  }
}

