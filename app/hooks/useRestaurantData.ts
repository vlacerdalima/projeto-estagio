import { useState, useEffect } from 'react';
import type { Period, VendasTurno, TicketMedio, CanalData, ProdutoRanking, ProdutoMaisVendido } from '@/app/types';

interface RestaurantData {
  sales: number | null;
  revenue: number | null;
  produtoMaisVendido: ProdutoMaisVendido | null;
  vendasTurno: VendasTurno | null;
  ticketMedio: TicketMedio | null;
  vendasCanal: CanalData[];
}

export function useRestaurantData(selectedRestaurant: number | null, period: Period) {
  const [data, setData] = useState<RestaurantData>({
    sales: null,
    revenue: null,
    produtoMaisVendido: null,
    vendasTurno: null,
    ticketMedio: null,
    vendasCanal: []
  });
  
  const [loadingTicketMedio, setLoadingTicketMedio] = useState(false);
  const [produtosRanking, setProdutosRanking] = useState<ProdutoRanking[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);

  useEffect(() => {
    if (selectedRestaurant) {
      const fetchData = async () => {
        setLoadingTicketMedio(true);
        try {
          const [salesRes, revenueRes, produtoRes, turnoRes, ticketMedioRes, canalRes] = await Promise.all([
            fetch(`/api/restaurante/${selectedRestaurant}/vendas?period=${period}`),
            fetch(`/api/restaurante/${selectedRestaurant}/faturamento?period=${period}`),
            fetch(`/api/restaurante/${selectedRestaurant}/produto-mais-vendido?period=${period}`),
            fetch(`/api/restaurante/${selectedRestaurant}/vendas-por-turno?period=${period}`),
            fetch(`/api/restaurante/${selectedRestaurant}/ticket-medio?period=${period}`),
            fetch(`/api/restaurante/${selectedRestaurant}/vendas-por-canal?period=${period}`)
          ]);
          
          const salesData = await salesRes.json();
          const revenueData = await revenueRes.json();
          const produtoData = await produtoRes.json();
          const turnoData = await turnoRes.json();
          const ticketMedioData = await ticketMedioRes.json();
          const canalData = await canalRes.json();
          
          setData({
            sales: salesData.total,
            revenue: parseFloat(revenueData.revenue),
            produtoMaisVendido: { nome: produtoData.nome, total: produtoData.total },
            vendasTurno: { manha: turnoData.manha, tarde: turnoData.tarde, noite: turnoData.noite },
            ticketMedio: { ticketMedio: ticketMedioData.ticketMedio, variacao: ticketMedioData.variacao },
            vendasCanal: canalData
          });
          setLoadingTicketMedio(false);
        } catch (e) {
          console.error('Erro ao recarregar dados:', e);
          setLoadingTicketMedio(false);
        }
      };
      
      fetchData();
    }
  }, [period, selectedRestaurant]);

  const fetchRanking = async () => {
    if (selectedRestaurant) {
      setLoadingRanking(true);
      try {
        const response = await fetch(`/api/restaurante/${selectedRestaurant}/produtos-ranking?period=${period}`);
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
    loadingTicketMedio,
    produtosRanking,
    loadingRanking,
    fetchRanking
  };
}

