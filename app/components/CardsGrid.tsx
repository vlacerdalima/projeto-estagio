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
  TendenciaVendas,
  DesvioMedia
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
  desvioMedia: DesvioMedia | null;
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
  sales,
  revenue,
  produtoMaisVendido,
  produtoMaisRemovido,
  vendasTurno,
  ticketMedio,
  vendasCanal,
  tendenciaVendas,
  desvioMedia,
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
  // Estado para armazenar os offsets de top calculados para cada card
  const [cardTopOffsets, setCardTopOffsets] = useState<Record<CardType, number>>({} as Record<CardType, number>);
  // Estado para armazenar qual coluna cada card está (para aplicar gap horizontal)
  const [cardColumns, setCardColumns] = useState<Record<CardType, number>>({} as Record<CardType, number>);

  // Constantes de espaçamento (definidas aqui para reutilização)
  const verticalGap = -500; // Espaçamento vertical entre cards (pixels) - valores mais negativos = menos espaço
  const horizontalGap = 12; // Espaçamento horizontal entre colunas (pixels)

  // Calcular posicionamento simples: colocar cada card no ponto mais baixo
  useEffect(() => {
    const calculateTopOffsets = () => {
      // Determinar número de colunas baseado no breakpoint
      const isDesktop = window.innerWidth >= 1024;
      const isTablet = window.innerWidth >= 768;
      const numColumns = isDesktop ? 3 : (isTablet ? 2 : 1);

      // Array para rastrear a altura do ponto mais baixo de cada coluna (em pixels)
      // Representa onde o último card nesta coluna TERMINA (offset do card + altura do card)
      const columnBottomPoints: number[] = new Array(numColumns).fill(0);
      // Array para rastrear quantos cards já foram colocados em cada coluna
      const columnCardCounts: number[] = new Array(numColumns).fill(0);
      // Rastrear os offsets e alturas de cada card na coluna (para evitar sobreposição)
      const columnCardInfo: Array<Array<{ offset: number; height: number }>> = new Array(numColumns).fill(null).map(() => []);
      const offsets: Record<CardType, number> = {} as Record<CardType, number>;
      const columns: Record<CardType, number> = {} as Record<CardType, number>;

      // Ordem de renderização dos cards (baseada na ordem do código)
      const cardOrder: CardType[] = ['sales', 'revenue', 'ticketMedio', 'turno', 'tendencia', 'canal', 'produto', 'produtoRemovido', 'desvioMedia'];

      // Processar cada card na ordem
      cardOrder.forEach((cardType) => {
        if (!visibleCards[cardType]) return;

        const cardRef = refs[cardType]?.current;
        if (!cardRef) return;

        // Calcular a altura real do card (sem marginTop aplicado ainda)
        const cardRect = cardRef.getBoundingClientRect();
        const cardHeight = cardRect.height;

        // Encontrar a coluna com o ponto mais baixo (menor altura acumulada)
        let minBottom = columnBottomPoints[0];
        let minColumn = 0;
        for (let i = 1; i < numColumns; i++) {
          if (columnBottomPoints[i] < minBottom) {
            minBottom = columnBottomPoints[i];
            minColumn = i;
          }
        }

        // Se é o primeiro card nesta coluna, offset é 0
        // Senão, offset é o ponto mais baixo da coluna + gap vertical (onde termina o card anterior + espaçamento)
        const isFirstCardInColumn = columnCardCounts[minColumn] === 0;
        
        // Calcular o offset baseado no ponto mais baixo da coluna
        let calculatedOffset: number;
        if (isFirstCardInColumn) {
          calculatedOffset = 0;
        } else {
          // O offset é calculado para que o card comece logo após o card anterior, com o gap
          // O columnBottomPoints contém a posição Y absoluta onde o último card termina
          // Precisamos calcular a posição Y do topo do último card (columnBottomPoints - altura do último card)
          // Mas como não temos essa informação, vamos usar columnBottomPoints diretamente
          
          // Calcular onde o card anterior termina
          const previousCardBottom = columnBottomPoints[minColumn];
          
          // Calcular onde este card deve começar
          // Se verticalGap é positivo, o card começa após o anterior + gap
          // Se verticalGap é negativo, o card pode começar antes do anterior terminar (sobreposição)
          calculatedOffset = previousCardBottom + verticalGap;
          
          // Garantir que não há sobreposição total mesmo com gap negativo
          // Verificar se este offset resultaria em sobreposição com cards anteriores na mesma coluna
          const existingCards = columnCardInfo[minColumn];
          if (existingCards.length > 0) {
            // Encontrar o offset mínimo que não sobreponha nenhum card anterior
            // Um card sobrepõe outro se seus intervalos [offset, offset+height] se intersectam
            let minSafeOffset = calculatedOffset;
            
            // Verificar contra todos os cards anteriores na coluna
            for (let i = 0; i < existingCards.length; i++) {
              const prevCard = existingCards[i];
              const prevCardTop = prevCard.offset;
              const prevCardBottom = prevCard.offset + prevCard.height;
              const newCardTop = calculatedOffset;
              const newCardBottom = calculatedOffset + cardHeight;
              
              // Há sobreposição se os intervalos se intersectam
              if (newCardTop < prevCardBottom && newCardBottom > prevCardTop) {
                // Há sobreposição - ajustar para começar logo após o card anterior
                minSafeOffset = Math.max(minSafeOffset, prevCardBottom + 0); // Margem mínima (0 = sem espaço extra)
              }
            }
            
            calculatedOffset = minSafeOffset;
          }
          
          if (calculatedOffset < 0) {
            // Se o offset seria negativo, garantir pelo menos um pequeno espaço
            calculatedOffset = 0;
          }
        }
        
        // Garantir que o offset nunca seja negativo
        calculatedOffset = Math.max(0, calculatedOffset);
        offsets[cardType] = calculatedOffset;
        columns[cardType] = minColumn;
        
        // Armazenar este card na lista de cards da coluna (offset + altura)
        columnCardInfo[minColumn].push({ offset: calculatedOffset, height: cardHeight });

        // Atualizar o ponto mais baixo desta coluna
        // O ponto mais baixo é onde termina este card (posição top + altura do card)
        if (isFirstCardInColumn) {
          // Primeiro card: altura do card
          columnBottomPoints[minColumn] = cardHeight;
        } else {
          // Cards subsequentes: posição top + altura do card
          // A posição top é o offset calculado
          columnBottomPoints[minColumn] = calculatedOffset + cardHeight;
        }
        
        columnCardCounts[minColumn]++;
      });

      setCardTopOffsets(offsets);
      setCardColumns(columns);
    };

    // Calcular após os cards renderizarem completamente e receberem dados
    // Usar múltiplos requestAnimationFrame para garantir que o layout foi aplicado
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            calculateTopOffsets();
          });
        });
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [visibleCards, refs, sales, revenue, vendasTurno, tendenciaVendas, vendasCanal, produtoMaisVendido, produtoMaisRemovido, ticketMedio, desvioMedia, showRanking, loadingRanking]);

  // Verificar e corrigir posições iniciais dos cards para garantir que não spawnem acima da linha preta
  useEffect(() => {
    if (!onPositionChange) return;

    const checkAndFixPositions = () => {
      const gridContainer = document.querySelector('.grid');
      if (!gridContainer) return;

      const gridRect = gridContainer.getBoundingClientRect();
      const lineY = gridRect.top;

      // Verificar cada card visível e ajustar se necessário
      Object.keys(visibleCards).forEach((cardType) => {
        if (!visibleCards[cardType as keyof typeof visibleCards]) return;

        const cardRef = refs[cardType as CardType]?.current;
        if (!cardRef) return;

        const cardRect = cardRef.getBoundingClientRect();
        const currentPosition = positions[cardType as CardType] || { x: 0, y: 0 };
        
        // Calcular a posição base do card (sem transform)
        const baseTop = cardRect.top - currentPosition.y;
        const cardTop = baseTop + currentPosition.y;

        // Se o topo do card está acima da linha preta, ajustar
        if (cardTop < lineY) {
          // Calcular o ajuste necessário para manter o card abaixo da linha
          const adjustmentY = lineY - baseTop;
          const newPosition = {
            x: currentPosition.x,
            y: adjustmentY
          };

          // Atualizar a posição apenas se realmente precisar ajustar
          if (Math.abs(newPosition.y - currentPosition.y) > 1) {
            onPositionChange(cardType as CardType, newPosition);
          }
        }
      });
    };

    // Verificar após um pequeno delay para garantir que o DOM está renderizado
    // Usar requestAnimationFrame para garantir que o layout foi aplicado
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        checkAndFixPositions();
      });
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [visibleCards, positions, refs, onPositionChange]);

  if (!Object.values(visibleCards).some(v => v)) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full mt-0 items-start content-start relative" style={{ gap: '0' }}>
      {visibleCards.sales && (
        <DraggableCard
          ref={refs.sales}
          type="sales"
          position={positions.sales}
          isDragging={isDragging === 'sales'}
          onMouseDown={(e) => onMouseDown('sales', e)}
          onTouchStart={(e) => onTouchStart('sales', e)}
          onRemove={() => onRemoveCard('sales')}
          style={{
            ...(cardTopOffsets.sales !== undefined ? { marginTop: `${cardTopOffsets.sales}px` } : {}),
            ...(cardColumns.sales !== undefined && cardColumns.sales > 0 ? { marginLeft: `${cardColumns.sales * horizontalGap}px` } : {})
          }}
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
          style={{
            ...(cardTopOffsets.revenue !== undefined ? { marginTop: `${cardTopOffsets.revenue}px` } : {}),
            ...(cardColumns.revenue !== undefined && cardColumns.revenue > 0 ? { marginLeft: `${cardColumns.revenue * horizontalGap}px` } : {})
          }}
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
          style={{
            ...(cardTopOffsets.ticketMedio !== undefined ? { marginTop: `${cardTopOffsets.ticketMedio}px` } : {}),
            ...(cardColumns.ticketMedio !== undefined && cardColumns.ticketMedio > 0 ? { marginLeft: `${cardColumns.ticketMedio * horizontalGap}px` } : {})
          }}
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
          style={{
            ...(cardTopOffsets.turno !== undefined ? { marginTop: `${cardTopOffsets.turno}px` } : {}),
            ...(cardColumns.turno !== undefined && cardColumns.turno > 0 ? { marginLeft: `${cardColumns.turno * horizontalGap}px` } : {})
          }}
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
          style={{
            ...(cardTopOffsets.tendencia !== undefined ? { marginTop: `${cardTopOffsets.tendencia}px` } : {}),
            ...(cardColumns.tendencia !== undefined && cardColumns.tendencia > 0 ? { marginLeft: `${cardColumns.tendencia * horizontalGap}px` } : {})
          }}
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
          style={{
            ...(cardTopOffsets.canal !== undefined ? { marginTop: `${cardTopOffsets.canal}px` } : {}),
            ...(cardColumns.canal !== undefined && cardColumns.canal > 0 ? { marginLeft: `${cardColumns.canal * horizontalGap}px` } : {})
          }}
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
            style={{
              ...(cardTopOffsets.produto !== undefined ? { marginTop: `${cardTopOffsets.produto}px` } : {}),
              ...(cardColumns.produto !== undefined && cardColumns.produto > 0 ? { marginLeft: `${cardColumns.produto * horizontalGap}px` } : {})
            }}
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
          style={{
            ...(cardTopOffsets.produtoRemovido !== undefined ? { marginTop: `${cardTopOffsets.produtoRemovido}px` } : {}),
            ...(cardColumns.produtoRemovido !== undefined && cardColumns.produtoRemovido > 0 ? { marginLeft: `${cardColumns.produtoRemovido * horizontalGap}px` } : {})
          }}
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
          style={{
            ...(cardTopOffsets.desvioMedia !== undefined ? { marginTop: `${cardTopOffsets.desvioMedia}px` } : {}),
            ...(cardColumns.desvioMedia !== undefined && cardColumns.desvioMedia > 0 ? { marginLeft: `${cardColumns.desvioMedia * horizontalGap}px` } : {})
          }}
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
    </div>
  );
}

