import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'anual';
    
    const filterClause = period === 'mensal' ? "AND s.created_at >= NOW() - INTERVAL '30 days'" : '';
    
    // Buscar faturamento e número de vendas do período atual
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(p.value), 0) as revenue,
        COUNT(DISTINCT s.id) as total_sales
       FROM sales s 
       LEFT JOIN payments p ON s.id = p.sale_id 
       WHERE s.store_id = $1 ${filterClause}`,
      [id]
    );
    
    const revenue = parseFloat(result.rows[0].revenue);
    const totalSales = parseInt(result.rows[0].total_sales);
    const ticketMedio = totalSales > 0 ? revenue / totalSales : 0;
    
    // Buscar faturamento e número de vendas do período anterior
    const previousFilterClause = period === 'mensal' 
      ? "AND s.created_at >= NOW() - INTERVAL '60 days' AND s.created_at < NOW() - INTERVAL '30 days'"
      : "AND s.created_at >= NOW() - INTERVAL '2 years' AND s.created_at < NOW() - INTERVAL '1 year'";
    
    const previousResult = await pool.query(
      `SELECT 
        COALESCE(SUM(p.value), 0) as revenue,
        COUNT(DISTINCT s.id) as total_sales
       FROM sales s 
       LEFT JOIN payments p ON s.id = p.sale_id 
       WHERE s.store_id = $1 ${previousFilterClause}`,
      [id]
    );
    
    const previousRevenue = parseFloat(previousResult.rows[0].revenue);
    const previousTotalSales = parseInt(previousResult.rows[0].total_sales);
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

