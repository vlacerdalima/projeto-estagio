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
    
    const { filter: filterClause, params: dateParams } = buildDateFilter(year, month, period, '');
    
    try {
      // Usando CTE para evitar problema com alias no GROUP BY
      const sql = `WITH vendas_por_turno AS (
        SELECT 
          CASE 
            WHEN EXTRACT(HOUR FROM created_at) >= 6 AND EXTRACT(HOUR FROM created_at) < 12 THEN 'manha'
            WHEN EXTRACT(HOUR FROM created_at) >= 12 AND EXTRACT(HOUR FROM created_at) < 18 THEN 'tarde'
            ELSE 'noite'
          END as turno
        FROM sales
        WHERE store_id = $1 ${filterClause}
      )
      SELECT turno, COUNT(*) as total
      FROM vendas_por_turno
      GROUP BY turno
      ORDER BY 
        CASE turno
          WHEN 'manha' THEN 1
          WHEN 'tarde' THEN 2
          WHEN 'noite' THEN 3
        END`;
      
      const result = await pool.query(sql, [id, ...dateParams]);
      
      const totalGeral = result.rows.reduce((sum, row) => sum + parseInt(row.total), 0);
      
      const vendasPorTurno = {
        manha: 0,
        tarde: 0,
        noite: 0
      };
      
      result.rows.forEach(row => {
        vendasPorTurno[row.turno as keyof typeof vendasPorTurno] = parseInt(row.total);
      });
      
      const porcentagens = {
        manha: totalGeral > 0 ? (vendasPorTurno.manha / totalGeral) * 100 : 0,
        tarde: totalGeral > 0 ? (vendasPorTurno.tarde / totalGeral) * 100 : 0,
        noite: totalGeral > 0 ? (vendasPorTurno.noite / totalGeral) * 100 : 0
      };
      
      return NextResponse.json({
        manha: Math.round(porcentagens.manha),
        tarde: Math.round(porcentagens.tarde),
        noite: Math.round(porcentagens.noite),
        total: totalGeral
      });
      
    } catch (err: any) {
      return NextResponse.json({
        manha: 0,
        tarde: 0,
        noite: 0,
        total: 0
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar vendas por turno:', error);
    return NextResponse.json({
      manha: 0,
      tarde: 0,
      noite: 0,
      total: 0
    });
  }
}

