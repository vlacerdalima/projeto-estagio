import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    
    if (!idsParam) {
      return NextResponse.json(
        { years: [], monthsByYear: {} },
        { status: 400 }
      );
    }
    
    const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (ids.length === 0) {
      return NextResponse.json(
        { years: [], monthsByYear: {} },
        { status: 400 }
      );
    }
    
    // Buscar anos únicos que têm vendas para todos os restaurantes especificados
    const yearsResult = await pool.query(
      `SELECT DISTINCT EXTRACT(YEAR FROM created_at)::integer as year
       FROM sales
       WHERE store_id = ANY($1)
       GROUP BY EXTRACT(YEAR FROM created_at)
       HAVING COUNT(DISTINCT store_id) = $2
       ORDER BY year DESC`,
      [ids, ids.length]
    );
    
    const years = yearsResult.rows.map(row => row.year);
    
    // Buscar meses únicos que têm vendas para todos os restaurantes especificados
    const monthsResult = await pool.query(
      `SELECT DISTINCT 
         EXTRACT(MONTH FROM created_at)::integer as month,
         EXTRACT(YEAR FROM created_at)::integer as year
       FROM sales
       WHERE store_id = ANY($1)
       GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
       HAVING COUNT(DISTINCT store_id) = $2
       ORDER BY year DESC, month DESC`,
      [ids, ids.length]
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

