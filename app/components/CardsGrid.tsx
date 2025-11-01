'use client';

import React, { useState, useEffect, useRef } from 'react';
import DraggableCard from './DraggableCard';
import SalesByShiftChart from "@/components/SalesByShiftChart";
import VendasPorCanalChart from "@/components/VendasPorCanalChart";
import TendenciaVendasChart from "@/components/TendenciaVendasChart";
import type { 
  VisibleCards, 
  CardType, 
  Position, 
  Period,
  TemplateType,
  VendasTurno,
  CanalData,
  TicketMedio,
  ProdutoMaisVendido,
  ProdutoMaisRemovido,
  ProdutoRanking,
  TendenciaVendas,
  DesvioMedia,
  TempoMedioEntrega
} from '@/app/types';

interface CardsGridProps {
  visibleCards: VisibleCards;
  positions: Record<CardType, Position>;
  isDragging: CardType | null;
  period: Period;
  currentTemplate: TemplateType;
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
  loadingTicketMedio: boolean;
  showRanking: boolean;
  produtosRanking: ProdutoRanking[];
  loadingRanking: boolean;
  onMouseDown: (type: CardType, e: React.MouseEvent) => void;
  onTouchStart: (type: CardType, e: React.TouchEvent) => void;
  refs: Record<CardType, React.RefObject<HTMLDivElement | null>>;
  onRemoveCard: (type: CardType) => void;
  onToggleRanking: () => void;
  onFetchRanking: () => void;
  onPositionChange?: (type: CardType, position: Position) => void;
}

export default function CardsGrid({
  visibleCards,
  positions,
  isDragging,
  period,
  currentTemplate,
  sales,
  revenue,
  produtoMaisVendido,
  produtoMaisRemovido,
  vendasTurno,
  ticketMedio,
  vendasCanal,
  tendenciaVendas,
  desvioMedia,
  tempoMedioEntrega,
  loadingTicketMedio,
  showRanking,
  produtosRanking,
  loadingRanking,
  onMouseDown,
  onTouchStart,
  onRemoveCard,
  onToggleRanking,
  onFetchRanking,
  refs,
  onPositionChange
}: CardsGridProps) {
  // Estados para calcular posições iniciais dos cards
  const [cardStyles, setCardStyles] = useState<Record<CardType, React.CSSProperties>>({} as Record<CardType, React.CSSProperties>);
  const hasCalculatedInitialStyles = useRef(false);

  // Calcular posições iniciais baseadas no grid (apenas uma vez)
  useEffect(() => {
    if (hasCalculatedInitialStyles.current) return;
    const calculateStyles = () => {
      const gridContainer = document.querySelector('.grid');
      if (!gridContainer) return;

      const containerWidth = gridContainer.getBoundingClientRect().width;
      const isDesktop = window.innerWidth >= 1024;
      const isTablet = window.innerWidth >= 768;
      const numColumns = isDesktop ? 3 : (isTablet ? 2 : 1);
      const gap = 16;
      const columnWidth = (containerWidth - (gap * (numColumns - 1))) / numColumns;

      const styles: Record<CardType, React.CSSProperties> = {} as Record<CardType, React.CSSProperties>;
      
      // Ordem base dos cards
      const allCardsOrder = ['sales', 'revenue', 'ticketMedio', 'turno', 'tendencia', 'canal', 'produto', 'produtoRemovido', 'desvioMedia', 'tempoMedioEntrega'];
      
      // Filtrar apenas cards visíveis na ordem original
      const visibleCardsInOrder = allCardsOrder.filter(cardType => visibleCards[cardType as CardType]);
      
      // Array para rastrear altura acumulada de cada coluna
      const columnHeights: number[] = new Array(numColumns).fill(0);
      const verticalGap = 8;
      
      visibleCardsInOrder.forEach((cardType) => {
        const cardRef = refs[cardType as CardType]?.current;
        if (!cardRef) return;
        
        // Calcular altura real do card
        const cardHeight = cardRef.getBoundingClientRect().height;
        
        // Encontrar a coluna com menor altura
        let minHeight = columnHeights[0];
        let targetColumn = 0;
        for (let i = 1; i < numColumns; i++) {
          if (columnHeights[i] < minHeight) {
            minHeight = columnHeights[i];
            targetColumn = i;
          }
        }
        
        const left = targetColumn * (columnWidth + gap);
        const top = columnHeights[targetColumn];

        styles[cardType as CardType] = {
          left: `${left}px`,
          top: `${top}px`,
          width: `${columnWidth}px`
        };
        
        // Atualizar altura acumulada da coluna
        columnHeights[targetColumn] += cardHeight + verticalGap;
      });

      setCardStyles(styles);
      hasCalculatedInitialStyles.current = true;
    };

    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          calculateStyles();
        });
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [visibleCards, currentTemplate]);

  if (!Object.values(visibleCards).some(v => v)) {
    return null;
  }

  return (
    <div className="w-full mt-0 relative grid">
      {visibleCards.sales && (
        <DraggableCard
          ref={refs.sales}
          type="sales"
          position={positions.sales}
          isDragging={isDragging === 'sales'}
          onMouseDown={(e) => onMouseDown('sales', e)}
          onTouchStart={(e) => onTouchStart('sales', e)}
          onRemove={() => onRemoveCard('sales')}
          style={cardStyles.sales}
        >
          <div className="text-sm font-medium text-[--color-muted-foreground] mb-2">
            Vendas
          </div>
          <div className="text-xl md:text-3xl font-semibold text-[--color-primary]">
            {sales?.toLocaleString() || '—'}
          </div>
        </DraggableCard>
      )}

      {visibleCards.revenue && (
        <DraggableCard
          ref={refs.revenue}
          type="revenue"
          position={positions.revenue}
          isDragging={isDragging === 'revenue'}
          onMouseDown={(e) => onMouseDown('revenue', e)}
          onTouchStart={(e) => onTouchStart('revenue', e)}
          onRemove={() => onRemoveCard('revenue')}
          style={cardStyles.revenue}
        >
          <div className="text-sm font-medium text-[--color-muted-foreground] mb-2">
            Faturamento
          </div>
          <div className="text-xl md:text-3xl font-semibold text-[--color-primary]">
            {revenue ? `R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
          </div>
        </DraggableCard>
      )}

      {visibleCards.ticketMedio && (
        <DraggableCard
          ref={refs.ticketMedio}
          type="ticketMedio"
          position={positions.ticketMedio}
          isDragging={isDragging === 'ticketMedio'}
          onMouseDown={(e) => onMouseDown('ticketMedio', e)}
          onTouchStart={(e) => onTouchStart('ticketMedio', e)}
          onRemove={() => onRemoveCard('ticketMedio')}
          style={cardStyles.ticketMedio}
        >
          <div className="text-sm font-medium text-[--color-muted-foreground] mb-2">
            Ticket Médio
          </div>
          {loadingTicketMedio ? (
            <div className="text-sm text-zinc-400 text-center py-4">Carregando dados...</div>
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
        </DraggableCard>
      )}

      {visibleCards.turno && (
        <DraggableCard
          ref={refs.turno}
          type="turno"
          position={positions.turno}
          isDragging={isDragging === 'turno'}
          onMouseDown={(e) => onMouseDown('turno', e)}
          onTouchStart={(e) => onTouchStart('turno', e)}
          onRemove={() => onRemoveCard('turno')}
          style={cardStyles.turno}
        >
          {vendasTurno ? (
            <SalesByShiftChart
              manha={vendasTurno.manha}
              tarde={vendasTurno.tarde}
              noite={vendasTurno.noite}
            />
          ) : (
            <div className="text-sm text-zinc-400 text-center">Carregando vendas por turno...</div>
          )}
        </DraggableCard>
      )}

      {visibleCards.tendencia && (
        <DraggableCard
          ref={refs.tendencia}
          type="tendencia"
          position={positions.tendencia || { x: 0, y: 0 }}
          isDragging={isDragging === 'tendencia'}
          onMouseDown={(e) => onMouseDown('tendencia', e)}
          onTouchStart={(e) => onTouchStart('tendencia', e)}
          onRemove={() => onRemoveCard('tendencia')}
          style={cardStyles.tendencia}
        >
          <div className="text-sm font-medium text-[--color-muted-foreground] mb-2">
            Tendência de Crescimento
          </div>
          {tendenciaVendas ? (
            <>
              <div className="mb-3">
                <div className={`text-2xl md:text-3xl font-semibold mb-1 ${
                  tendenciaVendas.taxaCrescimento >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tendenciaVendas.taxaCrescimento >= 0 ? '+' : ''}{tendenciaVendas.taxaCrescimento.toFixed(1)}%
                </div>
                <div className="text-xs text-[--color-muted-foreground]">
                  / mês
                </div>
              </div>
              {tendenciaVendas.dadosMensais.length > 0 ? (
                <TendenciaVendasChart dadosMensais={tendenciaVendas.dadosMensais} />
              ) : (
                <div className="w-full h-40 flex items-center justify-center text-xs text-zinc-400">
                  —
                </div>
              )}
            </>
          ) : (
            <div className="text-lg text-zinc-400">—</div>
          )}
        </DraggableCard>
      )}

      {visibleCards.canal && (
        <DraggableCard
          ref={refs.canal}
          type="canal"
          position={positions.canal}
          isDragging={isDragging === 'canal'}
          onMouseDown={(e) => onMouseDown('canal', e)}
          onTouchStart={(e) => onTouchStart('canal', e)}
          onRemove={() => onRemoveCard('canal')}
          className="lg:row-span-3"
          style={cardStyles.canal}
        >
          {vendasCanal.length > 0 ? (
            <VendasPorCanalChart canais={vendasCanal} />
          ) : (
            <div className="text-sm text-zinc-400 text-center">Sem dados disponíveis</div>
          )}
        </DraggableCard>
      )}

      {visibleCards.produto && (
        <div 
          className={showRanking ? 'relative z-[9999]' : ''}
        >
          <DraggableCard
            ref={refs.produto}
            type="produto"
            position={positions.produto}
            isDragging={isDragging === 'produto'}
            onMouseDown={(e) => onMouseDown('produto', e)}
            onTouchStart={(e) => onTouchStart('produto', e)}
            onRemove={() => onRemoveCard('produto')}
            style={cardStyles.produto}
          >
          <div className="text-sm font-medium text-[--color-muted-foreground] mb-2">
            Produto Mais Vendido
          </div>
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
                if (!showRanking && produtosRanking.length === 0) {
                  onFetchRanking();
                }
                onToggleRanking();
              }}
              className="flex items-center justify-center w-6 h-6 text-zinc-400 hover:text-[#fa8072] transition-colors"
              title="Ver ranking completo"
            >
              {showRanking ? '▼' : '▶'}
            </button>
          </div>
          {showRanking && (
            <div className="ranking-table-container absolute top-full left-0 right-0 mt-4 bg-white border border-[--color-primary]/30 rounded-b-lg shadow-lg p-4 max-h-[400px] overflow-y-auto z-[10000]">
              <div className="text-sm font-semibold text-zinc-900 mb-3">Ranking Completo</div>
              <div className="space-y-1">
                {loadingRanking ? (
                  <div className="text-xs text-zinc-500 text-center py-4">Carregando dados...</div>
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
                  <div className="text-xs text-zinc-500 text-center py-2">Sem dados disponíveis</div>
                )}
              </div>
            </div>
          )}
          </DraggableCard>
        </div>
      )}

      {visibleCards.produtoRemovido && (
        <DraggableCard
          ref={refs.produtoRemovido}
          type="produtoRemovido"
          position={positions.produtoRemovido || { x: 0, y: 0 }}
          isDragging={isDragging === 'produtoRemovido'}
          onMouseDown={(e) => onMouseDown('produtoRemovido', e)}
          onTouchStart={(e) => onTouchStart('produtoRemovido', e)}
          onRemove={() => onRemoveCard('produtoRemovido')}
          style={cardStyles.produtoRemovido}
        >
          <div className="text-sm font-medium text-[--color-muted-foreground] mb-2">
            Produto Mais Removido
          </div>
          <div className="flex-1">
            {produtoMaisRemovido?.nome ? (
              <>
                <div className="text-base md:text-lg font-semibold text-[--color-primary] mb-1">
                  {produtoMaisRemovido.nome}
                </div>
                <div className="text-sm text-[--color-muted-foreground]">
                  {produtoMaisRemovido.total} remoções
                </div>
              </>
            ) : (
              <div className="text-sm text-zinc-400 text-center py-2">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </DraggableCard>
      )}

      {visibleCards.desvioMedia && (
        <DraggableCard
          ref={refs.desvioMedia}
          type="desvioMedia"
          position={positions.desvioMedia || { x: 0, y: 0 }}
          isDragging={isDragging === 'desvioMedia'}
          onMouseDown={(e) => onMouseDown('desvioMedia', e)}
          onTouchStart={(e) => onTouchStart('desvioMedia', e)}
          onRemove={() => onRemoveCard('desvioMedia')}
          style={cardStyles.desvioMedia}
        >
          <div className="text-sm font-medium text-[--color-muted-foreground] mb-2">
            Desvio da Média Histórica
          </div>
          {desvioMedia ? (
            <div>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[--color-muted-foreground]">Semana atual:</span>
                  <span className="text-sm font-semibold text-[--color-primary]">
                    R$ {desvioMedia.semanaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[--color-muted-foreground]">Média histórica:</span>
                  <span className="text-sm font-semibold text-[--color-primary]">
                    R$ {desvioMedia.mediaHistorica.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-semibold ${
                  desvioMedia.percentualDesvio >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {desvioMedia.percentualDesvio >= 0 ? '+' : ''}{desvioMedia.percentualDesvio.toFixed(1)}%
                </span>
                <span className={`text-xs ${
                  desvioMedia.percentualDesvio >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {desvioMedia.percentualDesvio >= 0 ? 'acima' : 'abaixo'} da média
                </span>
                <span className={desvioMedia.percentualDesvio >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {desvioMedia.percentualDesvio >= 0 ? '🔺' : '🔻'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-lg text-zinc-400">—</div>
          )}
        </DraggableCard>
      )}

      {visibleCards.tempoMedioEntrega && (
        <DraggableCard
          ref={refs.tempoMedioEntrega}
          type="tempoMedioEntrega"
          position={positions.tempoMedioEntrega || { x: 0, y: 0 }}
          isDragging={isDragging === 'tempoMedioEntrega'}
          onMouseDown={(e) => onMouseDown('tempoMedioEntrega', e)}
          onTouchStart={(e) => onTouchStart('tempoMedioEntrega', e)}
          onRemove={() => onRemoveCard('tempoMedioEntrega')}
          style={cardStyles.tempoMedioEntrega}
        >
          <div className="text-sm font-medium text-[--color-muted-foreground] mb-2">
            Tempo Médio de Entrega
          </div>
          {tempoMedioEntrega ? (
            <div>
              <div className="text-xl md:text-3xl font-semibold text-[--color-primary] mb-2">
                {tempoMedioEntrega.tempoMedio.toFixed(0)} min
              </div>
              <div className="flex items-center gap-2 text-sm">
                {tempoMedioEntrega.variacao !== 0 && (
                  <>
                    <span className={tempoMedioEntrega.variacao >= 0 ? 'text-red-600' : 'text-green-600'}>
                      {tempoMedioEntrega.variacao >= 0 ? '▲' : '▼'}
                    </span>
                    <span className={tempoMedioEntrega.variacao >= 0 ? 'text-red-600' : 'text-green-600'}>
                      {Math.abs(tempoMedioEntrega.variacao).toFixed(1)}% vs período anterior
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xl md:text-3xl font-semibold text-[--color-primary]">—</div>
          )}
        </DraggableCard>
      )}
    </div>
  );
}

