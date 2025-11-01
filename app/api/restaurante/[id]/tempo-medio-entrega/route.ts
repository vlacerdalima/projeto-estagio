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
    const regiao = searchParams.get('regiao'); // opcional: filtrar por região
    
    const { filter: filterClause, params: dateParams } = buildDateFilter(year, month, period, 's.');
    
    // Construir query base
    let baseQuery = '';
    let queryParams: any[] = [id, ...dateParams];
    
    if (regiao && regiao !== 'todas') {
      // Filtrar por região específica
      baseQuery = `FROM sales s
                   JOIN delivery_sales ds ON s.id = ds.sale_id
                   JOIN delivery_addresses da ON ds.id = da.delivery_sale_id
                   WHERE s.store_id = $1 
                     AND s.delivery_seconds IS NOT NULL
                     AND da.neighborhood = $${queryParams.length + 1}
                     ${filterClause}`;
      queryParams.push(regiao);
    } else {
      // Todas as regiões
      baseQuery = `FROM sales s
                   WHERE s.store_id = $1 
                     AND s.delivery_seconds IS NOT NULL
                     ${filterClause}`;
    }
    
    // Tentar buscar tempo real, se não existir, usar mockado
    let result;
    try {
      // Tentar query com campo delivery_seconds
      result = await pool.query(
        `SELECT AVG(s.delivery_seconds) as tempo_medio_segundos
         ${baseQuery}`,
        queryParams
      );
    } catch (err) {
      // Se falhar, pode ser que o campo não exista, então usaremos mockado
      console.log('❌ Erro ao buscar delivery_seconds:', err);
      result = { rows: [{ tempo_medio_segundos: null }] };
    }
    
    const tempoMedioSegundos = result.rows[0]?.tempo_medio_segundos ? parseFloat(result.rows[0].tempo_medio_segundos) : 2700; // 45 min default
    const tempoMedio = Math.round(tempoMedioSegundos / 60); // converter segundos para minutos
    
    // Buscar período anterior para calcular variação
    let previousFilterClause = '';
    let previousParams: any[] = [];
    
    if (year && year !== 'todos' && month && month !== 'todos') {
      const prevMonth = parseInt(month as string) - 1;
      const prevYear = prevMonth <= 0 ? parseInt(year as string) - 1 : parseInt(year as string);
      const actualPrevMonth = prevMonth <= 0 ? 12 : prevMonth;
      previousFilterClause = `AND EXTRACT(YEAR FROM s.created_at) = $2 AND EXTRACT(MONTH FROM s.created_at) = $3`;
      previousParams = [prevYear, actualPrevMonth];
    } else if (year && year !== 'todos') {
      const prevYear = parseInt(year as string) - 1;
      previousFilterClause = `AND EXTRACT(YEAR FROM s.created_at) = $2`;
      previousParams = [prevYear];
    } else {
      previousFilterClause = period === 'mensal' 
        ? "AND s.created_at >= NOW() - INTERVAL '60 days' AND s.created_at < NOW() - INTERVAL '30 days'"
        : "AND s.created_at >= NOW() - INTERVAL '2 years' AND s.created_at < NOW() - INTERVAL '1 year'";
    }
    
    // Construir query do período anterior
    let previousBaseQuery = '';
    let previousQueryParams: any[] = [id, ...previousParams];
    
    if (regiao && regiao !== 'todas') {
      previousBaseQuery = `FROM sales s
                           JOIN delivery_sales ds ON s.id = ds.sale_id
                           JOIN delivery_addresses da ON ds.id = da.delivery_sale_id
                           WHERE s.store_id = $1 
                             AND s.delivery_seconds IS NOT NULL
                             AND da.neighborhood = $${previousQueryParams.length + 1}
                             ${previousFilterClause}`;
      previousQueryParams.push(regiao);
    } else {
      previousBaseQuery = `FROM sales s
                           WHERE s.store_id = $1 
                             AND s.delivery_seconds IS NOT NULL
                             ${previousFilterClause}`;
    }
    
    let previousResult;
    try {
      previousResult = await pool.query(
        `SELECT AVG(s.delivery_seconds) as tempo_medio_segundos
         ${previousBaseQuery}`,
        previousQueryParams
      );
    } catch (err) {
      previousResult = { rows: [{ tempo_medio_segundos: null }] };
    }
    
    const previousTempoMedioSegundos = previousResult.rows[0]?.tempo_medio_segundos ? parseFloat(previousResult.rows[0].tempo_medio_segundos) : 3000; // 50 min default
    const previousTempoMedio = Math.round(previousTempoMedioSegundos / 60); // converter segundos para minutos
    
    // Calcular variação percentual
    let variacao = 0;
    if (previousTempoMedio > 0) {
      variacao = ((tempoMedio - previousTempoMedio) / previousTempoMedio) * 100;
    } else if (tempoMedio > 0) {
      variacao = -100; // Se não havia tempo anterior, consideramos redução de 100%
    }
    
    return NextResponse.json({
      tempoMedio: tempoMedio,
      variacao: variacao,
      periodo: period
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar tempo médio de entrega:', error);
    return NextResponse.json({
      tempoMedio: 45,
      variacao: 0,
      periodo: 'anual'
    });
  }
}

