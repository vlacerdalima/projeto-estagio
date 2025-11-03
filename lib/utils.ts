export function cn(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(' ');
}

/**
 * Remove acentos de uma string
 * Converte caracteres acentuados para suas versões sem acento
 */
export function removeAccents(str: string): string {
	if (!str || typeof str !== 'string') return str;
	
	return str
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normaliza dados recursivamente, removendo acentos de todas as strings
 * Funciona com objetos, arrays e valores primitivos
 */
export function normalizeData<T>(data: T): T {
	if (data === null || data === undefined) {
		return data;
	}
	
	// Se for uma string, remove acentos
	if (typeof data === 'string') {
		return removeAccents(data) as T;
	}
	
	// Se for um array, normaliza cada elemento
	if (Array.isArray(data)) {
		return data.map(item => normalizeData(item)) as T;
	}
	
	// Se for um objeto, normaliza cada propriedade
	if (typeof data === 'object') {
		const normalized: any = {};
		for (const key in data) {
			if (data.hasOwnProperty(key)) {
				normalized[key] = normalizeData(data[key]);
			}
		}
		return normalized as T;
	}
	
	// Para outros tipos (number, boolean, etc), retorna como está
	return data;
}
