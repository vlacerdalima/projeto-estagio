'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Period = 'mensal' | 'anual';

interface PeriodSelectorProps {
  selected: Period;
  onSelect: (period: Period) => void;
  onYearChange?: (year: string | number) => void;
  onMonthChange?: (month: string | number) => void;
  restaurantId?: number | null;
  restaurantIds?: number[];  // Para comparação - múltiplos restaurantes
}

export default function PeriodSelector({ selected, onSelect, onYearChange, onMonthChange, restaurantId, restaurantIds }: PeriodSelectorProps) {
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string | number>('todos');
  const [selectedMonth, setSelectedMonth] = useState<string | number>('todos');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [monthsByYear, setMonthsByYear] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);

  // Meses com labels
  const monthLabels: Record<number, string> = {
    1: 'Janeiro',
    2: 'Fevereiro',
    3: 'Março',
    4: 'Abril',
    5: 'Maio',
    6: 'Junho',
    7: 'Julho',
    8: 'Agosto',
    9: 'Setembro',
    10: 'Outubro',
    11: 'Novembro',
    12: 'Dezembro'
  };

  // Buscar períodos disponíveis quando restaurante(s) for(em) selecionado(s)
  useEffect(() => {
    if (restaurantIds && restaurantIds.length > 0) {
      // Múltiplos restaurantes (modo comparação) - buscar intersecção
      setLoading(true);
      const idsParam = restaurantIds.join(',');
      fetch(`/api/restaurantes/periodos-disponiveis?ids=${idsParam}`)
        .then(res => res.json())
        .then(data => {
          setAvailableYears(data.years || []);
          setMonthsByYear(data.monthsByYear || {});
        })
        .catch(err => {
          console.error('Erro ao buscar períodos disponíveis:', err);
          setAvailableYears([]);
          setMonthsByYear({});
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (restaurantId) {
      // Restaurante único - buscar períodos normalmente
      setLoading(true);
      fetch(`/api/restaurante/${restaurantId}/periodos-disponiveis`)
        .then(res => res.json())
        .then(data => {
          setAvailableYears(data.years || []);
          setMonthsByYear(data.monthsByYear || {});
        })
        .catch(err => {
          console.error('Erro ao buscar períodos disponíveis:', err);
          setAvailableYears([]);
          setMonthsByYear({});
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setAvailableYears([]);
      setMonthsByYear({});
    }
  }, [restaurantId, restaurantIds]);

  // Filtrar meses baseado no ano selecionado
  const getAvailableMonths = () => {
    if (selectedYear === 'todos') {
      // Se nenhum ano específico, mostrar todos os meses que têm dados em qualquer ano
      const allMonths = new Set<number>();
      Object.values(monthsByYear).forEach(months => {
        months.forEach(month => allMonths.add(month));
      });
      return Array.from(allMonths).sort((a, b) => a - b);
    } else {
      // Se ano específico selecionado, mostrar apenas meses daquele ano
      const year = typeof selectedYear === 'number' ? selectedYear : parseInt(selectedYear);
      return monthsByYear[year] || [];
    }
  };

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;
      if (showYearDropdown && yearDropdownRef.current && !yearDropdownRef.current.contains(target)) {
        setShowYearDropdown(false);
      }
      if (showMonthDropdown && monthDropdownRef.current && !monthDropdownRef.current.contains(target)) {
        setShowMonthDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showYearDropdown, showMonthDropdown]);

  const getYearDisplay = () => {
    return selectedYear === 'todos' ? 'Todos os anos' : selectedYear;
  };

  const getMonthDisplay = () => {
    if (selectedMonth === 'todos') return 'Todos os meses';
    const monthValue = typeof selectedMonth === 'number' ? selectedMonth : parseInt(selectedMonth as string);
    return monthLabels[monthValue] || 'Todos os meses';
  };

  const availableMonths = getAvailableMonths();

  return (
    <div className="flex items-center gap-2">
      {/* Dropdown Ano */}
      <div className="relative inline-block" ref={yearDropdownRef}>
        <button
          onClick={() => setShowYearDropdown(!showYearDropdown)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors touch-manipulation flex items-center gap-2 ${
            restaurantIds && restaurantIds.length > 0
              ? 'text-zinc-700 bg-gray-100 hover:bg-gray-200 border-2 border-black'
              : 'text-zinc-700 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <span>{getYearDisplay()}</span>
          <svg
            className={`w-4 h-4 flex-shrink-0 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showYearDropdown && (
          <Card className="absolute z-50 mt-1 w-40 left-0 border border-[--color-primary]/30 bg-white shadow-lg max-h-48 overflow-y-auto">
            <button
              onClick={() => {
                setSelectedYear('todos');
                setShowYearDropdown(false);
                onYearChange?.('todos');
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-[--color-accent] transition-colors text-zinc-800 touch-manipulation ${
                selectedYear === 'todos' ? 'bg-[--color-accent] font-medium' : ''
              }`}
            >
              Todos os anos
            </button>
            {loading ? (
              <div className="px-3 py-2 text-sm text-zinc-400 text-center">Carregando...</div>
            ) : availableYears.length > 0 ? (
              availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    setSelectedYear(year);
                    setShowYearDropdown(false);
                    onYearChange?.(year);
                    // Resetar mês se não houver dados para o ano selecionado
                    const yearMonths = monthsByYear[year] || [];
                    if (selectedMonth !== 'todos' && !yearMonths.includes(typeof selectedMonth === 'number' ? selectedMonth : parseInt(selectedMonth as string))) {
                      setSelectedMonth('todos');
                      onMonthChange?.('todos');
                    }
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-[--color-accent] transition-colors text-zinc-800 touch-manipulation ${
                    selectedYear === year ? 'bg-[--color-accent] font-medium' : ''
                  }`}
                >
                  {year}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-zinc-400 text-center">Nenhum dado disponível</div>
            )}
          </Card>
        )}
      </div>

      {/* Dropdown Mês */}
      <div className="relative inline-block" ref={monthDropdownRef}>
        <button
          onClick={() => setShowMonthDropdown(!showMonthDropdown)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors touch-manipulation flex items-center gap-2 ${
            restaurantIds && restaurantIds.length > 0
              ? 'text-zinc-700 bg-gray-100 hover:bg-gray-200 border-2 border-black'
              : 'text-zinc-700 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <span>{getMonthDisplay()}</span>
          <svg
            className={`w-4 h-4 flex-shrink-0 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showMonthDropdown && (
          <Card className="absolute z-50 mt-1 w-44 left-0 border border-[--color-primary]/30 bg-white shadow-lg max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                setSelectedMonth('todos');
                setShowMonthDropdown(false);
                onMonthChange?.('todos');
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-[--color-accent] transition-colors text-zinc-800 touch-manipulation ${
                selectedMonth === 'todos' ? 'bg-[--color-accent] font-medium' : ''
              }`}
            >
              Todos os meses
            </button>
            {loading ? (
              <div className="px-3 py-2 text-sm text-zinc-400 text-center">Carregando...</div>
            ) : availableMonths.length > 0 ? (
              availableMonths.map((monthValue) => (
                <button
                  key={monthValue}
                  onClick={() => {
                    setSelectedMonth(monthValue);
                    setShowMonthDropdown(false);
                    onMonthChange?.(monthValue);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-[--color-accent] transition-colors text-zinc-800 touch-manipulation ${
                    selectedMonth === monthValue ? 'bg-[--color-accent] font-medium' : ''
                  }`}
                >
                  {monthLabels[monthValue]}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-zinc-400 text-center">Nenhum dado disponível</div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

