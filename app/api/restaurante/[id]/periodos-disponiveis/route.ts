import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Buscar anos únicos que têm vendas para este restaurante
    const yearsResult = await pool.query(
      `SELECT DISTINCT EXTRACT(YEAR FROM created_at)::integer as year
       FROM sales
       WHERE store_id = $1
       ORDER BY year DESC`,
      [id]
    );
    
    const years = yearsResult.rows.map(row => row.year);
    
    // Buscar meses únicos que têm vendas para este restaurante
    const monthsResult = await pool.query(
      `SELECT DISTINCT 
         EXTRACT(MONTH FROM created_at)::integer as month,
         EXTRACT(YEAR FROM created_at)::integer as year
       FROM sales
       WHERE store_id = $1
       ORDER BY year DESC, month DESC`,
      [id]
    );
    
    // Agrupar meses por ano
    const monthsByYear: Record<number, number[]> = {};
    monthsResult.rows.forEach(row => {
      const year = row.year;
      const month = row.month;
      if (!monthsByYear[year]) {
        monthsByYear[year] = [];
      }
      if (!monthsByYear[year].includes(month)) {
        monthsByYear[year].push(month);
      }
    });
    
    // Ordenar meses dentro de cada ano
    Object.keys(monthsByYear).forEach(year => {
      monthsByYear[parseInt(year)].sort((a, b) => a - b);
    });
    
    return NextResponse.json({
      years,
      monthsByYear
    });
  } catch (error) {
    console.error('Erro ao buscar períodos disponíveis:', error);
    return NextResponse.json(
      { years: [], monthsByYear: {} },
      { status: 500 }
    );
  }
}

