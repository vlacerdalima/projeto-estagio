import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, name FROM stores ORDER BY name'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar restaurantes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar restaurantes' },
      { status: 500 }
    );
  }
}

