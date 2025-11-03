import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { buildDateFilter } from '@/lib/dateFilter';
import { normalizeData } from '@/lib/utils';

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
    const search = searchParams.get('search') || ''; // Parâmetro de busca opcional
    
    const { filter: filterClause, params: dateParams } = buildDateFilter(year, month, period, 's.');
    
    // Construir filtro de busca se fornecido
    let searchFilter = '';
    
    if (search && search.trim() !== '') {
      // O índice do parâmetro é: $1 (store_id) + dateParams.length + 1 (próximo parâmetro)
      const searchParamIndex = dateParams.length + 2;
      searchFilter = `AND da.neighborhood ILIKE $${searchParamIndex}`;
      dateParams.push(`%${search.trim()}%`);
    }
    
    // Query otimizada: Se há busca, não usar LIMIT (mostrar todas as correspondências)
    // Se não há busca, usar LIMIT 100 para performance (top 100 regiões)
    const limitClause = search && search.trim() !== '' ? '' : 'LIMIT 100';
    
    // Buscar regiões (neighborhood) únicas que têm entregas no período
    // Otimização: LIMIT 100 quando não há busca para garantir performance <= 2s
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
                   ${searchFilter}
                 GROUP BY da.neighborhood
                 ORDER BY total_entregas DESC
                 ${limitClause}`;
    
    const result = await pool.query(sql, [id, ...dateParams]);
    
    return NextResponse.json(normalizeData(result.rows.map(row => ({
      regiao: row.regiao,
      totalEntregas: parseInt(row.total_entregas),
      tempoMedioMinutos: row.tempo_medio_segundos ? Math.round(row.tempo_medio_segundos / 60) : 0
    }))));
    
  } catch (error) {
    console.error('❌ Erro ao buscar regiões de entrega:', error);
    return NextResponse.json([]);
  }
}

