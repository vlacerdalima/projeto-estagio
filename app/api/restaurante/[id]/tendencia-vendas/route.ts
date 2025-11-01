import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Sempre buscar os últimos 12 meses da vida real, independente do período selecionado
    // O card de tendência deve mostrar sempre o histórico real, não filtrar por período
    const query = `
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
    
    const result = await pool.query(query, [id]);
    
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

