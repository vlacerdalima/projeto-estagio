'use client';

import { Button } from '@/components/ui/button';

type Period = 'mensal' | 'anual';

interface PeriodSelectorProps {
  selected: Period;
  onSelect: (period: Period) => void;
}

export default function PeriodSelector({ selected, onSelect }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onSelect('anual')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors touch-manipulation ${
          selected === 'anual' 
            ? 'text-[#fa8072] border-b-2 border-[#fa8072]' 
            : 'text-zinc-600 hover:text-[#fa8072] active:opacity-70'
        }`}
      >
        anual
      </button>
      <span className="text-zinc-400">|</span>
      <button
        onClick={() => onSelect('mensal')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors touch-manipulation ${
          selected === 'mensal' 
            ? 'text-[#fa8072] border-b-2 border-[#fa8072]' 
            : 'text-zinc-600 hover:text-[#fa8072] active:opacity-70'
        }`}
      >
        mensal
      </button>
    </div>
  );
}

