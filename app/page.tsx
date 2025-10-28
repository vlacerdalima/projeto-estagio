'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RestaurantSearch from "@/components/RestaurantSearch";

export default function Home() {
  const [sales, setSales] = useState<number | null>(null);
  const [revenue, setRevenue] = useState<number | null>(null);

  function handleSelect(salesVal: number | null, revenueVal: number | null) {
    setSales(salesVal);
    setRevenue(revenueVal);
  }

  return (
		<div className="min-h-screen w-full bg-white relative">
			<main className="flex flex-col gap-8 px-6 py-8">
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
						<Card className="flex-1 border-[--color-primary]/30 p-6">
							<div className="text-sm font-medium text-[--color-muted-foreground] mb-2">Vendas no ano</div>
							<div className="text-3xl font-semibold text-[--color-primary]">{sales?.toLocaleString() || '—'}</div>
						</Card>
						<Card className="flex-1 border-[--color-primary]/30 p-6">
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
