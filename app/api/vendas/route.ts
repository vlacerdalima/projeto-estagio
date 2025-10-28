import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Query para contar o total de vendas
    const result = await pool.query('SELECT COUNT(*) as total FROM sales');
    const totalVendas = result.rows[0].total;
    
    return NextResponse.json({ total: parseInt(totalVendas) });
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar vendas' },
      { status: 500 }
    );
  }
}

