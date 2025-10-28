'use client';

import { useEffect, useState } from 'react';

export default function VendasCounter() {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendas = async () => {
      try {
        const response = await fetch('/api/vendas');
        const data = await response.json();
        setTotal(data.total);
      } catch (error) {
        console.error('Erro ao buscar vendas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendas();
  }, []);

  return (
    <div className="rounded-lg bg-blue-500 px-6 py-4 text-white shadow-lg">
      <h2 className="text-xl font-semibold mb-2">Total de Vendas</h2>
      {loading ? (
        <p className="text-lg">Carregando...</p>
      ) : (
        <p className="text-4xl font-bold">{total}</p>
      )}
    </div>
  );
}

