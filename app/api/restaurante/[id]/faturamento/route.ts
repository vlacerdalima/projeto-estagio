import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query(
      `SELECT COALESCE(SUM(p.value), 0) as revenue 
       FROM sales s 
       JOIN payments p ON s.id = p.sale_id 
       WHERE s.store_id = $1`,
      [id]
    );
    return NextResponse.json({ revenue: parseFloat(result.rows[0].revenue) });
  } catch (error) {
    console.error('Erro ao buscar faturamento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar faturamento' },
      { status: 500 }
    );
  }
}

