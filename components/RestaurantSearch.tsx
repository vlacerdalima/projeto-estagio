'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface RestaurantSearchProps {
  onSelect: (sales: number | null, revenue: number | null) => void;
}

export default function RestaurantSearch({ onSelect }: RestaurantSearchProps) {
  const [restaurants, setRestaurants] = useState<Array<{ id: number; name: string }>>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const [salesRes, revenueRes] = await Promise.all([
        fetch(`/api/restaurante/${restaurantId}/vendas`),
        fetch(`/api/restaurante/${restaurantId}/faturamento`)
      ]);
      
      const salesData = await salesRes.json();
      const revenueData = await revenueRes.json();
      
      onSelect(salesData.total, parseFloat(revenueData.revenue));
    } catch (e) {
      console.error('Erro ao buscar dados:', e);
      onSelect(null, null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowDropdown(!showDropdown)}
        variant="outline"
        disabled={loading}
        className="w-full justify-between bg-white text-left text-sm"
      >
        {selected
          ? restaurants.find(r => r.id === selected)?.name
          : 'Selecionar Restaurante'}
        {loading && ' (carregando...)'}
      </Button>
        {showDropdown && (
          <Card className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto border border-[--color-primary]/30 bg-white">
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
                  className="w-full px-4 py-2 text-left hover:bg-[--color-accent] transition-colors text-zinc-800"
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

