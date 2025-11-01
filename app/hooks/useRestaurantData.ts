import { useState, useEffect } from 'react';
import type { Period, VendasTurno, TicketMedio, CanalData, ProdutoRanking, ProdutoMaisVendido, ProdutoMaisRemovido, TendenciaVendas, DesvioMedia } from '@/app/types';

interface RestaurantData {
  sales: number | null;
  revenue: number | null;
  produtoMaisVendido: ProdutoMaisVendido | null;
  produtoMaisRemovido: ProdutoMaisRemovido | null;
  vendasTurno: VendasTurno | null;
  ticketMedio: TicketMedio | null;
  vendasCanal: CanalData[];
  tendenciaVendas: TendenciaVendas | null;
  desvioMedia: DesvioMedia | null;
}

export function useRestaurantData(selectedRestaurant: number | null, period: Period, year?: string | number, month?: string | number) {
      const [data, setData] = useState<RestaurantData>({
        sales: null,
        revenue: null,
        produtoMaisVendido: null,
        produtoMaisRemovido: null,
        vendasTurno: null,
        ticketMedio: null,
        vendasCanal: [],
        tendenciaVendas: null,
        desvioMedia: null
      });
  
  const [loading, setLoading] = useState(false);
  const [loadingTicketMedio, setLoadingTicketMedio] = useState(false);
  const [produtosRanking, setProdutosRanking] = useState<ProdutoRanking[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);

  useEffect(() => {
    if (selectedRestaurant) {
      const fetchData = async () => {
        setLoading(true);
        setLoadingTicketMedio(true);
        try {
          const yearParam = year && year !== 'todos' ? `&year=${year}` : '';
          const monthParam = month && month !== 'todos' ? `&month=${month}` : '';
          const params = `period=${period}${yearParam}${monthParam}`;
          
          const [salesRes, revenueRes, produtoRes, produtoRemovidoRes, turnoRes, ticketMedioRes, canalRes, tendenciaRes, desvioMediaRes] = await Promise.all([
            fetch(`/api/restaurante/${selectedRestaurant}/vendas?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/faturamento?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/produto-mais-vendido?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/produto-mais-removido?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/vendas-por-turno?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/ticket-medio?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/vendas-por-canal?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/tendencia-vendas`), // Sem parâmetros - sempre últimos 12 meses
            fetch(`/api/restaurante/${selectedRestaurant}/desvio-media`)
          ]);
          
          const salesData = await salesRes.json();
          const revenueData = await revenueRes.json();
          const produtoData = await produtoRes.json();
          const produtoRemovidoData = await produtoRemovidoRes.json();
          const turnoData = await turnoRes.json();
          const ticketMedioData = await ticketMedioRes.json();
          const canalData = await canalRes.json();
          const tendenciaData = await tendenciaRes.json();
          const desvioMediaData = await desvioMediaRes.json();
          
          setData({
            sales: salesData.total,
            revenue: parseFloat(revenueData.revenue),
            produtoMaisVendido: { nome: produtoData.nome, total: produtoData.total },
            produtoMaisRemovido: { 
              nome: produtoRemovidoData?.nome || null, 
              total: produtoRemovidoData?.total || 0 
            },
            vendasTurno: { manha: turnoData.manha, tarde: turnoData.tarde, noite: turnoData.noite },
            ticketMedio: { ticketMedio: ticketMedioData.ticketMedio, variacao: ticketMedioData.variacao },
            vendasCanal: canalData,
            tendenciaVendas: {
              taxaCrescimento: tendenciaData.taxaCrescimento || 0,
              dadosMensais: tendenciaData.dadosMensais || []
            },
            desvioMedia: {
              semanaAtual: desvioMediaData.semanaAtual || 0,
              mediaHistorica: desvioMediaData.mediaHistorica || 0,
              percentualDesvio: desvioMediaData.percentualDesvio || 0
            }
          });
          setLoading(false);
          setLoadingTicketMedio(false);
        } catch (e) {
          console.error('Erro ao recarregar dados:', e);
          setLoading(false);
          setLoadingTicketMedio(false);
        }
      };
      
      fetchData();
    } else {
      setLoading(false);
      setLoadingTicketMedio(false);
    }
  }, [period, selectedRestaurant, year, month]);

  const fetchRanking = async () => {
    if (selectedRestaurant) {
      setLoadingRanking(true);
      try {
        const yearParam = year && year !== 'todos' ? `&year=${year}` : '';
        const monthParam = month && month !== 'todos' ? `&month=${month}` : '';
        const params = `period=${period}${yearParam}${monthParam}`;
        const response = await fetch(`/api/restaurante/${selectedRestaurant}/produtos-ranking?${params}`);
        const data = await response.json();
        setProdutosRanking(data);
      } catch (e) {
        console.error('Erro ao buscar ranking:', e);
        setProdutosRanking([]);
      } finally {
        setLoadingRanking(false);
      }
    }
  };

  return {
    data,
    loading,
    loadingTicketMedio,
    produtosRanking,
    loadingRanking,
    fetchRanking
  };
}

