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
    
    // Buscar faturamento e número de vendas do período atual
    const queryParams = [id, ...dateParams];
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(p.value), 0) as revenue,
        COUNT(DISTINCT s.id) as total_sales
       FROM sales s 
       JOIN payments p ON s.id = p.sale_id 
       WHERE s.store_id = $1 ${filterClause}`,
      queryParams
    );
    
    const revenue = parseFloat(result.rows[0]?.revenue || 0);
    const totalSales = parseInt(result.rows[0]?.total_sales || 0);
    const ticketMedio = totalSales > 0 ? revenue / totalSales : 0;
    
    // Buscar faturamento e número de vendas do período anterior
    // Se ano/mês específicos foram selecionados, calcular período anterior baseado nisso
    let previousFilterClause = '';
    let previousParams: any[] = [];
    
    if (year && year !== 'todos' && month && month !== 'todos') {
      // Mês específico: período anterior é o mês anterior
      const prevMonth = parseInt(month as string) - 1;
      const prevYear = prevMonth <= 0 ? parseInt(year as string) - 1 : parseInt(year as string);
      const actualPrevMonth = prevMonth <= 0 ? 12 : prevMonth;
      previousFilterClause = `AND EXTRACT(YEAR FROM s.created_at) = $2 AND EXTRACT(MONTH FROM s.created_at) = $3`;
      previousParams = [prevYear, actualPrevMonth];
    } else if (year && year !== 'todos') {
      // Ano específico: período anterior é o ano anterior
      const prevYear = parseInt(year as string) - 1;
      previousFilterClause = `AND EXTRACT(YEAR FROM s.created_at) = $2`;
      previousParams = [prevYear];
    } else {
      // Fallback para cálculo padrão baseado em período
      previousFilterClause = period === 'mensal' 
        ? "AND s.created_at >= NOW() - INTERVAL '60 days' AND s.created_at < NOW() - INTERVAL '30 days'"
        : "AND s.created_at >= NOW() - INTERVAL '2 years' AND s.created_at < NOW() - INTERVAL '1 year'";
    }
    
    const previousResult = await pool.query(
      `SELECT 
        COALESCE(SUM(p.value), 0) as revenue,
        COUNT(DISTINCT s.id) as total_sales
       FROM sales s 
       JOIN payments p ON s.id = p.sale_id 
       WHERE s.store_id = $1 ${previousFilterClause}`,
      [id, ...previousParams]
    );
    
    const previousRevenue = parseFloat(previousResult.rows[0]?.revenue || 0);
    const previousTotalSales = parseInt(previousResult.rows[0]?.total_sales || 0);
    const previousTicketMedio = previousTotalSales > 0 ? previousRevenue / previousTotalSales : 0;
    
    // Calcular variação percentual
    let variacao = 0;
    if (previousTicketMedio > 0) {
      variacao = ((ticketMedio - previousTicketMedio) / previousTicketMedio) * 100;
    } else if (ticketMedio > 0) {
      variacao = 100; // Se não havia ticket médio anterior, consideramos 100% de crescimento
    }
    
    return NextResponse.json({
      ticketMedio: ticketMedio,
      variacao: variacao,
      periodo: period
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar ticket médio:', error);
    return NextResponse.json({
      ticketMedio: 0,
      variacao: 0,
      periodo: 'anual'
    });
  }
}

