'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface RestaurantSearchProps {
  onSelect: (sales: number | null, revenue: number | null, produto: { nome: string | null; total: number } | null, turno: { manha: number; tarde: number; noite: number } | null, restaurantId: number) => void;
  period: 'mensal' | 'anual';
}

export default function RestaurantSearch({ onSelect, period }: RestaurantSearchProps) {
  const [restaurants, setRestaurants] = useState<Array<{ id: number; name: string }>>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;
      if (showDropdown && dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    fetch('/api/restaurantes')
      .then(res => res.json())
      .then(data => {
        // Garantir que data é um array
        if (Array.isArray(data)) {
          setRestaurants(data);
        } else {
          console.error('Dados inválidos recebidos da API:', data);
          setRestaurants([]);
        }
      })
      .catch(err => {
        console.error('Erro ao carregar restaurantes:', err);
        setRestaurants([]);
      });
  }, []);

  const filtered = restaurants.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  // Auto-focus no input quando dropdown abrir
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showDropdown]);

  // Limpar busca quando fechar dropdown
  useEffect(() => {
    if (!showDropdown) {
      setSearch('');
    }
  }, [showDropdown]);

  async function handleSelect(restaurantId: number) {
    setSelected(restaurantId);
    setShowDropdown(false);
    setSearch('');
    setLoading(true);

    try {
      const [salesRes, revenueRes, produtoRes, turnoRes, ticketMedioRes] = await Promise.all([
        fetch(`/api/restaurante/${restaurantId}/vendas?period=${period}`),
        fetch(`/api/restaurante/${restaurantId}/faturamento?period=${period}`),
        fetch(`/api/restaurante/${restaurantId}/produto-mais-vendido?period=${period}`),
        fetch(`/api/restaurante/${restaurantId}/vendas-por-turno?period=${period}`),
        fetch(`/api/restaurante/${restaurantId}/ticket-medio?period=${period}`)
      ]);
      
      const salesData = await salesRes.json();
      const revenueData = await revenueRes.json();
      const produtoData = await produtoRes.json();
      const turnoData = await turnoRes.json();
      const ticketMedioData = await ticketMedioRes.json();
      
      onSelect(
        salesData.total, 
        parseFloat(revenueData.revenue),
        { nome: produtoData.nome, total: produtoData.total },
        { manha: turnoData.manha, tarde: turnoData.tarde, noite: turnoData.noite },
        restaurantId
      );
    } catch (e) {
      console.error('Erro ao buscar dados:', e);
      onSelect(null, null, null, null, restaurantId);
    } finally {
      setLoading(false);
    }
  }

  const selectedRestaurant = selected ? restaurants.find(r => r.id === selected) : null;
  const displayText = selectedRestaurant?.name || 'Unidade';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
        className="bg-[#fa8072] hover:bg-[#fa8072]/90 active:bg-[#fa8072]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md w-auto flex items-center justify-between gap-2 touch-manipulation transition-colors"
      >
        <span className="truncate">
          {loading ? 'Carregando...' : displayText}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
        {showDropdown && (
          <Card className="absolute z-50 mt-2 w-full sm:w-72 left-0 overflow-y-auto border border-[--color-primary]/30 bg-white shadow-lg max-w-[calc(100vw-2rem)]">
            <input
              ref={inputRef}
              type="text"
              placeholder="Digite para buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                // Prevenir que Enter feche o dropdown
                if (e.key === 'Enter' && filtered.length === 1) {
                  handleSelect(filtered[0].id);
                }
              }}
              className="w-full border-b border-[--color-primary]/20 px-4 py-2 outline-none focus:ring-2 focus:ring-[--color-primary]/20 placeholder:text-black text-black"
            />
            <div className="max-h-48 overflow-y-auto">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r.id)}
                  className="w-full px-4 py-2.5 text-left hover:bg-[--color-accent] active:bg-gray-200 transition-colors text-zinc-800 touch-manipulation"
                >
                  {r.name}
                </button>
              ))}
            </div>
          </Card>
        )}
    </div>
  );
}

