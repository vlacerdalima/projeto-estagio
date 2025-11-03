import { buildDateFilter } from '@/lib/dateFilter';

describe('buildDateFilter', () => {
  describe('Quando ano e mês são específicos', () => {
    it('deve construir filtro com ano e mês', () => {
      const { filter, params } = buildDateFilter('2024', '3', 'anual');
      
      expect(filter).toContain('EXTRACT(YEAR');
      expect(filter).toContain('EXTRACT(MONTH');
      expect(params).toEqual([2024, 3]);
    });

    it('deve usar o paramIndex correto', () => {
      const { filter, params } = buildDateFilter('2024', '5', 'anual', '', 3);
      
      expect(filter).toContain('$3');
      expect(filter).toContain('$4');
      expect(params).toEqual([2024, 5]);
    });

    it('deve usar tableAlias quando fornecido', () => {
      const { filter } = buildDateFilter('2024', '6', 'anual', 's.');
      
      expect(filter).toContain('s.created_at');
    });
  });

  describe('Quando apenas o ano é específico', () => {
    it('deve construir filtro apenas com ano', () => {
      const { filter, params } = buildDateFilter('2024', 'todos', 'anual');
      
      expect(filter).toContain('EXTRACT(YEAR');
      expect(filter).not.toContain('EXTRACT(MONTH');
      expect(params).toEqual([2024]);
    });

    it('deve usar paramIndex correto', () => {
      const { filter, params } = buildDateFilter('2023', 'todos', 'anual', '', 5);
      
      expect(filter).toContain('$5');
      expect(params).toEqual([2023]);
    });
  });

  describe('Quando apenas o mês é específico', () => {
    it('deve construir filtro apenas com mês', () => {
      const { filter, params } = buildDateFilter('todos', '12', 'anual');
      
      expect(filter).toContain('EXTRACT(MONTH');
      expect(filter).not.toContain('EXTRACT(YEAR');
      expect(params).toEqual([12]);
    });
  });

  describe('Quando ano e mês são "todos"', () => {
    it('deve usar período mensal padrão (30 dias) quando period é "mensal"', () => {
      const { filter, params } = buildDateFilter('todos', 'todos', 'mensal');
      
      expect(filter).toContain("INTERVAL '30 days'");
      expect(params).toEqual([]);
    });

    it('deve usar período anual padrão (365 dias) quando period é "anual"', () => {
      const { filter, params } = buildDateFilter('todos', 'todos', 'anual');
      
      expect(filter).toContain("INTERVAL '365 days'");
      expect(params).toEqual([]);
    });

    it('deve usar tableAlias no período padrão', () => {
      const { filter } = buildDateFilter('todos', 'todos', 'anual', 's.');
      
      expect(filter).toContain('s.created_at');
    });
  });

  describe('Quando valores são null ou undefined', () => {
    it('deve tratar null como "todos"', () => {
      const { filter, params } = buildDateFilter(null, null, 'anual');
      
      expect(filter).toContain("INTERVAL '365 days'");
      expect(params).toEqual([]);
    });

    it('deve tratar undefined como "todos"', () => {
      const { filter, params } = buildDateFilter(undefined, undefined, 'mensal');
      
      expect(filter).toContain("INTERVAL '30 days'");
      expect(params).toEqual([]);
    });
  });

  describe('Casos especiais', () => {
    it('deve funcionar com valores numéricos como string', () => {
      const { filter, params } = buildDateFilter('2024', '03', 'anual');
      
      expect(params[0]).toBe(2024);
      expect(params[1]).toBe(3); // parseInt remove zeros à esquerda
    });

    it('deve retornar filtro vazio quando não há parâmetros válidos', () => {
      const { filter, params } = buildDateFilter('todos', 'todos', 'custom');
      
      expect(filter).toBe('');
      expect(params).toEqual([]);
    });
  });
});

