'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RestaurantSearch from "@/components/RestaurantSearch";
import PeriodSelector from "@/components/PeriodSelector";
import SalesByShiftChart from "@/components/SalesByShiftChart";
import VendasPorCanalChart from "@/components/VendasPorCanalChart";

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

interface TicketMedio {
  ticketMedio: number;
  variacao: number;
}

interface CanalData {
  nome: string;
  quantidade: number;
  receita: number;
  percentual: number;
}

export default function Home() {
  const [sales, setSales] = useState<number | null>(null);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [produtoMaisVendido, setProdutoMaisVendido] = useState<{ nome: string | null; total: number } | null>(null);
  const [vendasTurno, setVendasTurno] = useState<VendasTurno | null>(null);
  const [ticketMedio, setTicketMedio] = useState<TicketMedio | null>(null);
  const [vendasCanal, setVendasCanal] = useState<CanalData[]>([]);
  const [period, setPeriod] = useState<Period>('anual');
  const [showRanking, setShowRanking] = useState(false);
  const [produtosRanking, setProdutosRanking] = useState<ProdutoRanking[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [loadingTicketMedio, setLoadingTicketMedio] = useState(false);
  
  const [salesPosition, setSalesPosition] = useState<Position>({ x: 0, y: 0 });
  const [revenuePosition, setRevenuePosition] = useState<Position>({ x: 0, y: 0 });
  const [produtoPosition, setProdutoPosition] = useState<Position>({ x: 0, y: 0 });
  const [turnoPosition, setTurnoPosition] = useState<Position>({ x: 0, y: 0 });
  const [ticketMedioPosition, setTicketMedioPosition] = useState<Position>({ x: 0, y: 0 });
  const [canalPosition, setCanalPosition] = useState<Position>({ x: 0, y: 0 });
  
  const [isDragging, setIsDragging] = useState<'sales' | 'revenue' | 'produto' | 'turno' | 'ticketMedio' | 'canal' | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  
  // Refs para medir dimensões dos cards
  const salesRef = useRef<HTMLDivElement>(null);
  const revenueRef = useRef<HTMLDivElement>(null);
  const produtoRef = useRef<HTMLDivElement>(null);
  const turnoRef = useRef<HTMLDivElement>(null);
  const ticketMedioRef = useRef<HTMLDivElement>(null);
  const canalRef = useRef<HTMLDivElement>(null);
  
  // Estado para controlar quais cards estão visíveis
  const [visibleCards, setVisibleCards] = useState({
    sales: true,
    revenue: true,
    produto: true,
    turno: true,
    ticketMedio: true,
    canal: true
  });
  
  const [showCardsDropdown, setShowCardsDropdown] = useState(false);

  // Recarregar dados quando o período mudar
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
          
          setSales(salesData.total);
          setRevenue(parseFloat(revenueData.revenue));
          setProdutoMaisVendido({ nome: produtoData.nome, total: produtoData.total });
          setVendasTurno({ manha: turnoData.manha, tarde: turnoData.tarde, noite: turnoData.noite });
          setTicketMedio({ ticketMedio: ticketMedioData.ticketMedio, variacao: ticketMedioData.variacao });
          setVendasCanal(canalData);
          setLoadingTicketMedio(false);
          
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
          setLoadingTicketMedio(false);
        }
      };
      
      fetchData();
    }
  }, [period, selectedRestaurant]);

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
    setTicketMedioPosition({ x: 0, y: 0 });
    setCanalPosition({ x: 0, y: 0 });
    // Reset do ranking
    setShowRanking(false);
    setProdutosRanking([]);
    setLoadingRanking(false);
  }

  // Funções para gerenciar visibilidade dos cards
  const removeCard = (cardType: 'sales' | 'revenue' | 'produto' | 'turno' | 'ticketMedio' | 'canal') => {
    setVisibleCards(prev => ({ ...prev, [cardType]: false }));
  };

  const addCard = (cardType: 'sales' | 'revenue' | 'produto' | 'turno' | 'ticketMedio' | 'canal') => {
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

  const handleMouseDown = (type: 'sales' | 'revenue' | 'produto' | 'turno' | 'ticketMedio' | 'canal', e: React.MouseEvent) => {
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
      type === 'turno' ? turnoPosition :
      type === 'ticketMedio' ? ticketMedioPosition :
      canalPosition;
    
    const mouseStartX = e.clientX;
    const mouseStartY = e.clientY;
    
    // Calcula o offset (distância entre o ponto de clique e a origem do card)
    const offsetX = mouseStartX - currentPosition.x;
    const offsetY = mouseStartY - currentPosition.y;
    
    // Capturar dimensões originais do card
    const cardRef = 
      type === 'sales' ? salesRef.current : 
      type === 'revenue' ? revenueRef.current :
      type === 'produto' ? produtoRef.current :
      type === 'turno' ? turnoRef.current :
      type === 'ticketMedio' ? ticketMedioRef.current :
      canalRef.current;
    
    if (!cardRef) return;
    
    // Armazenar a posição inicial do card no grid (sem transform)
    const cardRect = cardRef.getBoundingClientRect();
    const cardLeft = cardRect.left;
    const cardWidth = cardRect.width;

    const handleMouseMove = (e: MouseEvent) => {
      // Nova posição = posição do mouse - offset inicial
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;

      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      
      // Calcular a posição da linha divisória
      const gridContainer = document.querySelector('.grid');
      if (!gridContainer) return;
      
      const gridRect = gridContainer.getBoundingClientRect();
      const lineY = gridRect.top; // A linha divisória está logo acima do grid
      
      // Limitar o movimento vertical
      let constrainedY = newY;
      
      // Calcular onde o topo do card estaria após o movimento
      const cardTopAfterTranslate = cardRect.top + (newY - currentPosition.y);
      
      // O topo do card não pode ultrapassar a linha divisória
      if (cardTopAfterTranslate < lineY) {
        constrainedY = currentPosition.y - (cardRect.top - lineY);
      }
      
      // Limitar o movimento vertical para baixo: card não pode sair pela parte inferior da janela
      const cardBottomAfterTranslate = cardRect.bottom + (newY - currentPosition.y);
      if (cardBottomAfterTranslate > windowHeight) {
        constrainedY = currentPosition.y + (windowHeight - cardRect.bottom);
      }
      
      // Calcular onde o card estaria (cardLeft é a posição original sem transform)
      const newCardLeft = cardLeft + (newX - currentPosition.x);
      const newCardRight = newCardLeft + cardWidth;
      
      // Calcular o constrangedor X
      let constrainedX = newX;
      
      // Limitar pela esquerda (borda esquerda pode ir até 0)
      if (newCardLeft < 0) {
        constrainedX = currentPosition.x - cardLeft;
      }
      // Limitar pela direita (borda direita pode ir até windowWidth)
      else if (newCardRight > windowWidth) {
        constrainedX = currentPosition.x + (windowWidth - (cardLeft + cardWidth));
      }

      if (type === 'sales') {
        setSalesPosition({ x: constrainedX, y: constrainedY });
      } else if (type === 'revenue') {
        setRevenuePosition({ x: constrainedX, y: constrainedY });
      } else if (type === 'produto') {
        setProdutoPosition({ x: constrainedX, y: constrainedY });
      } else if (type === 'turno') {
        setTurnoPosition({ x: constrainedX, y: constrainedY });
      } else if (type === 'ticketMedio') {
        setTicketMedioPosition({ x: constrainedX, y: constrainedY });
      } else if (type === 'canal') {
        setCanalPosition({ x: constrainedX, y: constrainedY });
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
		<div 
			className="min-h-screen w-full bg-white relative"
			style={{
				backgroundImage: 'url("/simbolo_nola.png")',
				backgroundRepeat: 'no-repeat',
				backgroundPosition: 'center center',
				backgroundSize: '150px 150px',
				backgroundAttachment: 'fixed'
			}}
		>
			<main className="flex flex-col px-20 py-4">
				{/* Linha superior: Restaurante (esquerda) e Período (direita) - SEM CARDS */}
				<div className="flex justify-between items-center w-full mb-2">
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
								{!visibleCards.ticketMedio && (
									<button
										onClick={() => addCard('ticketMedio')}
										className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-zinc-900"
									>
										Ticket Médio
									</button>
								)}
								{!visibleCards.canal && (
									<button
										onClick={() => addCard('canal')}
										className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-zinc-900"
									>
										Vendas por Canal
									</button>
								)}
									{(visibleCards.sales && visibleCards.revenue && visibleCards.produto && visibleCards.turno && visibleCards.ticketMedio && visibleCards.canal) && (
										<div className="px-3 py-2 text-sm text-zinc-400 text-center">Todos os cards estão visíveis</div>
									)}
								</div>
							)}
						</div>
						<PeriodSelector selected={period} onSelect={setPeriod} />
					</div>
				</div>

				{/* Linha divisória */}
				<div className="w-screen h-px bg-black -mx-20 my-0"></div>

				{/* Cards arrastáveis em grid 2x3 */}
				{(sales !== null || revenue !== null || produtoMaisVendido || vendasTurno || ticketMedio || vendasCanal.length > 0) && (
					<div className="grid grid-cols-3 gap-6 w-full mt-0 items-start content-start">
						{/* Card 1: Vendas */}
						{visibleCards.sales && (
							<Card 
								ref={salesRef}
								data-card-type="sales"
								className="border-[--color-primary]/30 p-6 cursor-move select-none transition-none relative self-start"
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
								ref={revenueRef}
								data-card-type="revenue"
								className="border-[--color-primary]/30 p-6 cursor-move select-none transition-none relative self-start"
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
								ref={produtoRef}
								data-card-type="produto"
								className="border-[--color-primary]/30 p-6 cursor-move select-none transition-none relative self-start"
								style={{ 
									transform: `translate(${produtoPosition.x}px, ${produtoPosition.y}px)`,
									zIndex: isDragging === 'produto' ? 1000 : (showRanking ? 100 : 1)
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
									<div className="absolute top-full left-0 right-0 mt-4 bg-white border border-[--color-primary]/30 rounded-b-lg shadow-lg p-4 max-h-[400px] overflow-y-auto z-50">
										<div className="text-sm font-semibold text-zinc-900 mb-3">Ranking Completo</div>
										<div className="space-y-1">
											{loadingRanking ? (
												<div className="text-xs text-zinc-500 text-center py-4">
													Carregando dados...
												</div>
											) : produtosRanking.length > 0 ? (
												produtosRanking.map((produto, index) => (
													<div key={index} className="flex justify-between items-center text-sm py-1">
														<div className="flex items-center gap-2">
															<span className="text-xs text-zinc-500 w-5">{index + 1}.</span>
															<span className="font-semibold text-zinc-900">{produto.nome}</span>
														</div>
														<span className="text-[#fa8072] font-bold text-base">{produto.total}</span>
													</div>
												))
											) : (
												<div className="text-xs text-zinc-500 text-center py-2">
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
								ref={turnoRef}
								data-card-type="turno"
								className="border-[--color-primary]/30 p-6 cursor-move select-none transition-none relative self-start"
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
						
						{/* Card 5: Ticket Médio */}
						{visibleCards.ticketMedio && (
							<Card 
								ref={ticketMedioRef}
								data-card-type="ticketMedio"
								className="border-[--color-primary]/30 p-6 cursor-move select-none transition-none relative self-start"
								style={{ 
									transform: `translate(${ticketMedioPosition.x}px, ${ticketMedioPosition.y}px)`,
									zIndex: isDragging === 'ticketMedio' ? 1000 : 1
								}}
								onMouseDown={(e) => handleMouseDown('ticketMedio', e)}
							>
								<button
									onClick={() => removeCard('ticketMedio')}
									className="delete-button absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
								>
									✕
								</button>
								<div className="text-sm font-medium text-[--color-muted-foreground] mb-2">
									Ticket Médio {period === 'mensal' ? 'do mês' : 'anual'}
								</div>
								{loadingTicketMedio ? (
									<div className="text-sm text-zinc-400 text-center py-4">
										Carregando dados...
									</div>
								) : ticketMedio ? (
									<div>
										<div className="text-3xl font-semibold text-[--color-primary] mb-2">
											R$ {ticketMedio.ticketMedio.toFixed(2).replace('.', ',')}
										</div>
										<div className="flex items-center gap-2 text-sm">
											{ticketMedio.variacao !== 0 && (
												<>
													<span className={ticketMedio.variacao >= 0 ? 'text-green-600' : 'text-red-600'}>
														{ticketMedio.variacao >= 0 ? '▲' : '▼'}
													</span>
													<span className={ticketMedio.variacao >= 0 ? 'text-green-600' : 'text-red-600'}>
														{Math.abs(ticketMedio.variacao).toFixed(1)}% vs período anterior
													</span>
												</>
											)}
										</div>
									</div>
								) : (
									<div className="text-3xl font-semibold text-[--color-primary]">—</div>
								)}
							</Card>
						)}
						
						{/* Card 6: Vendas por Canal */}
						{visibleCards.canal && (
							<Card 
								ref={canalRef}
								data-card-type="canal"
								className="border-[--color-primary]/30 p-6 cursor-move select-none transition-none relative self-start"
								style={{ 
									transform: `translate(${canalPosition.x}px, ${canalPosition.y}px)`,
									zIndex: isDragging === 'canal' ? 1000 : 1
								}}
								onMouseDown={(e) => handleMouseDown('canal', e)}
							>
								<button
									onClick={() => removeCard('canal')}
									className="delete-button absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
								>
									✕
								</button>
								{vendasCanal.length > 0 ? (
									<VendasPorCanalChart canais={vendasCanal} />
								) : (
									<div className="text-sm text-zinc-400 text-center">
										Sem dados disponíveis
									</div>
								)}
							</Card>
						)}
						
						{/* Espaços vazios para completar grid 2x3 */}
					</div>
				)}
			</main>
			
			<footer className="pointer-events-none absolute bottom-4 right-6 text-right leading-5">
				<div className="text-[10px] sm:text-xs font-semibold tracking-wide text-zinc-300">desafio técnico</div>
				<div className="text-[10px] sm:text-xs text-zinc-500">feito por Vitor Lacerda</div>
			</footer>
		</div>
  );
}
