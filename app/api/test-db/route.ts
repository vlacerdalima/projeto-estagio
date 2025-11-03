import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Testar conexão fazendo uma query simples
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    
    return NextResponse.json({
      success: true,
      message: 'Conexão com banco de dados estabelecida com sucesso!',
      data: {
        currentTime: result.rows[0].current_time,
        dbVersion: result.rows[0].db_version,
      }
    });
  } catch (error) {
    console.error('Erro ao conectar com banco de dados:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao conectar com banco de dados',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

