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
  // Inicialmente todos ocultos - usuário deve escolher quais mostrar
  const [visibleCards, setVisibleCards] = useState({
    sales: false,
    revenue: false,
    produto: false,
    turno: false,
    ticketMedio: false,
    canal: false
  });
  
  const [showCardsDropdown, setShowCardsDropdown] = useState(false);
  const [isSmartphone, setIsSmartphone] = useState(false);

  // Detectar se é smartphone (apenas telas muito pequenas com touch)
  useEffect(() => {
    const checkSmartphone = () => {
      // Verifica largura da tela
      const width = window.innerWidth;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isVerySmallScreen = width < 480; // Apenas telas muito pequenas (smartphones pequenos)
      
      // User agent para detectar smartphones (não tablets)
      const userAgent = navigator.userAgent.toLowerCase();
      const isPhone = /android.*mobile|webos|iphone|ipod|blackberry|iemobile|opera.*mini/i.test(userAgent);
      const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
      
      // Considera smartphone apenas se: tela muito pequena (<480px) E é phone (não tablet) E tem touch
      // Isso permite que tablets e telas maiores vejam os cards
      setIsSmartphone(isVerySmallScreen && isPhone && !isTablet && isTouch);
    };

    checkSmartphone();
    window.addEventListener('resize', checkSmartphone);
    return () => window.removeEventListener('resize', checkSmartphone);
  }, []);

  // Fechar dropdown de cards ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;
      if (showCardsDropdown && !target.closest('.cards-dropdown-container')) {
        setShowCardsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showCardsDropdown]);

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

  const startDrag = (
    type: 'sales' | 'revenue' | 'produto' | 'turno' | 'ticketMedio' | 'canal',
    clientX: number,
    clientY: number
  ) => {
    setIsDragging(type);
    
    // Captura a posição atual do card
    const currentPosition = 
      type === 'sales' ? salesPosition : 
      type === 'revenue' ? revenuePosition :
      type === 'produto' ? produtoPosition :
      type === 'turno' ? turnoPosition :
      type === 'ticketMedio' ? ticketMedioPosition :
      canalPosition;
    
    const startX = clientX;
    const startY = clientY;
    
    // Calcula o offset (distância entre o ponto de clique e a origem do card)
    const offsetX = startX - currentPosition.x;
    const offsetY = startY - currentPosition.y;
    
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

    const handleMove = (moveX: number, moveY: number) => {
      // Nova posição = posição do toque/mouse - offset inicial
      const newX = moveX - offsetX;
      const newY = moveY - offsetY;

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

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(null);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleMouseDown = (type: 'sales' | 'revenue' | 'produto' | 'turno' | 'ticketMedio' | 'canal', e: React.MouseEvent) => {
    // Verificar se o clique foi no botão de deletar
    const target = e.target as HTMLElement;
    if (target.classList.contains('delete-button')) {
      e.stopPropagation();
      removeCard(type);
      return;
    }
    
    // Verificar se o clique foi dentro da tabela de ranking (para permitir scroll)
    let element = target;
    while (element && element !== e.currentTarget) {
      if (element.classList.contains('ranking-table-container')) {
        return; // Não iniciar arraste se estiver na tabela de ranking
      }
      element = element.parentElement as HTMLElement;
    }
    
    if (e.button !== 0) return; // Apenas botão esquerdo do mouse
    e.preventDefault();
    
    startDrag(type, e.clientX, e.clientY);
  };

  const handleTouchStart = (type: 'sales' | 'revenue' | 'produto' | 'turno' | 'ticketMedio' | 'canal', e: React.TouchEvent) => {
    // Verificar se o toque foi no botão de deletar
    const target = e.target as HTMLElement;
    if (target.classList.contains('delete-button')) {
      e.stopPropagation();
      removeCard(type);
      return;
    }
    
    // Verificar se o toque foi dentro da tabela de ranking (para permitir scroll)
    let element = target;
    while (element && element !== e.currentTarget) {
      if (element.classList.contains('ranking-table-container')) {
        return; // Não iniciar arraste se estiver na tabela de ranking
      }
      element = element.parentElement as HTMLElement;
    }
    
    if (e.touches.length > 0) {
      e.preventDefault();
      const touch = e.touches[0];
      startDrag(type, touch.clientX, touch.clientY);
    }
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
			<main className="flex flex-col px-4 md:px-20 py-4">
				{/* Linha superior: Unidade (esquerda) e Período (direita) - SEM CARDS */}
				<div className="flex flex-col gap-3 w-full mb-2">
					{/* Linha 1: Unidade */}
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full">
						<span className="text-sm text-zinc-700 whitespace-nowrap">Unidade</span>
						<div className="flex-1 min-w-0">
							<RestaurantSearch onSelect={handleSelect} period={period} />
						</div>
					</div>
					{/* Linha 2: Cards e Período */}
					<div className="flex items-center justify-between gap-3 w-full">
						{/* Botão Cards com dropdown */}
						<div className="relative cards-dropdown-container">
							<button
								onClick={() => setShowCardsDropdown(!showCardsDropdown)}
								className="px-3 py-1.5 bg-[#fa8072] text-white rounded-md text-sm font-medium hover:bg-[#fa8072]/90 active:bg-[#fa8072]/80 transition-colors shadow-sm touch-manipulation"
							>
								cards
							</button>
							{showCardsDropdown && (
								<div className="absolute left-0 mt-2 bg-white border border-[--color-primary]/30 rounded-md shadow-lg z-50 p-2 w-[180px] sm:w-48 max-w-[calc(100vw-3rem)] max-h-[70vh] overflow-y-auto">
								{!visibleCards.sales && (
									<button
										onClick={() => {
											addCard('sales');
											setShowCardsDropdown(false);
										}}
										className="w-full text-left px-3 py-2.5 hover:bg-gray-100 active:bg-gray-200 rounded text-sm text-zinc-900 touch-manipulation"
									>
										Vendas
									</button>
								)}
								{!visibleCards.revenue && (
									<button
										onClick={() => {
											addCard('revenue');
											setShowCardsDropdown(false);
										}}
										className="w-full text-left px-3 py-2.5 hover:bg-gray-100 active:bg-gray-200 rounded text-sm text-zinc-900 touch-manipulation"
									>
										Faturamento
									</button>
								)}
								{!visibleCards.produto && (
									<button
										onClick={() => {
											addCard('produto');
											setShowCardsDropdown(false);
										}}
										className="w-full text-left px-3 py-2.5 hover:bg-gray-100 active:bg-gray-200 rounded text-sm text-zinc-900 touch-manipulation"
									>
										Produto Mais Vendido
									</button>
								)}
								{!visibleCards.turno && (
									<button
										onClick={() => {
											addCard('turno');
											setShowCardsDropdown(false);
										}}
										className="w-full text-left px-3 py-2.5 hover:bg-gray-100 active:bg-gray-200 rounded text-sm text-zinc-900 touch-manipulation"
									>
										Vendas por Turno
									</button>
								)}
								{!visibleCards.ticketMedio && (
									<button
										onClick={() => {
											addCard('ticketMedio');
											setShowCardsDropdown(false);
										}}
										className="w-full text-left px-3 py-2.5 hover:bg-gray-100 active:bg-gray-200 rounded text-sm text-zinc-900 touch-manipulation"
									>
										Ticket Médio
									</button>
								)}
								{!visibleCards.canal && (
									<button
										onClick={() => {
											addCard('canal');
											setShowCardsDropdown(false);
										}}
										className="w-full text-left px-3 py-2.5 hover:bg-gray-100 active:bg-gray-200 rounded text-sm text-zinc-900 touch-manipulation"
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
				<div className="w-screen h-px bg-black -mx-4 md:-mx-20 my-0"></div>

				{/* Cards arrastáveis em grid responsivo - Aparecem quando escolhidos pelo usuário */}
				{(visibleCards.sales || visibleCards.revenue || visibleCards.produto || visibleCards.turno || visibleCards.ticketMedio || visibleCards.canal) && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full mt-0 items-start content-start">
						{/* Card 1: Vendas */}
						{visibleCards.sales && (
							<Card 
								ref={salesRef}
								data-card-type="sales"
								className="border-[--color-primary]/30 p-4 md:p-6 cursor-move select-none transition-none relative self-start touch-none"
								style={{ 
									transform: `translate(${salesPosition.x}px, ${salesPosition.y}px)`,
									zIndex: isDragging === 'sales' ? 1000 : 1
								}}
								onMouseDown={(e) => handleMouseDown('sales', e)}
								onTouchStart={(e) => handleTouchStart('sales', e)}
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
								<div className="text-xl md:text-3xl font-semibold text-[--color-primary]">{sales?.toLocaleString() || '—'}</div>
							</Card>
						)}
						
						{/* Card 2: Faturamento */}
						{visibleCards.revenue && (
							<Card 
								ref={revenueRef}
								data-card-type="revenue"
								className="border-[--color-primary]/30 p-4 md:p-6 cursor-move select-none transition-none relative self-start touch-none"
								style={{ 
									transform: `translate(${revenuePosition.x}px, ${revenuePosition.y}px)`,
									zIndex: isDragging === 'revenue' ? 1000 : 1
								}}
								onMouseDown={(e) => handleMouseDown('revenue', e)}
								onTouchStart={(e) => handleTouchStart('revenue', e)}
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
								<div className="text-xl md:text-3xl font-semibold text-[--color-primary]">
									{revenue ? `R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
								</div>
							</Card>
						)}
						
						{/* Card 3: Vendas por Canal - Coluna Direita */}
						{visibleCards.canal && (
							<Card 
								ref={canalRef}
								data-card-type="canal"
								className="border-[--color-primary]/30 p-4 md:p-6 cursor-move select-none transition-none relative self-start touch-none lg:row-span-3"
								style={{ 
									transform: `translate(${canalPosition.x}px, ${canalPosition.y}px)`,
									zIndex: isDragging === 'canal' ? 1000 : 1
								}}
								onMouseDown={(e) => handleMouseDown('canal', e)}
								onTouchStart={(e) => handleTouchStart('canal', e)}
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
						
						{/* Card 4: Vendas por Turno */}
						{visibleCards.turno && (
							<Card 
								ref={turnoRef}
								data-card-type="turno"
								className="border-[--color-primary]/30 p-4 md:p-6 cursor-move select-none transition-none relative self-start touch-none"
								style={{ 
									transform: `translate(${turnoPosition.x}px, ${turnoPosition.y}px)`,
									zIndex: isDragging === 'turno' ? 1000 : 1
								}}
								onMouseDown={(e) => handleMouseDown('turno', e)}
								onTouchStart={(e) => handleTouchStart('turno', e)}
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
								className="border-[--color-primary]/30 p-4 md:p-6 cursor-move select-none transition-none relative self-start touch-none"
								style={{ 
									transform: `translate(${ticketMedioPosition.x}px, ${ticketMedioPosition.y}px)`,
									zIndex: isDragging === 'ticketMedio' ? 1000 : 1
								}}
								onMouseDown={(e) => handleMouseDown('ticketMedio', e)}
								onTouchStart={(e) => handleTouchStart('ticketMedio', e)}
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
										<div className="text-xl md:text-3xl font-semibold text-[--color-primary] mb-2">
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
									<div className="text-xl md:text-3xl font-semibold text-[--color-primary]">—</div>
								)}
							</Card>
						)}
						
						{/* Card 6: Produto Mais Vendido */}
						{visibleCards.produto && (
							<Card 
								ref={produtoRef}
								data-card-type="produto"
								className="border-[--color-primary]/30 p-4 md:p-6 cursor-move select-none transition-none relative self-start touch-none"
								style={{ 
									transform: `translate(${produtoPosition.x}px, ${produtoPosition.y}px)`,
									zIndex: isDragging === 'produto' ? 1000 : (showRanking ? 100 : 1)
								}}
								onMouseDown={(e) => handleMouseDown('produto', e)}
								onTouchStart={(e) => handleTouchStart('produto', e)}
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
										<div className="text-base md:text-lg font-semibold text-[--color-primary] mb-1">
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
									<div className="ranking-table-container absolute top-full left-0 right-0 mt-4 bg-white border border-[--color-primary]/30 rounded-b-lg shadow-lg p-4 max-h-[400px] overflow-y-auto z-50">
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
						
						{/* Espaços vazios para completar grid */}
					</div>
				)}
			</main>
			
			<footer className="pointer-events-none absolute bottom-2 md:bottom-4 right-3 md:right-6 text-right leading-5">
				<div className="text-[10px] sm:text-xs font-semibold tracking-wide text-zinc-300">desafio técnico</div>
				<div className="text-[10px] sm:text-xs text-zinc-500">feito por Vitor Lacerda</div>
			</footer>
		</div>
  );
}
