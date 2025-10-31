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
    
    // Tenta as mesmas queries do produto mais vendido, mas sem LIMIT
    const queries = [
      {
        sql: `SELECT p.name as nome_produto, SUM(ps.quantity) as total_vendido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN products p ON ps.product_id = p.id 
              WHERE s.store_id = $1 ${filterClause}
              GROUP BY p.name 
              ORDER BY total_vendido DESC`,
        name: 'product_sales + products'
      },
      {
        sql: `SELECT p.name as nome_produto, SUM(ps.quantity) as total_vendido 
              FROM sales s 
              JOIN ProductSales ps ON s.id = ps.saleId 
              JOIN Products p ON ps.productId = p.id 
              WHERE s.store_id = $1 ${filterClause}
              GROUP BY p.name 
              ORDER BY total_vendido DESC`,
        name: 'ProductSales + Products'
      },
      {
        sql: `SELECT p.name as nome_produto, SUM(sp.quantity) as total_vendido 
              FROM sales s 
              JOIN sale_products sp ON s.id = sp.sale_id 
              JOIN products p ON sp.product_id = p.id 
              WHERE s.store_id = $1 ${filterClause}
              GROUP BY p.name 
              ORDER BY total_vendido DESC`,
        name: 'sale_products + products'
      }
    ];
    
    for (const query of queries) {
      try {
        const result = await pool.query(query.sql, [id, ...dateParams]);
        
        if (result.rows.length > 0) {
          const produtos = result.rows.map(row => ({
            nome: row.nome_produto,
            total: parseInt(row.total_vendido)
          }));
          
          return NextResponse.json(produtos);
        }
      } catch (err: any) {
        // Tenta próxima query
      }
    }
    
    return NextResponse.json([]);
    
  } catch (error) {
    console.error('❌ Erro ao buscar ranking de produtos:', error);
    return NextResponse.json([]);
  }
}

