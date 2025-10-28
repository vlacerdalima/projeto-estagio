import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query(
      'SELECT COUNT(*) as total FROM sales WHERE store_id = $1',
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

