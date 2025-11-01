import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Calcular a receita da semana atual (últimos 7 dias)
    const semanaAtualQuery = `
      SELECT COALESCE(SUM(p.value), 0) as receita
      FROM sales s
      JOIN payments p ON s.id = p.sale_id
      WHERE s.store_id = $1
      AND s.created_at >= NOW() - INTERVAL '7 days'
      AND s.created_at < NOW()
    `;
    
    const semanaAtualResult = await pool.query(semanaAtualQuery, [id]);
    const semanaAtual = parseFloat(semanaAtualResult.rows[0]?.receita || 0);

    // Calcular a média histórica de receita semanal
    // Vamos pegar as últimas 12 semanas (excluindo a semana atual) dos últimos 3 meses
    // Agrupar por semana (usando DATE_TRUNC para agrupar por semana)
    const mediaHistoricaQuery = `
      WITH semanas_historicas AS (
        SELECT 
          DATE_TRUNC('week', s.created_at) as semana,
          COALESCE(SUM(p.value), 0) as receita_semanal
        FROM sales s
        JOIN payments p ON s.id = p.sale_id
        WHERE s.store_id = $1
        AND s.created_at >= NOW() - INTERVAL '3 months'
        AND s.created_at < NOW() - INTERVAL '7 days' -- Excluir a semana atual
        GROUP BY DATE_TRUNC('week', s.created_at)
        ORDER BY semana DESC
        LIMIT 12
      )
      SELECT COALESCE(AVG(receita_semanal), 0) as media_historica
      FROM semanas_historicas
    `;
    
    const mediaHistoricaResult = await pool.query(mediaHistoricaQuery, [id]);
    const mediaHistorica = parseFloat(mediaHistoricaResult.rows[0]?.media_historica || 0);

    // Calcular percentual de desvio
    let percentualDesvio = 0;
    if (mediaHistorica > 0) {
      percentualDesvio = ((semanaAtual - mediaHistorica) / mediaHistorica) * 100;
    } else if (semanaAtual > 0) {
      // Se não há histórico mas há dados da semana atual, considerar 100% acima
      percentualDesvio = 100;
    }

    return NextResponse.json({
      semanaAtual: Math.round(semanaAtual * 100) / 100,
      mediaHistorica: Math.round(mediaHistorica * 100) / 100,
      percentualDesvio: Math.round(percentualDesvio * 10) / 10 // Arredondar para 1 casa decimal
    });
  } catch (error) {
    console.error('❌ Erro ao buscar desvio da média:', error);
    return NextResponse.json({
      semanaAtual: 0,
      mediaHistorica: 0,
      percentualDesvio: 0
    });
  }
}

