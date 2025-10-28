'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function VendasButton() {
	const [loading, setLoading] = useState(false);
	const [total, setTotal] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleClick() {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/vendas');
			if (!res.ok) throw new Error('Falha ao buscar vendas');
			const data = await res.json();
			setTotal(data.total);
		} catch (e) {
			setError('Erro ao buscar vendas');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex flex-col items-center gap-3">
			<Button
				onClick={handleClick}
				disabled={loading}
				className="bg-[--color-primary] text-[--color-primary-foreground] hover:bg-[--color-primary]/90"
			>
				{loading ? 'Buscando...' : 'Vendas'}
			</Button>
			{error && <span className="text-sm text-red-600">{error}</span>}
			{total !== null && (
				<span className="text-sm text-zinc-700">Total de vendas: {total}</span>
			)}
		</div>
	);
}
