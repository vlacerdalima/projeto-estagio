import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Query direta sem autenticação para testar
    const result = await pool.query('SELECT id, name FROM stores ORDER BY name LIMIT 10');
    
    return NextResponse.json({
      success: true,
      count: result.rows.length,
      restaurants: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar restaurantes:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar restaurantes',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

