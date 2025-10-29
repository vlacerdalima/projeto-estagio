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
      .then(data => setRestaurants(data))
      .catch(err => console.error('Erro ao carregar restaurantes:', err));
  }, []);

  const filtered = restaurants.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSelect(restaurantId: number) {
    setSelected(restaurantId);
    setShowDropdown(false);
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

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
        className="text-sm font-medium text-[#fa8072] hover:underline active:opacity-70 disabled:opacity-50 w-full text-left truncate touch-manipulation"
      >
        {selected
          ? restaurants.find(r => r.id === selected)?.name || 'Selecionar Restaurante'
          : 'Selecionar Restaurante'}
        {loading && ' (carregando...)'}
      </button>
        {showDropdown && (
          <Card className="absolute z-50 mt-2 w-full sm:w-72 left-0 overflow-y-auto border border-[--color-primary]/30 bg-white shadow-lg max-w-[calc(100vw-2rem)]">
            <input
              type="text"
              placeholder="Buscar restaurante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-b border-[--color-primary]/20 px-4 py-2 outline-none focus:ring-2 focus:ring-[--color-primary]/20"
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

