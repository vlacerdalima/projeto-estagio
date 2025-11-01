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
    
    // Mock data for now - complex analysis would require significant query logic
    // This would analyze product sales across months to find seasonal patterns
    const mockSazonalidade = {
      produtos: [
        {
          nome: 'Coca-Cola 2L',
          mesPico: 'Jul',
          lift: 142,
          pontosSazonalidade: [80, 90, 95, 100, 110, 120, 242, 140, 105, 100, 95, 88]
        },
        {
          nome: 'Refrigerante Gelado',
          mesPico: 'Dez',
          lift: 98,
          pontosSazonalidade: [70, 75, 80, 85, 90, 95, 110, 100, 90, 100, 198, 120]
        },
        {
          nome: 'Brigadeiro',
          mesPico: 'Jun',
          lift: 85,
          pontosSazonalidade: [60, 65, 70, 75, 80, 185, 90, 85, 80, 75, 70, 65]
        },
        {
          nome: 'Sorvete',
          mesPico: 'Jan',
          lift: 120,
          pontosSazonalidade: [220, 150, 100, 80, 70, 90, 110, 100, 90, 85, 80, 75]
        },
        {
          nome: 'Picanha',
          mesPico: 'Dom',
          lift: 75,
          pontosSazonalidade: [100, 105, 110, 115, 120, 125, 175, 100, 105, 110, 115, 120]
        }
      ]
    };
    
    // TODO: Implement real query logic
    // This would require:
    // 1. Grouping sales by product and month
    // 2. Calculating baseline (average of other months)
    // 3. Calculating lift = (month_sales / baseline) - 1
    // 4. Filtering products with lift >= 0.8 (80%) and minimum volume
    // 5. Returning top 3-5 products
    
    return NextResponse.json(mockSazonalidade);
    
  } catch (error) {
    console.error('❌ Erro ao buscar sazonalidade de produtos:', error);
    return NextResponse.json({
      produtos: []
    });
  }
}

