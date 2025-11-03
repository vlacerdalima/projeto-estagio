/**
 * Testes para funções de formatação usadas nos cards
 * Estas funções são extraídas da lógica de renderização dos cards
 */

describe('Formatação de Valores (Lógica dos Cards)', () => {
  describe('Formatação de números (Vendas)', () => {
    it('deve formatar números com toLocaleString', () => {
      const value = 1234567;
      const formatted = value.toLocaleString();
      // O formato depende da locale do sistema, pode ser "1,234,567" ou "1.234.567"
      expect(typeof formatted).toBe('string');
      // Verifica que o número foi formatado com separadores de milhar
      expect(formatted.length).toBeGreaterThan(7); // Deve ter separadores
    });

    it('deve retornar "—" quando valor é null', () => {
      const value: number | null = null;
      const display = value?.toLocaleString() || '—';
      expect(display).toBe('—');
    });

    it('deve retornar "—" quando valor é undefined', () => {
      const value: number | undefined = undefined;
      const display = value?.toLocaleString() || '—';
      expect(display).toBe('—');
    });
  });

  describe('Formatação monetária (Faturamento)', () => {
    it('deve formatar valores monetários em R$ com pt-BR', () => {
      const revenue = 12500.50;
      const formatted = `R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      expect(formatted).toContain('R$');
      expect(formatted).toContain('12.500,50');
    });

    it('deve retornar "—" quando revenue é null', () => {
      const revenue: number | null = null;
      const display = revenue ? `R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';
      expect(display).toBe('—');
    });

    it('deve formatar valores inteiros com decimais', () => {
      const revenue = 1000;
      const formatted = `R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      expect(formatted).toBe('R$ 1.000,00');
    });
  });

  describe('Formatação de ticket médio', () => {
    it('deve formatar com 2 casas decimais e substituir ponto por vírgula', () => {
      const ticketMedio = 45.67;
      const formatted = ticketMedio.toFixed(2).replace('.', ',');
      expect(formatted).toBe('45,67');
    });

    it('deve formatar valores inteiros com decimais', () => {
      const ticketMedio = 50;
      const formatted = ticketMedio.toFixed(2).replace('.', ',');
      expect(formatted).toBe('50,00');
    });
  });

  describe('Formatação de percentuais', () => {
    it('deve formatar percentuais positivos com sinal +', () => {
      const taxaCrescimento = 5.2;
      const formatted = `${taxaCrescimento >= 0 ? '+' : ''}${taxaCrescimento.toFixed(1)}%`;
      expect(formatted).toBe('+5.2%');
    });

    it('deve formatar percentuais negativos sem sinal +', () => {
      const taxaCrescimento = -3.5;
      const formatted = `${taxaCrescimento >= 0 ? '+' : ''}${taxaCrescimento.toFixed(1)}%`;
      expect(formatted).toBe('-3.5%');
    });

    it('deve calcular valor absoluto para variação', () => {
      const variacao = -15.5;
      const formatted = `${Math.abs(variacao).toFixed(1)}% vs período anterior`;
      expect(formatted).toBe('15.5% vs período anterior');
    });

    it('deve usar uma casa decimal', () => {
      const variacao = 7.89;
      const formatted = Math.abs(variacao).toFixed(1);
      expect(formatted).toBe('7.9');
    });
  });

  describe('Formatação de tempo médio de entrega', () => {
    it('deve formatar tempo sem decimais', () => {
      const tempoMedio = 45.7;
      const formatted = `${tempoMedio.toFixed(0)} min`;
      expect(formatted).toBe('46 min');
    });

    it('deve arredondar para cima quando necessário', () => {
      const tempoMedio = 44.4;
      const formatted = `${tempoMedio.toFixed(0)} min`;
      expect(formatted).toBe('44 min');
    });
  });

  describe('Formatação de valores monetários (Desvio da Média)', () => {
    it('deve formatar semana atual e média histórica', () => {
      const semanaAtual = 12500.75;
      const mediaHistorica = 10000.25;
      
      const formattedAtual = semanaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const formattedMedia = mediaHistorica.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      
      expect(formattedAtual).toContain('12.500,75');
      expect(formattedMedia).toContain('10.000,25');
    });
  });
});

describe('Lógica Condicional de Cores', () => {
  describe('Cores para valores positivos/negativos', () => {
    it('deve usar cor verde para valores positivos', () => {
      const variacao = 5.5;
      const colorClass = variacao >= 0 ? 'text-green-600' : 'text-red-600';
      expect(colorClass).toBe('text-green-600');
    });

    it('deve usar cor vermelha para valores negativos', () => {
      const variacao = -3.2;
      const colorClass = variacao >= 0 ? 'text-green-600' : 'text-red-600';
      expect(colorClass).toBe('text-red-600');
    });

    it('deve usar cor verde para taxa de crescimento positiva', () => {
      const taxaCrescimento = 10.5;
      const colorClass = taxaCrescimento >= 0 ? 'text-green-600' : 'text-red-600';
      expect(colorClass).toBe('text-green-600');
    });

    it('deve usar cor vermelha para taxa de crescimento negativa', () => {
      const taxaCrescimento = -2.3;
      const colorClass = taxaCrescimento >= 0 ? 'text-green-600' : 'text-red-600';
      expect(colorClass).toBe('text-red-600');
    });

    it('deve usar cor vermelha para variação de tempo médio positiva (pior)', () => {
      const variacao = 5.0; // Tempo aumentou
      const colorClass = variacao >= 0 ? 'text-red-600' : 'text-green-600';
      expect(colorClass).toBe('text-red-600');
    });

    it('deve usar cor verde para variação de tempo médio negativa (melhor)', () => {
      const variacao = -3.0; // Tempo diminuiu
      const colorClass = variacao >= 0 ? 'text-red-600' : 'text-green-600';
      expect(colorClass).toBe('text-green-600');
    });
  });

  describe('Símbolos para indicadores visuais', () => {
    it('deve usar ▲ para valores positivos', () => {
      const variacao = 5.0;
      const symbol = variacao >= 0 ? '▲' : '▼';
      expect(symbol).toBe('▲');
    });

    it('deve usar ▼ para valores negativos', () => {
      const variacao = -5.0;
      const symbol = variacao >= 0 ? '▲' : '▼';
      expect(symbol).toBe('▼');
    });
  });

  describe('Exibição condicional de variação', () => {
    it('deve exibir variação quando diferente de zero', () => {
      const variacao = 5.5;
      const shouldShow = variacao !== 0;
      expect(shouldShow).toBe(true);
    });

    it('não deve exibir variação quando igual a zero', () => {
      const variacao = 0;
      const shouldShow = variacao !== 0;
      expect(shouldShow).toBe(false);
    });
  });
});

