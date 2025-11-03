import { renderHook, act } from '@testing-library/react';
import { useCardVisibility } from '@/app/hooks/useCardVisibility';

describe('useCardVisibility', () => {
  describe('Inicialização', () => {
    it('deve começar com todos os cards ocultos', () => {
      const { result } = renderHook(() => useCardVisibility(false, null));

      expect(result.current.visibleCards.sales).toBe(false);
      expect(result.current.visibleCards.revenue).toBe(false);
      expect(result.current.visibleCards.produto).toBe(false);
      expect(result.current.currentTemplate).toBe('geral');
    });

    it('deve inicializar cards automaticamente quando restaurante é selecionado no desktop', () => {
      const { result } = renderHook(() => useCardVisibility(false, 1));

      expect(result.current.visibleCards.sales).toBe(true);
      expect(result.current.visibleCards.revenue).toBe(true);
      expect(result.current.visibleCards.produto).toBe(true);
      expect(result.current.visibleCards.turno).toBe(true);
      expect(result.current.visibleCards.ticketMedio).toBe(true);
      expect(result.current.visibleCards.canal).toBe(true);
      expect(result.current.visibleCards.tempoMedioEntrega).toBe(true);
      expect(result.current.currentTemplate).toBe('geral');
    });

    it('não deve inicializar cards automaticamente no smartphone', () => {
      const { result } = renderHook(() => useCardVisibility(true, 1));

      expect(result.current.visibleCards.sales).toBe(false);
      expect(result.current.visibleCards.revenue).toBe(false);
    });
  });

  describe('removeCard', () => {
    it('deve remover um card específico', () => {
      const { result } = renderHook(() => useCardVisibility(false, 1));

      act(() => {
        result.current.removeCard('sales');
      });

      expect(result.current.visibleCards.sales).toBe(false);
      expect(result.current.visibleCards.revenue).toBe(true); // Outros mantêm estado
    });
  });

  describe('addCard', () => {
    it('deve adicionar um card específico', () => {
      const { result } = renderHook(() => useCardVisibility(false, null));

      act(() => {
        result.current.addCard('sales');
      });

      expect(result.current.visibleCards.sales).toBe(true);
      expect(result.current.visibleCards.revenue).toBe(false); // Outros mantêm estado
    });
  });

  describe('applyTemplate', () => {
    it('deve aplicar template "geral" corretamente', () => {
      const { result } = renderHook(() => useCardVisibility(false, null));

      act(() => {
        result.current.applyTemplate('geral');
      });

      expect(result.current.currentTemplate).toBe('geral');
      expect(result.current.visibleCards.sales).toBe(true);
      expect(result.current.visibleCards.revenue).toBe(true);
      expect(result.current.visibleCards.produto).toBe(true);
      expect(result.current.visibleCards.turno).toBe(true);
      expect(result.current.visibleCards.ticketMedio).toBe(true);
      expect(result.current.visibleCards.canal).toBe(true);
      expect(result.current.visibleCards.tempoMedioEntrega).toBe(true);
      expect(result.current.visibleCards.produtoRemovido).toBe(false);
      expect(result.current.visibleCards.tendencia).toBe(false);
      expect(result.current.visibleCards.desvioMedia).toBe(false);
      expect(result.current.visibleCards.sazonalidade).toBe(false);
    });

    it('deve aplicar template "vendas" corretamente', () => {
      const { result } = renderHook(() => useCardVisibility(false, null));

      act(() => {
        result.current.applyTemplate('vendas');
      });

      expect(result.current.currentTemplate).toBe('vendas');
      expect(result.current.visibleCards.sales).toBe(true);
      expect(result.current.visibleCards.produto).toBe(true);
      expect(result.current.visibleCards.turno).toBe(true);
      expect(result.current.visibleCards.canal).toBe(true);
      expect(result.current.visibleCards.tendencia).toBe(true);
      expect(result.current.visibleCards.desvioMedia).toBe(true);
      expect(result.current.visibleCards.revenue).toBe(false);
      expect(result.current.visibleCards.ticketMedio).toBe(false);
    });

    it('deve aplicar template "faturamento" corretamente', () => {
      const { result } = renderHook(() => useCardVisibility(false, null));

      act(() => {
        result.current.applyTemplate('faturamento');
      });

      expect(result.current.currentTemplate).toBe('faturamento');
      expect(result.current.visibleCards.revenue).toBe(true);
      expect(result.current.visibleCards.ticketMedio).toBe(true);
      expect(result.current.visibleCards.sales).toBe(false);
      expect(result.current.visibleCards.produto).toBe(false);
    });

    it('deve aplicar template "produtos" corretamente', () => {
      const { result } = renderHook(() => useCardVisibility(false, null));

      act(() => {
        result.current.applyTemplate('produtos');
      });

      expect(result.current.currentTemplate).toBe('produtos');
      expect(result.current.visibleCards.produto).toBe(true);
      expect(result.current.visibleCards.produtoRemovido).toBe(true);
      expect(result.current.visibleCards.tempoMedioEntrega).toBe(true);
      expect(result.current.visibleCards.sazonalidade).toBe(true);
      expect(result.current.visibleCards.sales).toBe(false);
      expect(result.current.visibleCards.revenue).toBe(false);
    });
  });

  describe('removeAllCards', () => {
    it('deve remover todos os cards', () => {
      const { result } = renderHook(() => useCardVisibility(false, 1));

      // Garantir que há cards visíveis
      expect(result.current.visibleCards.sales).toBe(true);

      act(() => {
        result.current.removeAllCards();
      });

      expect(result.current.visibleCards.sales).toBe(false);
      expect(result.current.visibleCards.revenue).toBe(false);
      expect(result.current.visibleCards.produto).toBe(false);
      expect(result.current.visibleCards.turno).toBe(false);
      expect(result.current.visibleCards.ticketMedio).toBe(false);
      expect(result.current.visibleCards.canal).toBe(false);
      expect(result.current.visibleCards.tempoMedioEntrega).toBe(false);
    });
  });
});

