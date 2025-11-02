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
  TempoMedioEntrega,
  SazonalidadeProdutos,
  RegiaoEntrega
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
  sazonalidadeProdutos: SazonalidadeProdutos | null;
  loadingTicketMedio: boolean;
  showRanking: boolean;
  produtosRanking: ProdutoRanking[];
  loadingRanking: boolean;
  showRegioes: boolean;
  regioesEntrega: RegiaoEntrega[];
  loadingRegioes: boolean;
  selectedRegiao: string;
  onMouseDown: (type: CardType, e: React.MouseEvent) => void;
  onTouchStart: (type: CardType, e: React.TouchEvent) => void;
  refs: Record<CardType, React.RefObject<HTMLDivElement | null>>;
  onRemoveCard: (type: CardType) => void;
  onToggleRanking: () => void;
  onFetchRanking: () => void;
  onToggleRegioes: () => void;
  onFetchRegioes?: (search?: string) => void;
  onSelectRegiao: (regiao: string) => void;
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
  sazonalidadeProdutos,
  loadingTicketMedio,
  showRanking,
  produtosRanking,
  loadingRanking,
  showRegioes,
  regioesEntrega,
  loadingRegioes,
  selectedRegiao,
  onMouseDown,
  onTouchStart,
  onRemoveCard,
  onToggleRanking,
  onFetchRanking,
  onToggleRegioes,
  onFetchRegioes,
  onSelectRegiao,
  refs,
  onPositionChange
}: CardsGridProps) {
  // Estados para calcular posições iniciais dos cards
  const [cardStyles, setCardStyles] = useState<Record<CardType, React.CSSProperties>>({} as Record<CardType, React.CSSProperties>);
  const hasCalculatedInitialStyles = useRef(false);
  const previousTemplateRef = useRef<TemplateType>(currentTemplate);
  const [filtroRegiao, setFiltroRegiao] = useState<string>('');

  // Estado para rastrear se já houve uma busca (para saber quando restaurar top 100)
  const hasSearchedRef = useRef(false);

  // Buscar regiões no banco quando o usuário digitar (para mostrar regiões ocultas)
  useEffect(() => {
    if (!showRegioes || !onFetchRegioes) return;
    
    // Se há texto de busca, buscar no banco para mostrar regiões ocultas
    if (filtroRegiao.trim() !== '') {
      hasSearchedRef.current = true;
      // Debounce para não buscar a cada tecla digitada
      const timeoutId = setTimeout(() => {
        onFetchRegioes(filtroRegiao);
      }, 300); // Aguarda 300ms após parar de digitar
      
      return () => clearTimeout(timeoutId);
    } else if (hasSearchedRef.current) {
      // Se o usuário apagou a busca e já havia pesquisado antes, restaurar top 100
      hasSearchedRef.current = false;
      onFetchRegioes(); // Busca sem parâmetro = top 100
    }
    // Se não há busca e nunca houve busca, manter as top 100 já carregadas
  }, [filtroRegiao, showRegioes, onFetchRegioes]);

  // Resetar cálculo quando o template mudar
  useEffect(() => {
    if (previousTemplateRef.current !== currentTemplate) {
      hasCalculatedInitialStyles.current = false;
      previousTemplateRef.current = currentTemplate;
    }
  }, [currentTemplate]);

  // Resetar filtro e estado de busca quando o dropdown fechar
  useEffect(() => {
    if (!showRegioes) {
      setFiltroRegiao('');
      hasSearchedRef.current = false; // Resetar flag de busca
    }
  }, [showRegioes]);

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
      const allCardsOrder = ['sales', 'revenue', 'ticketMedio', 'turno', 'tendencia', 'canal', 'produto', 'produtoRemovido', 'desvioMedia', 'tempoMedioEntrega', 'sazonalidade'];
      
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
        <div 
          className={showRegioes ? 'relative z-[9999]' : ''}
        >
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
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-xl md:text-3xl font-semibold text-[--color-primary] mb-1">
                    {tempoMedioEntrega.tempoMedio.toFixed(0)} min
                  </div>
                  <div className="text-sm text-[--color-muted-foreground]">
                    {selectedRegiao === 'todas' ? 'Todas as regiões' : selectedRegiao}
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!showRegioes && regioesEntrega.length === 0) {
                      // fetchRegioes será chamado via onToggleRegioes em page.tsx
                    }
                    onToggleRegioes();
                  }}
                  className="flex items-center justify-center w-6 h-6 text-zinc-400 hover:text-[#fa8072] transition-colors"
                  title="Ver regiões"
                >
                  {showRegioes ? '▼' : '▶'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xl md:text-3xl font-semibold text-[--color-primary]">—</div>
          )}
          </DraggableCard>
          {showRegioes && (
            <div className="absolute top-full left-0 mt-4 bg-white border border-[--color-primary]/30 rounded-b-lg shadow-lg p-4 max-h-[400px] overflow-y-auto z-[10000] min-w-[300px] max-w-[400px]">
              <input
                type="text"
                placeholder="Filtrar região..."
                value={filtroRegiao}
                onChange={(e) => setFiltroRegiao(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 mb-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#fa8072]/50 focus:border-[#fa8072] text-black placeholder:text-gray-400"
                autoFocus
              />
              <div className="space-y-1">
                {loadingRegioes ? (
                  <div className="text-xs text-zinc-500 text-center py-4">Carregando dados...</div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onSelectRegiao('todas');
                        setFiltroRegiao('');
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors whitespace-nowrap ${
                        selectedRegiao === 'todas'
                          ? 'bg-[#fa8072]/20 font-semibold text-[#fa8072]'
                          : 'hover:bg-gray-100 text-zinc-900'
                      }`}
                    >
                      Todas as regiões
                    </button>
                    {(() => {
                      // Se há busca, mostrar todas as regiões retornadas (já filtradas no banco)
                      // Se não há busca, mostrar todas as regiões carregadas (top 100)
                      const regioesExibidas = filtroRegiao.trim() !== '' 
                        ? regioesEntrega // Já filtradas no banco
                        : regioesEntrega; // Top 100 já carregadas
                      
                      return regioesExibidas.length > 0 ? (
                        regioesExibidas.map((regiao, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              onSelectRegiao(regiao.regiao);
                              setFiltroRegiao('');
                            }}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors whitespace-nowrap ${
                              selectedRegiao === regiao.regiao
                                ? 'bg-[#fa8072]/20 font-semibold text-[#fa8072]'
                                : 'hover:bg-gray-100 text-zinc-900'
                            }`}
                          >
                            <span>{regiao.regiao}</span>
                            <span className="text-xs text-zinc-500 ml-2">{regiao.tempoMedioMinutos} min</span>
                          </button>
                        ))
                      ) : filtroRegiao ? (
                        <div className="text-xs text-zinc-500 text-center py-2">Nenhuma região encontrada</div>
                      ) : (
                        <div className="text-xs text-zinc-500 text-center py-2">Sem regiões disponíveis</div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {visibleCards.sazonalidade && (
        <DraggableCard
          ref={refs.sazonalidade}
          type="sazonalidade"
          position={positions.sazonalidade || { x: 0, y: 0 }}
          isDragging={isDragging === 'sazonalidade'}
          onMouseDown={(e) => onMouseDown('sazonalidade', e)}
          onTouchStart={(e) => onTouchStart('sazonalidade', e)}
          onRemove={() => onRemoveCard('sazonalidade')}
          style={cardStyles.sazonalidade}
        >
          <div className="text-sm font-medium text-[--color-muted-foreground] mb-2">
            Produtos Sazonais
          </div>
          <div className="text-xs text-gray-400 mb-2">
            Diferença aos períodos médios
          </div>
          {sazonalidadeProdutos && sazonalidadeProdutos.produtos.length > 0 ? (
            <div className="space-y-2">
              {sazonalidadeProdutos.produtos.map((produto, index) => (
                <div key={index} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate flex-1" title={produto.nome}>
                      {produto.nome}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700 ml-2 flex-shrink-0">
                      +{produto.lift}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {produto.mesPico}
                    </span>
                    {produto.pontosSazonalidade && produto.pontosSazonalidade.length > 0 && (
                      <div className="flex items-end gap-0.5 h-8 w-20">
                        {produto.pontosSazonalidade.map((ponto, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-blue-400 to-blue-600 rounded-t"
                            style={{ height: `${(ponto / 250) * 100}%` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic">
              Nenhum padrão sazonal forte encontrado no período
            </div>
          )}
        </DraggableCard>
      )}
    </div>
  );
}

