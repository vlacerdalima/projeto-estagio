export interface Position {
  x: number;
  y: number;
}

export type Period = 'mensal' | 'anual';

export interface VendasTurno {
  manha: number;
  tarde: number;
  noite: number;
}

export interface ProdutoRanking {
  nome: string;
  total: number;
}

export interface TicketMedio {
  ticketMedio: number;
  variacao: number;
}

export interface CanalData {
  nome: string;
  quantidade: number;
  receita: number;
  percentual: number;
}

export type CardType = 'sales' | 'revenue' | 'produto' | 'turno' | 'ticketMedio' | 'canal';

export type TemplateType = 'geral' | 'vendas' | 'faturamento';

export interface VisibleCards {
  sales: boolean;
  revenue: boolean;
  produto: boolean;
  turno: boolean;
  ticketMedio: boolean;
  canal: boolean;
}

export interface ProdutoMaisVendido {
  nome: string | null;
  total: number;
}

