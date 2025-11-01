/**
 * Constrói um filtro SQL baseado em ano/mês
 * @param year Ano selecionado (ou 'todos')
 * @param month Mês selecionado (ou 'todos')
 * @param period Período padrão ('mensal' ou 'anual')
 * @param tableAlias Prefixo da tabela para a coluna created_at (ex: 's.' ou '')
 * @param paramIndex Índice inicial para os parâmetros (default: 2, já que $1 é geralmente o store_id)
 * @returns Objeto com a string do filtro SQL e array de valores para os parâmetros
 */
export function buildDateFilter(
  year: string | null | undefined,
  month: string | null | undefined,
  period: string,
  tableAlias: string = '',
  paramIndex: number = 2
): { filter: string; params: any[] } {
  let filter = '';
  const params: any[] = [];
  let currentParamIndex = paramIndex;
  
  if (year && year !== 'todos') {
    if (month && month !== 'todos') {
      // Ano e mês específicos
      filter = `AND EXTRACT(YEAR FROM ${tableAlias}created_at) = $${currentParamIndex} AND EXTRACT(MONTH FROM ${tableAlias}created_at) = $${currentParamIndex + 1}`;
      params.push(parseInt(year as string), parseInt(month as string));
    } else {
      // Apenas ano específico
      filter = `AND EXTRACT(YEAR FROM ${tableAlias}created_at) = $${currentParamIndex}`;
      params.push(parseInt(year as string));
    }
  } else if (month && month !== 'todos') {
    // Apenas mês específico (sem ano)
    filter = `AND EXTRACT(MONTH FROM ${tableAlias}created_at) = $${currentParamIndex}`;
    params.push(parseInt(month as string));
  } else if (period === 'mensal') {
    // Fallback para período mensal padrão (últimos 30 dias)
    // Não precisa de parâmetro adicional, usa função SQL
    filter = `AND ${tableAlias}created_at >= NOW() - INTERVAL '30 days'`;
  } else if (period === 'anual') {
    // Fallback para período anual padrão (últimos 365 dias)
    // Não precisa de parâmetro adicional, usa função SQL
    filter = `AND ${tableAlias}created_at >= NOW() - INTERVAL '365 days'`;
  }
  
  return { filter, params };
}

