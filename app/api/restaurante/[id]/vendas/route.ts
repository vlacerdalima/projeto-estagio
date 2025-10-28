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
    
    // Determinar o filtro de data baseado no período
    let dateFilter = '';
    if (period === 'mensal') {
      dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
    }
    
    const result = await pool.query(
      `SELECT COUNT(*) as total FROM sales WHERE store_id = $1 ${dateFilter}`,
      [id]
    );
    return NextResponse.json({ total: parseInt(result.rows[0].total) });
  } catch (error) {
    console.error('Erro ao buscar vendas do restaurante:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar vendas' },
      { status: 500 }
    );
  }
}

