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
    
    // Buscar todas as regiões (neighborhood) únicas que têm entregas no período
    const sql = `SELECT 
                   da.neighborhood as regiao,
                   COUNT(DISTINCT s.id) as total_entregas,
                   AVG(s.delivery_seconds) as tempo_medio_segundos
                 FROM sales s
                 JOIN delivery_sales ds ON s.id = ds.sale_id
                 JOIN delivery_addresses da ON ds.id = da.delivery_sale_id
                 WHERE s.store_id = $1 ${filterClause}
                   AND s.delivery_seconds IS NOT NULL
                   AND da.neighborhood IS NOT NULL
                   AND da.neighborhood != ''
                 GROUP BY da.neighborhood
                 ORDER BY total_entregas DESC`;
    
    const result = await pool.query(sql, [id, ...dateParams]);
    
    return NextResponse.json(result.rows.map(row => ({
      regiao: row.regiao,
      totalEntregas: parseInt(row.total_entregas),
      tempoMedioMinutos: row.tempo_medio_segundos ? Math.round(row.tempo_medio_segundos / 60) : 0
    })));
    
  } catch (error) {
    console.error('❌ Erro ao buscar regiões de entrega:', error);
    return NextResponse.json([]);
  }
}

