export function cn(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(' ');
}

/**
 * Tenta corrigir strings corrompidas (mojibake) que aparecem quando UTF-8 é interpretado como Latin-1
 * Por exemplo: "SÃ£o" -> "São", "ColÃ©gio" -> "Colégio"
 */
function fixMojibake(str: string): string {
	try {
		// Tenta converter de Latin-1 para UTF-8 (correção de mojibake comum)
		const fixed = Buffer.from(str, 'latin1').toString('utf8');
		// Verifica se a correção parece válida (não tem mais padrões de mojibake)
		if (!/Ã[£©³ª§]/i.test(fixed)) {
			return fixed;
		}
		return str;
	} catch {
		// Se falhar, retorna a string original
		return str;
	}
}

/**
 * Remove acentos de uma string
 * Primeiro tenta corrigir mojibake, depois remove acentos
 */
export function removeAccents(str: string): string {
	if (!str || typeof str !== 'string') return str;
	
	// Primeiro, tenta corrigir mojibake se detectado
	let fixedStr = str;
	if (/Ã[£©³ª§Â]/i.test(str)) {
		// Detecta padrões comuns de mojibake
		fixedStr = fixMojibake(str);
	}
	
	// Depois, remove acentos da string (seja original ou corrigida)
	return fixedStr
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
