'use client';

import { useState, useEffect } from 'react';
import PeriodSelector from "@/components/PeriodSelector";
import type { TemplateType, VisibleCards, CardType, Period } from '@/app/types';

interface CardControlsProps {
  currentTemplate: TemplateType;
  visibleCards: VisibleCards;
  isSmartphone: boolean;
  period: Period;
  isComparisonMode: boolean;
  onTemplateChange: (template: TemplateType) => void;
  onAddCard: (cardType: CardType) => void;
  onRemoveAllCards: () => void;
  onPeriodChange: (period: Period) => void;
  onYearChange?: (year: string | number) => void;
  onMonthChange?: (month: string | number) => void;
  restaurantId?: number | null;
  onComparisonModeToggle: () => void;
  // Props para modo de comparação
  comparisonCards?: string[];
  onAddComparisonCard?: (cardType: string) => void;
}

export default function CardControls({
  currentTemplate,
  visibleCards,
  isSmartphone,
  period,
  isComparisonMode,
  onTemplateChange,
  onAddCard,
  onRemoveAllCards,
  onPeriodChange,
  onYearChange,
  onMonthChange,
  restaurantId,
  onComparisonModeToggle,
  comparisonCards,
  onAddComparisonCard
}: CardControlsProps) {
  const [showCardsDropdown, setShowCardsDropdown] = useState(false);

  useEffect(() => {
    if (!showCardsDropdown) return;

    const handleClickOutside = (event: Event) => {
      try {
        const target = event.target as HTMLElement;
        if (target && !target.closest('.cards-dropdown-container')) {
          setShowCardsDropdown(false);
        }
      } catch (error) {
        console.error('Erro ao processar clique fora do dropdown:', error);
      }
    };

    try {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    } catch (error) {
      console.error('Erro ao adicionar listeners do dropdown:', error);
    }

    return () => {
      try {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      } catch (error) {
        // Ignorar erro se listeners já foram removidos
      }
    };
  }, [showCardsDropdown]);

  const cardLabels: Record<CardType, string> = {
    sales: 'Vendas',
    revenue: 'Faturamento',
    produto: 'Produto Mais Vendido',
    turno: 'Vendas por Turno',
    ticketMedio: 'Ticket Médio',
    canal: 'Vendas por Canal',
    produtoRemovido: 'Produto Mais Removido',
    tendencia: 'Tendência de Crescimento',
    desvioMedia: 'Desvio da Média Histórica',
    tempoMedioEntrega: 'Tempo Médio de Entrega'
  };

  // Quando em modo comparação, usar os cards de comparação
  const comparisonCardLabels: Record<string, string> = {
    'sales': 'Vendas',
    'revenue': 'Faturamento',
    'produto': 'Produto Mais Vendido',
    'ticketMedio': 'Ticket Médio',
    'turno': 'Vendas por Turno'
  };

  const allCardsVisible = isComparisonMode 
    ? comparisonCards?.length === 5 || false
    : Object.values(visibleCards).every(v => v);

  const availableComparisonCards = isComparisonMode && comparisonCards
    ? ['sales', 'revenue', 'produto', 'ticketMedio', 'turno'].filter(card => !comparisonCards.includes(card))
    : [];

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 w-full flex-wrap">
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          onClick={() => onTemplateChange('geral')}
          className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors shadow-sm touch-manipulation ${
            currentTemplate === 'geral'
              ? 'bg-gray-700 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          geral
        </button>
        {!isSmartphone && (
          <>
            <button
              onClick={() => onTemplateChange('vendas')}
              className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors shadow-sm touch-manipulation ${
                currentTemplate === 'vendas'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              vendas
            </button>
            <button
              onClick={() => onTemplateChange('faturamento')}
              className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors shadow-sm touch-manipulation ${
                currentTemplate === 'faturamento'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              faturamento
            </button>
            <button
              onClick={() => onTemplateChange('produtos')}
              className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors shadow-sm touch-manipulation ${
                currentTemplate === 'produtos'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              produtos
            </button>
          </>
        )}
        <button
          onClick={onRemoveAllCards}
          className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors text-xs sm:text-sm font-bold"
          title="Remover todos os cards"
        >
          ✕
        </button>
        <div className="relative cards-dropdown-container">
          <button
            onClick={() => setShowCardsDropdown(!showCardsDropdown)}
            className="px-2 sm:px-3 py-1.5 bg-[#fa8072] text-white rounded-md text-xs sm:text-sm font-medium hover:bg-[#fa8072]/90 active:bg-[#fa8072]/80 transition-colors shadow-sm touch-manipulation"
          >
            cards
          </button>
          {showCardsDropdown && (
            <div className="absolute left-0 mt-2 bg-white border border-[--color-primary]/30 rounded-md shadow-lg z-50 p-2 w-[180px] sm:w-48 max-w-[calc(100vw-3rem)] max-h-[70vh] overflow-y-auto">
              {isComparisonMode && onAddComparisonCard ? (
                // Modo comparação
                <>
                  {availableComparisonCards.map((cardType) => (
                    <button
                      key={cardType}
                      onClick={() => {
                        onAddComparisonCard(cardType);
                        setShowCardsDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-100 active:bg-gray-200 rounded text-sm text-zinc-900 touch-manipulation"
                    >
                      {comparisonCardLabels[cardType]}
                    </button>
                  ))}
                  {allCardsVisible && (
                    <div className="px-3 py-2 text-sm text-zinc-400 text-center">Todos os cards estão visíveis</div>
                  )}
                </>
              ) : (
                // Modo normal
                <>
                  {(Object.keys(cardLabels) as CardType[]).map((cardType) => {
                    if (visibleCards[cardType]) return null;
                    return (
                      <button
                        key={cardType}
                        onClick={() => {
                          onAddCard(cardType);
                          setShowCardsDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-gray-100 active:bg-gray-200 rounded text-sm text-zinc-900 touch-manipulation"
                      >
                        {cardLabels[cardType]}
                      </button>
                    );
                  })}
                  {allCardsVisible && (
                    <div className="px-3 py-2 text-sm text-zinc-400 text-center">Todos os cards estão visíveis</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        {!isSmartphone && (
          <button
            onClick={onComparisonModeToggle}
            className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors shadow-sm touch-manipulation ${
              isComparisonMode
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            comparar
          </button>
        )}
      </div>
      {!isComparisonMode && (
        <div className="flex-shrink-0">
          <PeriodSelector 
            selected={period} 
            onSelect={onPeriodChange}
            onYearChange={onYearChange}
            onMonthChange={onMonthChange}
            restaurantId={restaurantId}
          />
        </div>
      )}
    </div>
  );
}

