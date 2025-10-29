'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RestaurantSearch from "@/components/RestaurantSearch";
import PeriodSelector from "@/components/PeriodSelector";
import SalesByShiftChart from "@/components/SalesByShiftChart";

interface Position {
  x: number;
  y: number;
}

type Period = 'mensal' | 'anual';

interface VendasTurno {
  manha: number;
  tarde: number;
  noite: number;
}

interface ProdutoRanking {
  nome: string;
  total: number;
}

export default function Home() {
  const [sales, setSales] = useState<number | null>(null);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [produtoMaisVendido, setProdutoMaisVendido] = useState<{ nome: string | null; total: number } | null>(null);
  const [vendasTurno, setVendasTurno] = useState<VendasTurno | null>(null);
  const [period, setPeriod] = useState<Period>('anual');
  const [showRanking, setShowRanking] = useState(false);
  const [produtosRanking, setProdutosRanking] = useState<ProdutoRanking[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  
  const [salesPosition, setSalesPosition] = useState<Position>({ x: 0, y: 0 });
  const [revenuePosition, setRevenuePosition] = useState<Position>({ x: 0, y: 0 });
  const [produtoPosition, setProdutoPosition] = useState<Position>({ x: 0, y: 0 });
  const [turnoPosition, setTurnoPosition] = useState<Position>({ x: 0, y: 0 });
  
  const [isDragging, setIsDragging] = useState<'sales' | 'revenue' | 'produto' | 'turno' | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  
  // Estado para controlar quais cards estão visíveis
  const [visibleCards, setVisibleCards] = useState({
    sales: true,
    revenue: true,
    produto: true,
    turno: true
  });
  
  const [showCardsDropdown, setShowCardsDropdown] = useState(false);

  // Recarregar dados quando o período mudar
  useEffect(() => {
    if (selectedRestaurant) {
      const fetchData = async () => {
        try {
          const [salesRes, revenueRes, produtoRes, turnoRes] = await Promise.all([
            fetch(`/api/restaurante/${selectedRestaurant}/vendas?period=${period}`),
            fetch(`/api/restaurante/${selectedRestaurant}/faturamento?period=${period}`),
            fetch(`/api/restaurante/${selectedRestaurant}/produto-mais-vendido?period=${period}`),
            fetch(`/api/restaurante/${selectedRestaurant}/vendas-por-turno?period=${period}`)
          ]);
          
          const salesData = await salesRes.json();
          const revenueData = await revenueRes.json();
          const produtoData = await produtoRes.json();
          const turnoData = await turnoRes.json();
          
          setSales(salesData.total);
          setRevenue(parseFloat(revenueData.revenue));
          setProdutoMaisVendido({ nome: produtoData.nome, total: produtoData.total });
          setVendasTurno({ manha: turnoData.manha, tarde: turnoData.tarde, noite: turnoData.noite });
          
          // Se o ranking estiver aberto, atualizar os dados
          if (showRanking) {
            setLoadingRanking(true);
            try {
              const rankingRes = await fetch(`/api/restaurante/${selectedRestaurant}/produtos-ranking?period=${period}`);
              const rankingData = await rankingRes.json();
              setProdutosRanking(rankingData);
            } catch (e) {
              console.error('Erro ao atualizar ranking:', e);
              setProdutosRanking([]);
            } finally {
              setLoadingRanking(false);
            }
          }
        } catch (e) {
          console.error('Erro ao recarregar dados:', e);
        }
      };
      
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  function handleSelect(
    salesVal: number | null, 
    revenueVal: number | null, 
    produto: { nome: string | null; total: number } | null,
    turno: { manha: number; tarde: number; noite: number } | null,
    restaurantId: number
  ) {
    setSales(salesVal);
    setRevenue(revenueVal);
    setProdutoMaisVendido(produto);
    setVendasTurno(turno);
    setSelectedRestaurant(restaurantId);
    // Reset das posições quando trocar de restaurante
    setSalesPosition({ x: 0, y: 0 });
    setRevenuePosition({ x: 0, y: 0 });
    setProdutoPosition({ x: 0, y: 0 });
    setTurnoPosition({ x: 0, y: 0 });
    // Reset do ranking
    setShowRanking(false);
    setProdutosRanking([]);
    setLoadingRanking(false);
  }

  // Funções para gerenciar visibilidade dos cards
  const removeCard = (cardType: 'sales' | 'revenue' | 'produto' | 'turno') => {
    setVisibleCards(prev => ({ ...prev, [cardType]: false }));
  };

  const addCard = (cardType: 'sales' | 'revenue' | 'produto' | 'turno') => {
    setVisibleCards(prev => ({ ...prev, [cardType]: true }));
    setShowCardsDropdown(false);
  };

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

  const toggleRanking = () => {
    if (!showRanking) {
      fetchRanking();
    }
    setShowRanking(!showRanking);
  };

  const handleMouseDown = (type: 'sales' | 'revenue' | 'produto' | 'turno', e: React.MouseEvent) => {
    // Verificar se o clique foi no botão de deletar
    const target = e.target as HTMLElement;
    if (target.classList.contains('delete-button')) {
      e.stopPropagation();
      removeCard(type);
      return;
    }
    
    if (e.button !== 0) return; // Apenas botão esquerdo do mouse
    e.preventDefault();
    
    setIsDragging(type);
    
    // Captura a posição atual do card e do mouse
    const currentPosition = 
      type === 'sales' ? salesPosition : 
      type === 'revenue' ? revenuePosition :
      type === 'produto' ? produtoPosition :
      turnoPosition;
    
    const mouseStartX = e.clientX;
    const mouseStartY = e.clientY;
    
    // Calcula o offset (distância entre o ponto de clique e a origem do card)
    const offsetX = mouseStartX - currentPosition.x;
    const offsetY = mouseStartY - currentPosition.y;

    const handleMouseMove = (e: MouseEvent) => {
      // Nova posição = posição do mouse - offset inicial
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;

      if (type === 'sales') {
        setSalesPosition({ x: newX, y: newY });
      } else if (type === 'revenue') {
        setRevenuePosition({ x: newX, y: newY });
      } else if (type === 'produto') {
        setProdutoPosition({ x: newX, y: newY });
      } else if (type === 'turno') {
        setTurnoPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
		<div className="min-h-screen w-full bg-white relative">
			<main className="flex flex-col gap-6 px-20 py-8">
				{/* Linha superior: Restaurante (esquerda) e Período (direita) - SEM CARDS */}
				<div className="flex justify-between items-center w-full">
					<div className="flex items-center gap-3">
						<span className="text-sm text-zinc-700">restaurante</span>
						<RestaurantSearch onSelect={handleSelect} period={period} />
					</div>
					<div className="flex items-center gap-3">
						{/* Botão Cards com dropdown */}
						<div className="relative">
							<button
								onClick={() => setShowCardsDropdown(!showCardsDropdown)}
								className="px-3 py-1 bg-[#fa8072] text-white rounded-md text-sm font-medium hover:bg-[#fa8072]/90 transition-colors shadow-sm"
							>
								cards
							</button>
							{showCardsDropdown && (
								<div className="absolute right-0 mt-2 bg-white border border-[--color-primary]/30 rounded-md shadow-lg z-50 p-2 w-48">
								{!visibleCards.sales && (
									<button
										onClick={() => addCard('sales')}
										className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-zinc-900"
									>
										Vendas
									</button>
								)}
								{!visibleCards.revenue && (
									<button
										onClick={() => addCard('revenue')}
										className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-zinc-900"
									>
										Faturamento
									</button>
								)}
								{!visibleCards.produto && (
									<button
										onClick={() => addCard('produto')}
										className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-zinc-900"
									>
										Produto Mais Vendido
									</button>
								)}
								{!visibleCards.turno && (
									<button
										onClick={() => addCard('turno')}
										className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-zinc-900"
									>
										Vendas por Turno
									</button>
								)}
									{(visibleCards.sales && visibleCards.revenue && visibleCards.produto && visibleCards.turno) && (
										<div className="px-3 py-2 text-sm text-zinc-400 text-center">Todos os cards estão visíveis</div>
									)}
								</div>
							)}
						</div>
						<span className="text-sm text-zinc-700">período</span>
						<PeriodSelector selected={period} onSelect={setPeriod} />
					</div>
				</div>

				{/* Cards arrastáveis em grid 2x3 */}
				{(sales !== null || revenue !== null || produtoMaisVendido || vendasTurno) && (
					<div className="grid grid-cols-3 gap-6 w-full">
						{/* Card 1: Vendas */}
						{visibleCards.sales && (
							<Card 
								data-card-type="sales"
								className="border-[--color-primary]/30 p-6 cursor-move select-none transition-none relative"
								style={{ 
									transform: `translate(${salesPosition.x}px, ${salesPosition.y}px)`,
									zIndex: isDragging === 'sales' ? 1000 : 1
								}}
								onMouseDown={(e) => handleMouseDown('sales', e)}
							>
								<button
									onClick={() => removeCard('sales')}
									className="delete-button absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
								>
									✕
								</button>
								<div className="text-sm font-medium text-[--color-muted-foreground] mb-2">
									Vendas {period === 'mensal' ? 'do mês' : 'no ano'}
								</div>
								<div className="text-3xl font-semibold text-[--color-primary]">{sales?.toLocaleString() || '—'}</div>
							</Card>
						)}
						
						{/* Card 2: Faturamento */}
						{visibleCards.revenue && (
							<Card 
								data-card-type="revenue"
								className="border-[--color-primary]/30 p-6 cursor-move select-none transition-none relative"
								style={{ 
									transform: `translate(${revenuePosition.x}px, ${revenuePosition.y}px)`,
									zIndex: isDragging === 'revenue' ? 1000 : 1
								}}
								onMouseDown={(e) => handleMouseDown('revenue', e)}
							>
								<button
									onClick={() => removeCard('revenue')}
									className="delete-button absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
								>
									✕
								</button>
								<div className="text-sm font-medium text-[--color-muted-foreground] mb-2">
									Faturamento {period === 'mensal' ? 'do mês' : 'anual'}
								</div>
								<div className="text-3xl font-semibold text-[--color-primary]">
									{revenue ? `R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
								</div>
							</Card>
						)}
						
						{/* Card 3: Produto Mais Vendido */}
						{visibleCards.produto && (
							<Card 
								data-card-type="produto"
								className="border-[--color-primary]/30 p-6 cursor-move select-none transition-none relative"
								style={{ 
									transform: `translate(${produtoPosition.x}px, ${produtoPosition.y}px)`,
									zIndex: isDragging === 'produto' ? 1000 : 1
								}}
								onMouseDown={(e) => handleMouseDown('produto', e)}
							>
								<button
									onClick={() => removeCard('produto')}
									className="delete-button absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
								>
									✕
								</button>
								<div className="text-sm font-medium text-[--color-muted-foreground] mb-2">Produto Mais Vendido</div>
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1">
										<div className="text-lg font-semibold text-[--color-primary] mb-1">
											{produtoMaisVendido?.nome || '—'}
										</div>
										<div className="text-sm text-[--color-muted-foreground]">
											{produtoMaisVendido?.total ? `${produtoMaisVendido.total} unidades` : ''}
										</div>
									</div>
									<button
										onClick={(e) => {
											e.stopPropagation();
											toggleRanking();
										}}
										className="flex items-center justify-center w-6 h-6 text-zinc-400 hover:text-[#fa8072] transition-colors"
										title="Ver ranking completo"
									>
										{showRanking ? '▼' : '▶'}
									</button>
								</div>
								{showRanking && (
									<div className="mt-4 border-t border-zinc-200 pt-4">
										<div className="text-xs font-medium text-[--color-muted-foreground] mb-2">Ranking Completo</div>
										<div className="max-h-48 overflow-y-auto space-y-1">
											{loadingRanking ? (
												<div className="text-xs text-zinc-400 text-center py-4">
													Carregando dados...
												</div>
											) : produtosRanking.length > 0 ? (
												produtosRanking.map((produto, index) => (
													<div key={index} className="flex justify-between items-center text-sm py-1">
														<div className="flex items-center gap-2">
															<span className="text-xs text-zinc-400 w-5">{index + 1}.</span>
															<span className="font-medium text-zinc-700">{produto.nome}</span>
														</div>
														<span className="text-[--color-primary] font-semibold">{produto.total}</span>
													</div>
												))
											) : (
												<div className="text-xs text-zinc-400 text-center py-2">
													Sem dados disponíveis
												</div>
											)}
										</div>
									</div>
								)}
							</Card>
						)}
						
						{/* Card 4: Vendas por Turno */}
						{visibleCards.turno && (
							<Card 
								data-card-type="turno"
								className="border-[--color-primary]/30 p-6 cursor-move select-none transition-none relative"
								style={{ 
									transform: `translate(${turnoPosition.x}px, ${turnoPosition.y}px)`,
									zIndex: isDragging === 'turno' ? 1000 : 1
								}}
								onMouseDown={(e) => handleMouseDown('turno', e)}
							>
								<button
									onClick={() => removeCard('turno')}
									className="delete-button absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
								>
									✕
								</button>
								{vendasTurno ? (
									<SalesByShiftChart 
										manha={vendasTurno.manha}
										tarde={vendasTurno.tarde}
										noite={vendasTurno.noite}
									/>
								) : (
									<div className="text-sm text-zinc-400 text-center">
										Carregando vendas por turno...
									</div>
								)}
							</Card>
						)}
						
						{/* Espaços vazios para completar grid 2x3 */}
						<div></div>
						<div></div>
					</div>
				)}
			</main>
			
			<footer className="pointer-events-none absolute bottom-4 right-6 text-right leading-5">
				<div className="text-[10px] sm:text-xs font-medium tracking-wide text-[--color-primary]">desafio técnico</div>
				<div className="text-[10px] sm:text-xs text-zinc-500">feito por Vitor Lacerda</div>
			</footer>
		</div>
  );
}
