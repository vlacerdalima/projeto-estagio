'use client';

import { useRef, useEffect, useState } from 'react';
import DraggableCard from './DraggableCard';
import SalesByShiftChart from "@/components/SalesByShiftChart";
import VendasPorCanalChart from "@/components/VendasPorCanalChart";
import TendenciaVendasChart from "@/components/TendenciaVendasChart";
import type { 
  VisibleCards, 
  CardType, 
  Position, 
  Period,
  VendasTurno,
  CanalData,
  TicketMedio,
  ProdutoMaisVendido,
  ProdutoMaisRemovido,
  ProdutoRanking,
  TendenciaVendas
} from '@/app/types';

interface CardsGridProps {
  visibleCards: VisibleCards;
  positions: Record<CardType, Position>;
  isDragging: CardType | null;
  period: Period;
  sales: number | null;
  revenue: number | null;
  produtoMaisVendido: ProdutoMaisVendido | null;
  produtoMaisRemovido: ProdutoMaisRemovido | null;
  vendasTurno: VendasTurno | null;
  ticketMedio: TicketMedio | null;
  vendasCanal: CanalData[];
  tendenciaVendas: TendenciaVendas | null;
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
}

export default function CardsGrid({
  visibleCards,
  positions,
  isDragging,
  period,
  sales,
  revenue,
  produtoMaisVendido,
  produtoMaisRemovido,
  vendasTurno,
  ticketMedio,
  vendasCanal,
  tendenciaVendas,
  loadingTicketMedio,
  showRanking,
  produtosRanking,
  loadingRanking,
  onMouseDown,
  onTouchStart,
  onRemoveCard,
  onToggleRanking,
  onFetchRanking,
  refs
}: CardsGridProps) {
  const [produtoPosition, setProdutoPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const GAP_PIXELS = 12; // Espaçamento fixo em pixels entre os cards

  // Calcular posição absoluta do card "produto" baseado na posição e altura do card "sales"
  useEffect(() => {
    if (!visibleCards.sales || !visibleCards.produto) {
      setProdutoPosition(null);
      return;
    }

    const calculatePosition = () => {
      if (refs.sales.current && refs.produto.current) {
        const salesCard = refs.sales.current;
        const produtoCard = refs.produto.current;
        const salesRect = salesCard.getBoundingClientRect();
        const produtoRect = produtoCard.getBoundingClientRect();
        const gridContainer = salesCard.closest('.grid');
        
        if (!gridContainer) return;
        
        const gridRect = gridContainer.getBoundingClientRect();
        
        // Calcular a largura de uma coluna do grid
        const gridComputedStyle = window.getComputedStyle(gridContainer);
        const gridGap = parseInt(gridComputedStyle.gap) || 0;
        const gridWidth = gridRect.width;
        
        // Em desktop (lg), são 3 colunas. Em tablet (md), são 2. Em mobile, 1.
        const isDesktop = window.innerWidth >= 1024;
        const isTablet = window.innerWidth >= 768;
        const numColumns = isDesktop ? 3 : (isTablet ? 2 : 1);
        const columnWidth = (gridWidth - (gridGap * (numColumns - 1))) / numColumns;
        
        // Determinar em qual coluna cada card está
        const salesColumn = Math.floor((salesRect.left - gridRect.left) / (columnWidth + gridGap));
        const produtoColumn = Math.floor((produtoRect.left - gridRect.left) / (columnWidth + gridGap));
        
        // Verificar se estão na mesma coluna
        const areInSameColumn = salesColumn === produtoColumn;
        
        // Verificar se o produto está abaixo do sales na mesma coluna
        const isProdutoBelowSales = produtoRect.top > salesRect.bottom && areInSameColumn;
        
        // Verificar se o card "turno" está visível e pode estar na mesma coluna
        // Se estiver, não usar position: absolute para evitar conflitos
        const turnoCard = refs.turno?.current;
        let shouldUseAbsolute = areInSameColumn && isProdutoBelowSales;
        
        if (turnoCard && visibleCards.turno) {
          const turnoRect = turnoCard.getBoundingClientRect();
          const turnoColumn = Math.floor((turnoRect.left - gridRect.left) / (columnWidth + gridGap));
          
          // Se o turno também está na mesma coluna do sales, não usar absolute
          // (isso acontece na tela geral)
          if (turnoColumn === salesColumn) {
            shouldUseAbsolute = false;
          }
        }
        
        // Só usar position: absolute se estiverem na mesma coluna, produto abaixo do sales,
        // e não houver conflito com o card turno
        if (shouldUseAbsolute) {
          // Posição relativa do card sales dentro do grid
          const salesTop = salesRect.top - gridRect.top;
          const salesLeft = salesRect.left - gridRect.left;
          const salesHeight = salesRect.height;
          const salesWidth = salesRect.width;
          
          // Posição absoluta do card produto = topo do sales + altura do sales + gap fixo
          const produtoTop = salesTop + salesHeight + GAP_PIXELS;
          
          setProdutoPosition({
            top: produtoTop,
            left: salesLeft,
            width: salesWidth
          });
        } else {
          // Não usar position: absolute
          setProdutoPosition(null);
        }
      }
    };

    // Calcular após um pequeno delay para garantir que o DOM está renderizado
    // Usar requestAnimationFrame para garantir que o layout foi aplicado
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }, 0);

    // Observar mudanças de tamanho do card sales, produto e reorganizações do grid
    const salesCard = refs.sales.current;
    const produtoCard = refs.produto.current;
    let resizeObserver: ResizeObserver | null = null;
    let produtoResizeObserver: ResizeObserver | null = null;
    let gridResizeObserver: ResizeObserver | null = null;
    
    if (salesCard) {
      const gridContainer = salesCard.closest('.grid');
      
      resizeObserver = new ResizeObserver(() => {
        calculatePosition();
      });
      
      resizeObserver.observe(salesCard);
      
      if (produtoCard) {
        produtoResizeObserver = new ResizeObserver(() => {
          calculatePosition();
        });
        
        produtoResizeObserver.observe(produtoCard);
      }
      
      if (gridContainer) {
        gridResizeObserver = new ResizeObserver(() => {
          calculatePosition();
        });
        
        gridResizeObserver.observe(gridContainer);
      }
    }

    return () => {
      clearTimeout(timeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (produtoResizeObserver) {
        produtoResizeObserver.disconnect();
      }
      if (gridResizeObserver) {
        gridResizeObserver.disconnect();
      }
    };
  }, [visibleCards.sales, visibleCards.produto, visibleCards.turno, sales, produtoMaisVendido, showRanking, loadingRanking, tendenciaVendas, refs.sales, refs.produto, refs.turno]);

  if (!Object.values(visibleCards).some(v => v)) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full mt-0 items-start content-start relative">
      {visibleCards.sales && (
        <DraggableCard
          ref={refs.sales}
          type="sales"
          position={positions.sales}
          isDragging={isDragging === 'sales'}
          onMouseDown={(e) => onMouseDown('sales', e)}
          onTouchStart={(e) => onTouchStart('sales', e)}
          onRemove={() => onRemoveCard('sales')}
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
        >
          <div className="text-sm font-medium text-[--color-muted-foreground] mb-2">
            Faturamento
          </div>
          <div className="text-xl md:text-3xl font-semibold text-[--color-primary]">
            {revenue ? `R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
          </div>
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
          style={produtoPosition !== null && visibleCards.sales ? {
            position: 'absolute',
            top: `${produtoPosition.top}px`,
            left: `${produtoPosition.left}px`,
            width: `${produtoPosition.width}px`,
            pointerEvents: 'auto'
          } : undefined}
        >
          <DraggableCard
            ref={refs.produto}
            type="produto"
            position={positions.produto}
            isDragging={isDragging === 'produto'}
            onMouseDown={(e) => onMouseDown('produto', e)}
            onTouchStart={(e) => onTouchStart('produto', e)}
            onRemove={() => onRemoveCard('produto')}
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

      {visibleCards.turno && (
        <DraggableCard
          ref={refs.turno}
          type="turno"
          position={positions.turno}
          isDragging={isDragging === 'turno'}
          onMouseDown={(e) => onMouseDown('turno', e)}
          onTouchStart={(e) => onTouchStart('turno', e)}
          onRemove={() => onRemoveCard('turno')}
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

      {visibleCards.ticketMedio && (
        <DraggableCard
          ref={refs.ticketMedio}
          type="ticketMedio"
          position={positions.ticketMedio}
          isDragging={isDragging === 'ticketMedio'}
          onMouseDown={(e) => onMouseDown('ticketMedio', e)}
          onTouchStart={(e) => onTouchStart('ticketMedio', e)}
          onRemove={() => onRemoveCard('ticketMedio')}
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
    </div>
  );
}

