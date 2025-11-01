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

export interface RegiaoEntrega {
  regiao: string;
  totalEntregas: number;
  tempoMedioMinutos: number;
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

export type CardType = 'sales' | 'revenue' | 'produto' | 'turno' | 'ticketMedio' | 'canal' | 'produtoRemovido' | 'tendencia' | 'desvioMedia' | 'tempoMedioEntrega' | 'sazonalidade';

export type TemplateType = 'geral' | 'vendas' | 'faturamento' | 'produtos';

export interface VisibleCards {
  sales: boolean;
  revenue: boolean;
  produto: boolean;
  turno: boolean;
  ticketMedio: boolean;
  canal: boolean;
  produtoRemovido: boolean;
  tendencia: boolean;
  desvioMedia: boolean;
  tempoMedioEntrega: boolean;
  sazonalidade: boolean;
}

export interface ProdutoMaisVendido {
  nome: string | null;
  total: number;
}

export interface ProdutoMaisRemovido {
  nome: string | null;
  total: number;
}

export interface TendenciaVendas {
  taxaCrescimento: number; // porcentagem de crescimento mensal (ex: 5.2)
  dadosMensais: Array<{
    mes: number;
    ano: number;
    vendas: number;
  }>;
}

export interface DesvioMedia {
  semanaAtual: number; // receita da semana atual (últimos 7 dias)
  mediaHistorica: number; // média histórica de receita semanal
  percentualDesvio: number; // percentual de desvio (positivo = acima, negativo = abaixo)
}

export interface TempoMedioEntrega {
  tempoMedio: number; // tempo médio em minutos
  variacao: number; // variação percentual comparado ao período anterior
}

export interface ProdutoSazonal {
  nome: string;
  mesPico: string; // nome do mês ou evento (ex: "Jul", "Black Friday", "Domingo")
  lift: number; // percentual de lift vs baseline (ex: 82 = 82%)
  pontosSazonalidade?: number[]; // 12 pontos (Jan-Dez) para sparkline opcional
}

export interface SazonalidadeProdutos {
  produtos: ProdutoSazonal[];
}

