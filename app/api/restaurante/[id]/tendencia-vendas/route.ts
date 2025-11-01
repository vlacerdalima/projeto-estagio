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
    
    // Buscar vendas mensais dos últimos 12 meses (ou período disponível)
    // Se não houver filtro específico, busca últimos 12 meses
    // Se houver filtro de ano/mês, busca os meses do ano selecionado
    
    let query = '';
    let queryParams: any[] = [];
    
    if (year && year !== 'todos' && month && month !== 'todos') {
      // Filtro específico: apenas o mês/ano selecionado
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59);
      
      query = `
        SELECT 
          EXTRACT(YEAR FROM created_at)::integer as ano,
          EXTRACT(MONTH FROM created_at)::integer as mes,
          COUNT(*)::integer as vendas
        FROM sales
        WHERE store_id = $1 
        AND created_at >= $2 
        AND created_at <= $3
        GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
        ORDER BY ano ASC, mes ASC
      `;
      queryParams = [id, startDate, endDate];
    } else if (year && year !== 'todos') {
      // Filtro por ano: busca todos os meses do ano
      const startDate = new Date(parseInt(year as string), 0, 1);
      const endDate = new Date(parseInt(year as string), 11, 31, 23, 59, 59);
      
      query = `
        SELECT 
          EXTRACT(YEAR FROM created_at)::integer as ano,
          EXTRACT(MONTH FROM created_at)::integer as mes,
          COUNT(*)::integer as vendas
        FROM sales
        WHERE store_id = $1 
        AND created_at >= $2 
        AND created_at <= $3
        GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
        ORDER BY ano ASC, mes ASC
      `;
      queryParams = [id, startDate, endDate];
    } else {
      // Sem filtro específico: busca últimos 12 meses
      query = `
        SELECT 
          EXTRACT(YEAR FROM created_at)::integer as ano,
          EXTRACT(MONTH FROM created_at)::integer as mes,
          COUNT(*)::integer as vendas
        FROM sales
        WHERE store_id = $1 
        AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
        ORDER BY ano ASC, mes ASC
      `;
      queryParams = [id];
    }
    
    const result = await pool.query(query, queryParams);
    
    const dadosMensais = result.rows.map((row: any) => ({
      mes: row.mes,
      ano: row.ano,
      vendas: row.vendas
    }));
    
    // Calcular taxa de crescimento mensal
    // Fórmula: média da taxa de crescimento entre meses consecutivos
    let taxaCrescimento = 0;
    
    if (dadosMensais.length >= 2) {
      // Calcular crescimento percentual entre cada par de meses consecutivos
      const taxas: number[] = [];
      
      for (let i = 1; i < dadosMensais.length; i++) {
        const vendasAnterior = dadosMensais[i - 1].vendas;
        const vendasAtual = dadosMensais[i].vendas;
        
        if (vendasAnterior > 0) {
          const taxa = ((vendasAtual - vendasAnterior) / vendasAnterior) * 100;
          taxas.push(taxa);
        }
      }
      
      // Média das taxas (ou média simples se houver poucos dados)
      if (taxas.length > 0) {
        taxaCrescimento = taxas.reduce((sum, t) => sum + t, 0) / taxas.length;
      }
    }
    
    return NextResponse.json({
      taxaCrescimento: Math.round(taxaCrescimento * 10) / 10, // Arredondar para 1 casa decimal
      dadosMensais
    });
  } catch (error) {
    console.error('❌ Erro ao buscar tendência de vendas:', error);
    return NextResponse.json({
      taxaCrescimento: 0,
      dadosMensais: []
    });
  }
}

