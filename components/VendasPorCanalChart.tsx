'use client';

import { Card } from '@/components/ui/card';

interface CanalData {
  nome: string;
  quantidade: number;
  receita: number;
  percentual: number;
}

interface VendasPorCanalChartProps {
  canais: CanalData[];
}

export default function VendasPorCanalChart({ canais }: VendasPorCanalChartProps) {
  if (canais.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-medium text-[--color-muted-foreground] mb-4">
          Vendas por Canal
        </div>
        <div className="text-sm text-zinc-400 text-center">
          Sem dados disponíveis
        </div>
      </div>
    );
  }
  
  const maxReceita = Math.max(...canais.map(c => c.receita), 0);
  
  const Bar = ({ canal }: { canal: CanalData }) => (
    <div className="mb-3">
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm font-semibold text-white flex-1">{canal.nome}</div>
        <div className="flex gap-2 text-xs ml-2">
          <span className="text-zinc-400">{canal.quantidade} pedidos</span>
          <span className="text-[#fa8072] font-bold">R$ {canal.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      <div className="flex-1 h-3 bg-gray-100 rounded overflow-hidden mb-1">
        <div
          className="h-full transition-all bg-[#fa8072]"
          style={{ 
            width: maxReceita > 0 ? `${(canal.receita / maxReceita) * 100}%` : '0%'
          }}
        />
      </div>
      <div className="text-xs text-zinc-300 text-right">
        {canal.percentual.toFixed(1)}% do total
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-white mb-4">
        Vendas por Canal
      </div>
      <div className="space-y-3">
        {canais.map((canal, index) => (
          <Bar key={index} canal={canal} />
        ))}
      </div>
    </div>
  );
}

