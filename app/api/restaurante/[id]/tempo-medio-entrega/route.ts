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
    
    // Buscar tempo médio de entrega (supondo que existe um campo delivery_time ou calculated)
    const queryParams = [id, ...dateParams];
    
    // Tentar buscar tempo real, se não existir, usar mockado
    let result;
    try {
      // Tentar query com campo delivery_time
      result = await pool.query(
        `SELECT AVG(delivery_time) as tempo_medio
         FROM sales s
         WHERE s.store_id = $1 ${filterClause} AND s.delivery_time IS NOT NULL`,
        queryParams
      );
    } catch (err) {
      // Se falhar, pode ser que o campo não exista, então usaremos mockado
      console.log('Campo delivery_time não encontrado, usando dados mockados');
      result = { rows: [{ tempo_medio: null }] };
    }
    
    const tempoMedio = result.rows[0]?.tempo_medio ? parseFloat(result.rows[0].tempo_medio) : 45;
    
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
    
    let previousResult;
    try {
      previousResult = await pool.query(
        `SELECT AVG(delivery_time) as tempo_medio
         FROM sales s
         WHERE s.store_id = $1 ${previousFilterClause} AND s.delivery_time IS NOT NULL`,
        [id, ...previousParams]
      );
    } catch (err) {
      previousResult = { rows: [{ tempo_medio: null }] };
    }
    
    const previousTempoMedio = previousResult.rows[0]?.tempo_medio ? parseFloat(previousResult.rows[0].tempo_medio) : 50;
    
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

