import { useState, useEffect } from 'react';
import type { Period, VendasTurno, TicketMedio, CanalData, ProdutoRanking, ProdutoMaisVendido, ProdutoMaisRemovido, TendenciaVendas, DesvioMedia, TempoMedioEntrega, SazonalidadeProdutos, RegiaoEntrega } from '@/app/types';

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
  tempoMedioEntrega: TempoMedioEntrega | null;
  sazonalidadeProdutos: SazonalidadeProdutos | null;
  clientesRecorrentesSumidos: number | null;
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
        desvioMedia: null,
        tempoMedioEntrega: null,
        sazonalidadeProdutos: null,
        clientesRecorrentesSumidos: null
      });
  
  const [loading, setLoading] = useState(false);
  const [loadingTicketMedio, setLoadingTicketMedio] = useState(false);
  const [produtosRanking, setProdutosRanking] = useState<ProdutoRanking[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [regioesEntrega, setRegioesEntrega] = useState<RegiaoEntrega[]>([]);
  const [loadingRegioes, setLoadingRegioes] = useState(false);

  useEffect(() => {
    if (selectedRestaurant) {
      const fetchData = async () => {
        setLoading(true);
        setLoadingTicketMedio(true);
        try {
          const yearParam = year && year !== 'todos' ? `&year=${year}` : '';
          const monthParam = month && month !== 'todos' ? `&month=${month}` : '';
          const params = `period=${period}${yearParam}${monthParam}`;
          
          const [salesRes, revenueRes, produtoRes, produtoRemovidoRes, turnoRes, ticketMedioRes, canalRes, tendenciaRes, desvioMediaRes, tempoMedioEntregaRes, sazonalidadeRes, clientesSumidosRes] = await Promise.all([
            fetch(`/api/restaurante/${selectedRestaurant}/vendas?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/faturamento?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/produto-mais-vendido?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/produto-mais-removido?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/vendas-por-turno?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/ticket-medio?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/vendas-por-canal?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/tendencia-vendas`), // Sem parâmetros - sempre últimos 12 meses
            fetch(`/api/restaurante/${selectedRestaurant}/desvio-media`),
            fetch(`/api/restaurante/${selectedRestaurant}/tempo-medio-entrega?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/sazonalidade-produtos?${params}`),
            fetch(`/api/restaurante/${selectedRestaurant}/clientes-recorrentes-sumidos`)
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
          const tempoMedioEntregaData = await tempoMedioEntregaRes.json();
          const sazonalidadeData = await sazonalidadeRes.json();
          const clientesSumidosData = await clientesSumidosRes.json();
          
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
            },
            tempoMedioEntrega: {
              tempoMedio: tempoMedioEntregaData.tempoMedio,
              variacao: tempoMedioEntregaData.variacao
            },
            sazonalidadeProdutos: sazonalidadeData,
            clientesRecorrentesSumidos: clientesSumidosData.total || 0
          });
          setLoading(false);
          setLoadingTicketMedio(false);
        } catch (e) {
          console.error('Erro ao recarregar dados:', e);
          setData({
            sales: null,
            revenue: null,
            produtoMaisVendido: null,
            produtoMaisRemovido: null,
            vendasTurno: null,
            ticketMedio: null,
            vendasCanal: [],
            tendenciaVendas: null,
            desvioMedia: null,
            tempoMedioEntrega: null,
            sazonalidadeProdutos: null,
            clientesRecorrentesSumidos: null
          });
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

  const fetchRegioes = async (search?: string) => {
    if (selectedRestaurant) {
      setLoadingRegioes(true);
      try {
        const yearParam = year && year !== 'todos' ? `&year=${year}` : '';
        const monthParam = month && month !== 'todos' ? `&month=${month}` : '';
        const searchParam = search && search.trim() !== '' ? `&search=${encodeURIComponent(search.trim())}` : '';
        const params = `period=${period}${yearParam}${monthParam}${searchParam}`;
        const response = await fetch(`/api/restaurante/${selectedRestaurant}/regioes-entrega?${params}`);
        const data = await response.json();
        setRegioesEntrega(data);
      } catch (e) {
        console.error('Erro ao buscar regiões:', e);
        setRegioesEntrega([]);
      } finally {
        setLoadingRegioes(false);
      }
    }
  };

  const refetchTempoMedioEntrega = async (regiao: string = 'todas') => {
    if (selectedRestaurant) {
      try {
        const yearParam = year && year !== 'todos' ? `&year=${year}` : '';
        const monthParam = month && month !== 'todos' ? `&month=${month}` : '';
        const params = `period=${period}${yearParam}${monthParam}&regiao=${regiao}`;
        const response = await fetch(`/api/restaurante/${selectedRestaurant}/tempo-medio-entrega?${params}`);
        const tempoMedioData = await response.json();
        
        setData(prev => ({
          ...prev,
          tempoMedioEntrega: {
            tempoMedio: tempoMedioData.tempoMedio,
            variacao: tempoMedioData.variacao
          }
        }));
      } catch (e) {
        console.error('Erro ao refetch tempo médio:', e);
      }
    }
  };

  return {
    data,
    loading,
    loadingTicketMedio,
    produtosRanking,
    loadingRanking,
    fetchRanking,
    regioesEntrega,
    loadingRegioes,
    fetchRegioes,
    refetchTempoMedioEntrega
  };
}

