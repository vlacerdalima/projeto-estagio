'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import type { Period } from '@/app/types';
import { useRestaurantData } from '@/app/hooks/useRestaurantData';

interface Restaurant {
  id: number;
  name: string;
}

interface ComparisonViewProps {
  period: Period;
  onAddComparisonCard?: (cardType: ComparisonCardType) => void;
  onRemoveComparisonCard?: (cardType: ComparisonCardType) => void;
  visibleComparisonCards?: ComparisonCardType[];
}

export type ComparisonCardType = 'sales' | 'revenue' | 'produto' | 'ticketMedio' | 'turno';

export default function ComparisonView({ 
  period, 
  onAddComparisonCard,
  onRemoveComparisonCard,
  visibleComparisonCards: externalVisibleCards
}: ComparisonViewProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant1, setSelectedRestaurant1] = useState<number | null>(null);
  const [selectedRestaurant2, setSelectedRestaurant2] = useState<number | null>(null);
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const dropdown1Ref = useRef<HTMLDivElement>(null);
  const dropdown2Ref = useRef<HTMLDivElement>(null);
  
  // Sistema de cards visíveis na comparação
  const [internalVisibleCards, setInternalVisibleCards] = useState<ComparisonCardType[]>(['sales', 'revenue']);
  const visibleComparisonCards = externalVisibleCards || internalVisibleCards;
  
  const availableCards: { type: ComparisonCardType; label: string; maxSlots: number }[] = [
    { type: 'sales', label: 'Vendas', maxSlots: 2 },
    { type: 'revenue', label: 'Faturamento', maxSlots: 2 },
    { type: 'produto', label: 'Produto Mais Vendido', maxSlots: 2 },
    { type: 'ticketMedio', label: 'Ticket Médio', maxSlots: 2 },
    { type: 'turno', label: 'Vendas por Turno', maxSlots: 2 }
  ];
  
  const removeCard = (cardType: ComparisonCardType) => {
    if (onRemoveComparisonCard) {
      onRemoveComparisonCard(cardType);
    } else {
      setInternalVisibleCards(prev => prev.filter(c => c !== cardType));
    }
  };

  const data1 = useRestaurantData(selectedRestaurant1, period);
  const data2 = useRestaurantData(selectedRestaurant2, period);

  useEffect(() => {
    fetch('/api/restaurantes')
      .then(res => res.json())
      .then(data => setRestaurants(data))
      .catch(err => console.error('Erro ao carregar restaurantes:', err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;
      if (showDropdown1 && dropdown1Ref.current && !dropdown1Ref.current.contains(target)) {
        setShowDropdown1(false);
      }
      if (showDropdown2 && dropdown2Ref.current && !dropdown2Ref.current.contains(target)) {
        setShowDropdown2(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown1, showDropdown2]);

  const filtered1 = restaurants.filter(r =>
    r.name.toLowerCase().includes(search1.toLowerCase())
  );
  const filtered2 = restaurants.filter(r =>
    r.name.toLowerCase().includes(search2.toLowerCase())
  );

  const restaurant1Name = restaurants.find(r => r.id === selectedRestaurant1)?.name || 'Selecionar Restaurante';
  const restaurant2Name = restaurants.find(r => r.id === selectedRestaurant2)?.name || 'Selecionar Restaurante';

  // Função para comparar valores e determinar qual é melhor
  const compareValues = (val1: number | null, val2: number | null, higherIsBetter: boolean = true) => {
    if (val1 === null || val2 === null) return null;
    if (val1 === val2) return null;
    if (higherIsBetter) {
      return val1 > val2 ? 'win' : 'lose';
    } else {
      return val1 < val2 ? 'win' : 'lose';
    }
  };

  // Renderizar um card do lado esquerdo
  const renderLeftCard = (cardType: ComparisonCardType) => {
    switch (cardType) {
      case 'sales':
        return (
          <Card className="border-[--color-primary]/30 p-3 relative h-full">
            <div className="flex items-start justify-between mb-1">
              <div className="text-xs font-medium text-[--color-muted-foreground]">
                Vendas
              </div>
              {selectedRestaurant2 && data1.data.sales !== null && data2.data.sales !== null && (() => {
                const comparison = compareValues(data1.data.sales, data2.data.sales);
                return comparison ? (
                  <span className={`text-lg ${comparison === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison === 'win' ? '▲' : '▼'}
                  </span>
                ) : null;
              })()}
            </div>
            <div className="text-lg font-semibold text-[--color-primary]">
              {data1.data.sales?.toLocaleString() || '—'}
            </div>
          </Card>
        );
      case 'revenue':
        return (
          <Card className="border-[--color-primary]/30 p-3 relative h-full">
            <div className="flex items-start justify-between mb-1">
              <div className="text-xs font-medium text-[--color-muted-foreground]">
                Faturamento
              </div>
              {selectedRestaurant2 && data1.data.revenue !== null && data2.data.revenue !== null && (() => {
                const comparison = compareValues(data1.data.revenue, data2.data.revenue);
                return comparison ? (
                  <span className={`text-lg ${comparison === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison === 'win' ? '▲' : '▼'}
                  </span>
                ) : null;
              })()}
            </div>
            <div className="text-lg font-semibold text-[--color-primary]">
              {data1.data.revenue ? `R$ ${data1.data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
            </div>
          </Card>
        );
      case 'produto':
        return (
          <Card className="border-[--color-primary]/30 p-3 h-full">
            <div className="text-xs font-medium text-[--color-muted-foreground] mb-1">
              Produto Mais Vendido
            </div>
            <div className="text-sm font-semibold text-[--color-primary]">
              {data1.data.produtoMaisVendido?.nome || '—'}
            </div>
            <div className="text-xs text-[--color-muted-foreground]">
              {data1.data.produtoMaisVendido?.total ? `${data1.data.produtoMaisVendido.total} unidades` : ''}
            </div>
          </Card>
        );
      case 'ticketMedio':
        return (
          <Card className="border-[--color-primary]/30 p-3 relative h-full">
            <div className="flex items-start justify-between mb-1">
              <div className="text-xs font-medium text-[--color-muted-foreground]">
                Ticket Médio
              </div>
              {selectedRestaurant2 && data1.data.ticketMedio !== null && data2.data.ticketMedio !== null && (() => {
                const comparison = compareValues(
                  data1.data.ticketMedio?.ticketMedio || null,
                  data2.data.ticketMedio?.ticketMedio || null
                );
                return comparison ? (
                  <span className={`text-lg ${comparison === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison === 'win' ? '▲' : '▼'}
                  </span>
                ) : null;
              })()}
            </div>
            {data1.loadingTicketMedio ? (
              <div className="text-xs text-zinc-400">Carregando...</div>
            ) : data1.data.ticketMedio ? (
              <div>
                <div className="text-lg font-semibold text-[--color-primary]">
                  R$ {data1.data.ticketMedio.ticketMedio.toFixed(2).replace('.', ',')}
                </div>
                {data1.data.ticketMedio.variacao !== 0 && (
                  <div className="flex items-center gap-1 text-xs mt-1">
                    <span className={data1.data.ticketMedio.variacao >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {data1.data.ticketMedio.variacao >= 0 ? '▲' : '▼'}
                    </span>
                    <span className={data1.data.ticketMedio.variacao >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(data1.data.ticketMedio.variacao).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-lg font-semibold text-[--color-primary]">—</div>
            )}
          </Card>
        );
      case 'turno':
        return data1.data.vendasTurno ? (
          <Card className="border-[--color-primary]/30 p-3 h-full">
            <div className="text-xs font-medium text-[--color-muted-foreground] mb-2">
              Vendas por Turno
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span>Manhã:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{data1.data.vendasTurno.manha}</span>
                  {selectedRestaurant2 && data2.data.vendasTurno && (() => {
                    const comparison = compareValues(data1.data.vendasTurno.manha, data2.data.vendasTurno.manha);
                    return comparison ? (
                      <span className={`text-sm ${comparison === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                        {comparison === 'win' ? '▲' : '▼'}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Tarde:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{data1.data.vendasTurno.tarde}</span>
                  {selectedRestaurant2 && data2.data.vendasTurno && (() => {
                    const comparison = compareValues(data1.data.vendasTurno.tarde, data2.data.vendasTurno.tarde);
                    return comparison ? (
                      <span className={`text-sm ${comparison === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                        {comparison === 'win' ? '▲' : '▼'}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Noite:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{data1.data.vendasTurno.noite}</span>
                  {selectedRestaurant2 && data2.data.vendasTurno && (() => {
                    const comparison = compareValues(data1.data.vendasTurno.noite, data2.data.vendasTurno.noite);
                    return comparison ? (
                      <span className={`text-sm ${comparison === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                        {comparison === 'win' ? '▲' : '▼'}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          </Card>
        ) : null;
      default:
        return null;
    }
  };

  // Renderizar um card do lado direito
  const renderRightCard = (cardType: ComparisonCardType) => {
    switch (cardType) {
      case 'sales':
        return (
          <Card className="border-[--color-primary]/30 p-3 relative h-full">
            <div className="flex items-start justify-between mb-1">
              <div className="text-xs font-medium text-[--color-muted-foreground]">
                Vendas
              </div>
              {selectedRestaurant1 && data1.data.sales !== null && data2.data.sales !== null && (() => {
                const comparison = compareValues(data2.data.sales, data1.data.sales);
                return comparison ? (
                  <span className={`text-lg ${comparison === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison === 'win' ? '▲' : '▼'}
                  </span>
                ) : null;
              })()}
            </div>
            <div className="text-lg font-semibold text-[--color-primary]">
              {data2.data.sales?.toLocaleString() || '—'}
            </div>
          </Card>
        );
      case 'revenue':
        return (
          <Card className="border-[--color-primary]/30 p-3 relative h-full">
            <div className="flex items-start justify-between mb-1">
              <div className="text-xs font-medium text-[--color-muted-foreground]">
                Faturamento
              </div>
              {selectedRestaurant1 && data1.data.revenue !== null && data2.data.revenue !== null && (() => {
                const comparison = compareValues(data2.data.revenue, data1.data.revenue);
                return comparison ? (
                  <span className={`text-lg ${comparison === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison === 'win' ? '▲' : '▼'}
                  </span>
                ) : null;
              })()}
            </div>
            <div className="text-lg font-semibold text-[--color-primary]">
              {data2.data.revenue ? `R$ ${data2.data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
            </div>
          </Card>
        );
      case 'produto':
        return (
          <Card className="border-[--color-primary]/30 p-3 h-full">
            <div className="text-xs font-medium text-[--color-muted-foreground] mb-1">
              Produto Mais Vendido
            </div>
            <div className="text-sm font-semibold text-[--color-primary]">
              {data2.data.produtoMaisVendido?.nome || '—'}
            </div>
            <div className="text-xs text-[--color-muted-foreground]">
              {data2.data.produtoMaisVendido?.total ? `${data2.data.produtoMaisVendido.total} unidades` : ''}
            </div>
          </Card>
        );
      case 'ticketMedio':
        return (
          <Card className="border-[--color-primary]/30 p-3 relative h-full">
            <div className="flex items-start justify-between mb-1">
              <div className="text-xs font-medium text-[--color-muted-foreground]">
                Ticket Médio
              </div>
              {selectedRestaurant1 && data1.data.ticketMedio !== null && data2.data.ticketMedio !== null && (() => {
                const comparison = compareValues(
                  data2.data.ticketMedio?.ticketMedio || null,
                  data1.data.ticketMedio?.ticketMedio || null
                );
                return comparison ? (
                  <span className={`text-lg ${comparison === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison === 'win' ? '▲' : '▼'}
                  </span>
                ) : null;
              })()}
            </div>
            {data2.loadingTicketMedio ? (
              <div className="text-xs text-zinc-400">Carregando...</div>
            ) : data2.data.ticketMedio ? (
              <div>
                <div className="text-lg font-semibold text-[--color-primary]">
                  R$ {data2.data.ticketMedio.ticketMedio.toFixed(2).replace('.', ',')}
                </div>
                {data2.data.ticketMedio.variacao !== 0 && (
                  <div className="flex items-center gap-1 text-xs mt-1">
                    <span className={data2.data.ticketMedio.variacao >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {data2.data.ticketMedio.variacao >= 0 ? '▲' : '▼'}
                    </span>
                    <span className={data2.data.ticketMedio.variacao >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(data2.data.ticketMedio.variacao).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-lg font-semibold text-[--color-primary]">—</div>
            )}
          </Card>
        );
      case 'turno':
        return data2.data.vendasTurno ? (
          <Card className="border-[--color-primary]/30 p-3 h-full">
            <div className="text-xs font-medium text-[--color-muted-foreground] mb-2">
              Vendas por Turno
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span>Manhã:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{data2.data.vendasTurno.manha}</span>
                  {selectedRestaurant1 && data1.data.vendasTurno && (() => {
                    const comparison = compareValues(data2.data.vendasTurno.manha, data1.data.vendasTurno.manha);
                    return comparison ? (
                      <span className={`text-sm ${comparison === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                        {comparison === 'win' ? '▲' : '▼'}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Tarde:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{data2.data.vendasTurno.tarde}</span>
                  {selectedRestaurant1 && data1.data.vendasTurno && (() => {
                    const comparison = compareValues(data2.data.vendasTurno.tarde, data1.data.vendasTurno.tarde);
                    return comparison ? (
                      <span className={`text-sm ${comparison === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                        {comparison === 'win' ? '▲' : '▼'}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Noite:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{data2.data.vendasTurno.noite}</span>
                  {selectedRestaurant1 && data1.data.vendasTurno && (() => {
                    const comparison = compareValues(data2.data.vendasTurno.noite, data1.data.vendasTurno.noite);
                    return comparison ? (
                      <span className={`text-sm ${comparison === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                        {comparison === 'win' ? '▲' : '▼'}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          </Card>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-0 w-full min-h-[400px]">
      {/* Headers dos Restaurantes */}
      <div className="flex gap-0 mb-6">
        <div className="flex-1 pr-3">
          <div className="relative" ref={dropdown1Ref}>
            <button
              onClick={() => setShowDropdown1(!showDropdown1)}
              className="w-full px-5 py-3 text-lg font-bold text-zinc-900 bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-lg text-center transition-all shadow-sm hover:shadow-md"
            >
              {restaurant1Name}
            </button>
            {showDropdown1 && (
              <Card className="absolute z-50 mt-2 w-full overflow-y-auto border-2 border-gray-300 bg-white shadow-xl max-h-64">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search1}
                  onChange={(e) => setSearch1(e.target.value)}
                  className="w-full border-b border-gray-300 px-4 py-2 outline-none bg-white"
                />
                <div className="max-h-48 overflow-y-auto">
                  {filtered1.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedRestaurant1(r.id);
                        setShowDropdown1(false);
                        setSearch1('');
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-100 active:bg-gray-200 transition-colors text-sm font-medium text-zinc-800"
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
        <div className="w-[60px]"></div>
        <div className="flex-1 pl-3">
          <div className="relative" ref={dropdown2Ref}>
            <button
              onClick={() => setShowDropdown2(!showDropdown2)}
              className="w-full px-5 py-3 text-lg font-bold text-zinc-900 bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-lg text-center transition-all shadow-sm hover:shadow-md"
            >
              {restaurant2Name}
            </button>
            {showDropdown2 && (
              <Card className="absolute z-50 mt-2 w-full overflow-y-auto border-2 border-gray-300 bg-white shadow-xl max-h-64">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search2}
                  onChange={(e) => setSearch2(e.target.value)}
                  className="w-full border-b border-gray-300 px-4 py-2 outline-none bg-white"
                />
                <div className="max-h-48 overflow-y-auto">
                  {filtered2.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedRestaurant2(r.id);
                        setShowDropdown2(false);
                        setSearch2('');
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-100 active:bg-gray-200 transition-colors text-sm font-medium text-zinc-800"
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Cards lado a lado com X centralizado */}
      {selectedRestaurant1 && selectedRestaurant2 && (
        <div className="flex flex-col gap-3">
          {visibleComparisonCards.map((cardType) => {
            const leftCard = renderLeftCard(cardType);
            const rightCard = renderRightCard(cardType);
            
            if (!leftCard || !rightCard) return null;

            return (
              <div key={cardType} className="flex items-stretch gap-2">
                {/* Card Esquerdo */}
                <div className="flex-1 min-h-[80px]">
                  {leftCard}
                </div>
                
                {/* Botão X Central */}
                <div className="flex items-center justify-center w-10">
                  <button
                    onClick={() => removeCard(cardType)}
                    className="flex items-center justify-center w-full h-full min-h-[80px] text-red-600 hover:text-red-700 hover:bg-red-50 border-2 border-red-400 border-dashed rounded-lg transition-all shadow-sm hover:shadow-md"
                    title={`Remover ${availableCards.find(c => c.type === cardType)?.label}`}
                  >
                    <span className="text-xl font-bold">✕</span>
                  </button>
                </div>
                
                {/* Card Direito */}
                <div className="flex-1 min-h-[80px]">
                  {rightCard}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
