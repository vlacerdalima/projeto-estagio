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
    
    // Query para encontrar clientes recorrentes (>=3 compras) que não compram há 30 dias
    // Cliente recorrente = cliente com >=3 compras no histórico total (não apenas no período filtrado)
    // Sumido = última compra há mais de 30 dias
    
    const query = `
      WITH clientes_compras AS (
        SELECT 
          s.customer_id,
          s.customer_name,
          COUNT(DISTINCT s.id) as total_compras,
          MAX(s.created_at) as ultima_compra
        FROM sales s
        WHERE s.store_id = $1 
          AND s.customer_id IS NOT NULL
        GROUP BY s.customer_id, s.customer_name
        HAVING COUNT(DISTINCT s.id) >= 3  -- Pelo menos 3 compras (cliente recorrente)
      ),
      clientes_sumidos AS (
        SELECT 
          customer_id,
          customer_name,
          total_compras,
          ultima_compra,
          EXTRACT(DAY FROM (NOW() - ultima_compra))::integer as dias_sem_compra
        FROM clientes_compras
        WHERE ultima_compra < NOW() - INTERVAL '30 days'  -- Sem compra há 30 dias
      )
      SELECT COUNT(*) as total
      FROM clientes_sumidos
    `;
    
    const result = await pool.query(query, [id]);
    const total = parseInt(result.rows[0]?.total || '0');
    
    return NextResponse.json({ total });
    
  } catch (error) {
    console.error('❌ Erro ao buscar clientes recorrentes sumidos:', error);
    return NextResponse.json({
      total: 0
    });
  }
}

