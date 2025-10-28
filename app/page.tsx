'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RestaurantSearch from "@/components/RestaurantSearch";

interface Position {
  x: number;
  y: number;
}

export default function Home() {
  const [sales, setSales] = useState<number | null>(null);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [salesPosition, setSalesPosition] = useState<Position>({ x: 0, y: 0 });
  const [revenuePosition, setRevenuePosition] = useState<Position>({ x: 0, y: 0 });
  const salesRef = useRef<HTMLDivElement>(null);
  const revenueRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'sales' | 'revenue' | null>(null);

  function handleSelect(salesVal: number | null, revenueVal: number | null) {
    setSales(salesVal);
    setRevenue(revenueVal);
    // Reset das posições quando trocar de restaurante
    setSalesPosition({ x: 0, y: 0 });
    setRevenuePosition({ x: 0, y: 0 });
  }

  const handleMouseDown = (type: 'sales' | 'revenue', e: React.MouseEvent) => {
    if (e.button !== 0) return; // Apenas botão esquerdo do mouse
    e.preventDefault();
    
    setIsDragging(type);
    
    // Captura a posição atual do card e do mouse
    const currentPosition = type === 'sales' ? salesPosition : revenuePosition;
    const mouseStartX = e.clientX;
    const mouseStartY = e.clientY;
    
    // Calcula o offset (distância entre o ponto de clique e a origem do card)
    const offsetX = mouseStartX - currentPosition.x;
    const offsetY = mouseStartY - currentPosition.y;

    const handleMouseMove = (e: MouseEvent) => {
      // Nova posição = posição do mouse - offset inicial
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;

      if (type === 'sales') {
        setSalesPosition({ x: newX, y: newY });
      } else {
        setRevenuePosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
		<div className="min-h-screen w-full bg-white relative">
			<main className="flex flex-col gap-8 px-80 py-8">
				<div className="w-full">
					<Card className="border-[--color-primary]/30">
						<CardHeader>
							<CardTitle className="text-[--color-primary]">Selecione um Restaurante</CardTitle>
						</CardHeader>
						<CardContent>
							<RestaurantSearch onSelect={handleSelect} />
						</CardContent>
					</Card>
				</div>

				{(sales !== null || revenue !== null) && (
					<div className="flex w-full gap-6">
						<Card 
							ref={salesRef}
							className="flex-1 border-[--color-primary]/30 p-6 cursor-move select-none transition-none"
							style={{ 
								transform: `translate(${salesPosition.x}px, ${salesPosition.y}px)`,
								zIndex: isDragging === 'sales' ? 1000 : 1
							}}
							onMouseDown={(e) => handleMouseDown('sales', e)}
						>
							<div className="text-sm font-medium text-[--color-muted-foreground] mb-2">Vendas no ano</div>
							<div className="text-3xl font-semibold text-[--color-primary]">{sales?.toLocaleString() || '—'}</div>
						</Card>
						<Card 
							ref={revenueRef}
							className="flex-1 border-[--color-primary]/30 p-6 cursor-move select-none transition-none"
							style={{ 
								transform: `translate(${revenuePosition.x}px, ${revenuePosition.y}px)`,
								zIndex: isDragging === 'revenue' ? 1000 : 1
							}}
							onMouseDown={(e) => handleMouseDown('revenue', e)}
						>
							<div className="text-sm font-medium text-[--color-muted-foreground] mb-2">Faturamento</div>
							<div className="text-3xl font-semibold text-[--color-primary]">
								{revenue ? `R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
							</div>
						</Card>
					</div>
				)}
			</main>
			<footer className="pointer-events-none absolute bottom-4 right-6 text-right leading-5">
				<div className="text-[10px] sm:text-xs font-medium tracking-wide text-[--color-primary]">desafio técnico</div>
				<div className="text-[10px] sm:text-xs text-zinc-500">feito por Vitor Lacerda</div>
			</footer>
		</div>
  );
}
