'use client';

import { Card } from '@/components/ui/card';

interface SalesByShiftChartProps {
  manha: number;
  tarde: number;
  noite: number;
}

export default function SalesByShiftChart({ manha, tarde, noite }: SalesByShiftChartProps) {
  const maxPercentage = Math.max(manha, tarde, noite, 0);
  const labelWidth = 16; // tamanho fixo para os labels (ex: "15%")
  
  // Se todos os valores são 0, mostrar mensagem
  if (manha === 0 && tarde === 0 && noite === 0) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-medium text-[--color-muted-foreground] mb-4">
          Vendas por Turno
        </div>
        <div className="text-sm text-zinc-400 text-center">
          Sem dados disponíveis
        </div>
      </div>
    );
  }
  
  const Bar = ({ value, label, bgColor }: { value: number; label: string; bgColor: string }) => (
    <div className="flex items-center gap-3">
      <div className="text-sm font-medium" style={{ width: `${labelWidth + 2}ch`, textAlign: 'right' }}>
        {label}
      </div>
      <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ 
            width: maxPercentage > 0 ? `${(value / maxPercentage) * 100}%` : '0%',
            backgroundColor: bgColor
          }}
        />
      </div>
      <div className="text-sm font-semibold text-[#fa8072]" style={{ width: '3ch', textAlign: 'right' }}>
        {value}%
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-[--color-muted-foreground] mb-4">
        Vendas por Turno
      </div>
      <div className="space-y-3">
        <Bar value={manha} label="Manhã" bgColor="#fb923c" />
        <Bar value={tarde} label="Tarde" bgColor="#f59e0b" />
        <Bar value={noite} label="Noite" bgColor="#a855f7" />
      </div>
    </div>
  );
}

