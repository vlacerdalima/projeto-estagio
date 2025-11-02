'use client';

import { useState, useRef, useEffect } from 'react';
import RestaurantSearch from "@/components/RestaurantSearch";
import CardControls from "./components/CardControls";
import CardsGrid from "./components/CardsGrid";
import ComparisonView from "./components/ComparisonView";
import { useSmartphoneDetection } from '@/app/hooks/useSmartphoneDetection';
import { useCardVisibility } from '@/app/hooks/useCardVisibility';
import { useRestaurantData } from '@/app/hooks/useRestaurantData';
import { useCardDrag } from '@/app/hooks/useCardDrag';
import { shouldPreventDrag } from '@/app/utils/cardHelpers';
import { UserButton } from '@clerk/nextjs';
import type { Period, CardType, Position, VendasTurno, ProdutoMaisVendido } from '@/app/types';
import type { ComparisonCardType } from './components/ComparisonView';

export default function Home() {
  const [period, setPeriod] = useState<Period>('anual');
  const [selectedYear, setSelectedYear] = useState<string | number>('todos');
  const [selectedMonth, setSelectedMonth] = useState<string | number>('todos');
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [comparisonCards, setComparisonCards] = useState<ComparisonCardType[]>(['sales', 'revenue']);
  
  // Detecção de smartphone
  const isSmartphone = useSmartphoneDetection();
  
  // Visibilidade dos cards
  const {
    visibleCards,
    currentTemplate,
    removeCard,
    addCard,
    applyTemplate,
    removeAllCards
  } = useCardVisibility(isSmartphone, selectedRestaurant);
  
  // Posições dos cards
  const [positions, setPositions] = useState<Record<CardType, Position>>({
    sales: { x: 0, y: 0 },
    revenue: { x: 0, y: 0 },
    produto: { x: 0, y: 0 },
    turno: { x: 0, y: 0 },
    ticketMedio: { x: 0, y: 0 },
    canal: { x: 0, y: 0 },
    produtoRemovido: { x: 0, y: 0 },
    tendencia: { x: 0, y: 0 },
    desvioMedia: { x: 0, y: 0 },
    tempoMedioEntrega: { x: 0, y: 0 },
    sazonalidade: { x: 0, y: 0 }
  });
  
  // Refs dos cards - preciso criar aqui para passar ao hook
  const salesRef = useRef<HTMLDivElement>(null);
  const revenueRef = useRef<HTMLDivElement>(null);
  const produtoRef = useRef<HTMLDivElement>(null);
  const turnoRef = useRef<HTMLDivElement>(null);
  const ticketMedioRef = useRef<HTMLDivElement>(null);
  const canalRef = useRef<HTMLDivElement>(null);
  const produtoRemovidoRef = useRef<HTMLDivElement>(null);
  const tendenciaRef = useRef<HTMLDivElement>(null);
  const desvioMediaRef = useRef<HTMLDivElement>(null);
  const tempoMedioEntregaRef = useRef<HTMLDivElement>(null);
  const sazonalidadeRef = useRef<HTMLDivElement>(null);
  
  const refs: Record<CardType, React.RefObject<HTMLDivElement | null>> = {
    sales: salesRef,
    revenue: revenueRef,
    produto: produtoRef,
    turno: turnoRef,
    ticketMedio: ticketMedioRef,
    canal: canalRef,
    produtoRemovido: produtoRemovidoRef,
    tendencia: tendenciaRef,
    desvioMedia: desvioMediaRef,
    tempoMedioEntrega: tempoMedioEntregaRef,
    sazonalidade: sazonalidadeRef
  };
  
  // Drag dos cards
  const { isDragging, startDrag } = useCardDrag({
    positions,
    refs,
    onPositionChange: (type, newPosition) => {
      setPositions(prev => ({ ...prev, [type]: newPosition }));
    }
  });
  
  // Dados do restaurante
  const {
    data,
    loadingTicketMedio,
    produtosRanking,
    loadingRanking,
    fetchRanking,
    regioesEntrega,
    loadingRegioes,
    fetchRegioes,
    refetchTempoMedioEntrega
  } = useRestaurantData(selectedRestaurant, period, selectedYear, selectedMonth);
  
  // Estado do ranking
  const [showRanking, setShowRanking] = useState(false);
  const [showRegioes, setShowRegioes] = useState(false);
  const [selectedRegiao, setSelectedRegiao] = useState<string>('todas');
  
  // Funções para gerenciar cards de comparação
  const addComparisonCard = (cardType: string) => {
    const maxCards = 4;
    if (comparisonCards.length < maxCards && !comparisonCards.includes(cardType as ComparisonCardType)) {
      setComparisonCards(prev => [...prev, cardType as ComparisonCardType]);
    }
  };

  const removeComparisonCard = (cardType: ComparisonCardType) => {
    setComparisonCards(prev => prev.filter(c => c !== cardType));
  };

  const handleSelect = (
    salesVal: number | null,
    revenueVal: number | null,
    produto: ProdutoMaisVendido | null,
    turno: VendasTurno | null,
    restaurantId: number
  ): void => {
    setSelectedRestaurant(restaurantId);
    // Reset das posições quando trocar de restaurante
    setPositions({
      sales: { x: 0, y: 0 },
      revenue: { x: 0, y: 0 },
      produto: { x: 0, y: 0 },
      turno: { x: 0, y: 0 },
      ticketMedio: { x: 0, y: 0 },
      canal: { x: 0, y: 0 },
      produtoRemovido: { x: 0, y: 0 },
      tendencia: { x: 0, y: 0 },
      desvioMedia: { x: 0, y: 0 },
      tempoMedioEntrega: { x: 0, y: 0 },
      sazonalidade: { x: 0, y: 0 }
    });
    // Reset do ranking
    setShowRanking(false);
  }

  const handleMouseDown = (type: CardType, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const cardElement = e.currentTarget as HTMLElement;
    
    if (shouldPreventDrag(e, cardElement)) {
      e.stopPropagation();
      if (target.classList.contains('delete-button')) {
        removeCard(type);
      }
      return;
    }
    
    if (e.button !== 0) return;
    e.preventDefault();
    startDrag(type, e.clientX, e.clientY);
  };

  const handleTouchStart = (type: CardType, e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const cardElement = e.currentTarget as HTMLElement;
    
    if (shouldPreventDrag(e, cardElement)) {
      e.stopPropagation();
      if (target.classList.contains('delete-button')) {
        removeCard(type);
      }
      return;
    }
    
    if (e.touches.length > 0) {
      e.preventDefault();
      const touch = e.touches[0];
      startDrag(type, touch.clientX, touch.clientY);
    }
  };

  const toggleRanking = () => {
    if (!showRanking && produtosRanking.length === 0) {
      fetchRanking();
    }
    setShowRanking(!showRanking);
  };

  // Refetch tempo médio de entrega quando a região mudar
  useEffect(() => {
    if (selectedRestaurant) {
      // Só refetch se a região for diferente de 'todas' (inicial)
      // O fetch inicial já é feito no useRestaurantData
      if (selectedRegiao !== 'todas') {
        refetchTempoMedioEntrega(selectedRegiao);
      }
    }
  }, [selectedRegiao, selectedRestaurant, period, selectedYear, selectedMonth]);

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
        <header className="absolute top-4 right-4 md:right-20 z-50">
          <UserButton afterSignOutUrl="/sign-in" />
        </header>
        <div className="flex flex-col gap-3 w-full mb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full">
            <div className="flex-1 min-w-0">
              <RestaurantSearch onSelect={handleSelect} period={period} />
            </div>
          </div>
          <CardControls
            currentTemplate={currentTemplate}
            visibleCards={visibleCards}
            isSmartphone={isSmartphone}
            period={period}
            isComparisonMode={isComparisonMode}
            onTemplateChange={applyTemplate}
            onAddCard={addCard}
            onRemoveAllCards={removeAllCards}
            onPeriodChange={setPeriod}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            restaurantId={selectedRestaurant}
            onComparisonModeToggle={() => setIsComparisonMode(!isComparisonMode)}
            comparisonCards={comparisonCards}
            onAddComparisonCard={addComparisonCard}
          />
        </div>

        <div className="w-screen h-px bg-black -mx-4 md:-mx-20 my-0"></div>

        {isComparisonMode && !isSmartphone ? (
          <ComparisonView 
            period={period}
            year={selectedYear}
            month={selectedMonth}
            onPeriodChange={setPeriod}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            visibleComparisonCards={comparisonCards}
            onAddComparisonCard={addComparisonCard}
            onRemoveComparisonCard={removeComparisonCard}
          />
        ) : (
          <CardsGrid
          visibleCards={visibleCards}
          positions={positions}
          isDragging={isDragging}
          period={period}
          currentTemplate={currentTemplate}
          sales={data.sales}
          revenue={data.revenue}
          produtoMaisVendido={data.produtoMaisVendido}
          produtoMaisRemovido={data.produtoMaisRemovido}
          vendasTurno={data.vendasTurno}
          ticketMedio={data.ticketMedio}
          vendasCanal={data.vendasCanal}
          tendenciaVendas={data.tendenciaVendas}
          desvioMedia={data.desvioMedia}
          tempoMedioEntrega={data.tempoMedioEntrega}
          sazonalidadeProdutos={data.sazonalidadeProdutos}
          loadingTicketMedio={loadingTicketMedio}
          showRanking={showRanking}
          produtosRanking={produtosRanking}
          loadingRanking={loadingRanking}
          showRegioes={showRegioes}
          regioesEntrega={regioesEntrega}
          loadingRegioes={loadingRegioes}
          selectedRegiao={selectedRegiao}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onRemoveCard={removeCard}
          onToggleRanking={toggleRanking}
          onFetchRanking={fetchRanking}
          onToggleRegioes={() => {
            if (!showRegioes && regioesEntrega.length === 0) {
              fetchRegioes();
            }
            setShowRegioes(!showRegioes);
          }}
          onSelectRegiao={(regiao: string) => {
            setSelectedRegiao(regiao);
            setShowRegioes(false);
          }}
          refs={refs}
          onPositionChange={(type, newPosition) => {
            setPositions(prev => ({ ...prev, [type]: newPosition }));
          }}
        />
        )}
      </main>

      <footer className="pointer-events-none absolute bottom-2 md:bottom-4 right-3 md:right-6 text-right leading-5">
        <div className="text-[10px] sm:text-xs font-semibold tracking-wide text-zinc-300">desafio técnico</div>
        <div className="text-[10px] sm:text-xs text-zinc-500">feito por Vitor Lacerda</div>
      </footer>
    </div>
  );
}
