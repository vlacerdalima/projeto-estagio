import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'anual';
    
    const filterClause = period === 'mensal' ? "AND s.created_at >= NOW() - INTERVAL '30 days'" : '';
    
    // Query usando a coluna channel_id da tabela sales
    // Primeiro tenta buscar com JOIN na tabela channels
    let result;
    try {
      const sql1 = `SELECT 
                       COALESCE(c.name, 'Não especificado') as canal,
                       COUNT(DISTINCT s.id) as quantidade,
                       COALESCE(SUM(p.value), 0) as receita
                     FROM sales s 
                     LEFT JOIN payments p ON s.id = p.sale_id 
                     LEFT JOIN channels c ON s.channel_id = c.id
                     WHERE s.store_id = $1 ${filterClause}
                     GROUP BY c.name
                     ORDER BY receita DESC`;
      
      result = await pool.query(sql1, [id]);
      console.log('✅ Query com JOIN em channels funcionou');
    } catch (err: any) {
      console.log('⚠️ Query com JOIN falhou, tentando sem JOIN:', err.message);
      
      // Fallback: usar channel_id diretamente
      const sql2 = `SELECT 
                      s.channel_id as canal,
                      COUNT(DISTINCT s.id) as quantidade,
                      COALESCE(SUM(p.value), 0) as receita
                    FROM sales s 
                    LEFT JOIN payments p ON s.id = p.sale_id 
                    WHERE s.store_id = $1 ${filterClause}
                    GROUP BY s.channel_id
                    ORDER BY receita DESC`;
      
      result = await pool.query(sql2, [id]);
      console.log('✅ Query sem JOIN funcionou');
    }
    
    // Log para debug
    console.log('📊 Vendas por canal - Resultado:', result.rows);
    
    if (result.rows.length > 0) {
      const totalGeral = result.rows.reduce((sum, row) => sum + parseFloat(row.receita), 0);
      
      // Mapear IDs de canal para nomes se necessário
      const canaisMap: { [key: number]: string } = {
        1: 'Presencial',
        2: 'Delivery',
        3: 'iFood',
        4: 'Rappi',
        5: 'WhatsApp',
        6: 'App Próprio'
      };
      
      const canais = result.rows.map(row => {
        let nomeCanal = row.canal;
        
        // Se canal é um número (ID), converter para nome
        if (typeof nomeCanal === 'number') {
          nomeCanal = canaisMap[nomeCanal] || `Canal ${nomeCanal}`;
        }
        
        return {
          nome: nomeCanal || 'Não especificado',
          quantidade: parseInt(row.quantidade),
          receita: parseFloat(row.receita),
          percentual: totalGeral > 0 ? (parseFloat(row.receita) / totalGeral) * 100 : 0
        };
      });
      
      console.log('📊 Canais processados:', canais);
      return NextResponse.json(canais);
    }
    
    console.log('⚠️ Nenhum dado encontrado para vendas por canal');
    return NextResponse.json([]);
    
  } catch (error) {
    console.error('❌ Erro ao buscar vendas por canal:', error);
    return NextResponse.json([]);
  }
}

