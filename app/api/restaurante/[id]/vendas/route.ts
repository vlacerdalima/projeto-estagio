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
    
    const { filter: dateFilter, params: dateParams } = buildDateFilter(year, month, period, '');
    
    const result = await pool.query(
      `SELECT COUNT(*) as total FROM sales WHERE store_id = $1 ${dateFilter}`,
      [id, ...dateParams]
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

