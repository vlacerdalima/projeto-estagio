import { shouldPreventDrag, getCardPosition, getCardRef } from '@/app/utils/cardHelpers';
import type { CardType } from '@/app/types';
import { createRef } from 'react';

describe('cardHelpers', () => {
  describe('shouldPreventDrag', () => {
    let cardElement: HTMLElement;
    let deleteButton: HTMLElement;
    let rankingContainer: HTMLElement;
    let rankingChild: HTMLElement;
    let normalElement: HTMLElement;

    beforeEach(() => {
      // Criar elementos DOM simulados
      cardElement = document.createElement('div');
      deleteButton = document.createElement('button');
      deleteButton.className = 'delete-button';
      
      rankingContainer = document.createElement('div');
      rankingContainer.className = 'ranking-table-container';
      rankingChild = document.createElement('div');
      rankingContainer.appendChild(rankingChild);
      
      normalElement = document.createElement('div');
      
      document.body.appendChild(cardElement);
      cardElement.appendChild(deleteButton);
      cardElement.appendChild(rankingContainer);
      cardElement.appendChild(normalElement);
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    describe('Quando o clique é no botão de deletar', () => {
      it('deve retornar true para MouseEvent', () => {
        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(mouseEvent, 'target', {
          value: deleteButton,
          writable: false,
        });

        const result = shouldPreventDrag(
          mouseEvent as unknown as React.MouseEvent,
          cardElement
        );

        expect(result).toBe(true);
      });

      it('deve retornar true para TouchEvent', () => {
        const touchEvent = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(touchEvent, 'target', {
          value: deleteButton,
          writable: false,
        });

        const result = shouldPreventDrag(
          touchEvent as unknown as React.TouchEvent,
          cardElement
        );

        expect(result).toBe(true);
      });
    });

    describe('Quando o clique é dentro do container de ranking', () => {
      it('deve retornar true quando o clique é no container', () => {
        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(mouseEvent, 'target', {
          value: rankingContainer,
          writable: false,
        });

        const result = shouldPreventDrag(
          mouseEvent as unknown as React.MouseEvent,
          cardElement
        );

        expect(result).toBe(true);
      });

      it('deve retornar true quando o clique é em um filho do container', () => {
        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(mouseEvent, 'target', {
          value: rankingChild,
          writable: false,
        });

        const result = shouldPreventDrag(
          mouseEvent as unknown as React.MouseEvent,
          cardElement
        );

        expect(result).toBe(true);
      });
    });

    describe('Quando o clique é em elemento normal', () => {
      it('deve retornar false para elemento normal', () => {
        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(mouseEvent, 'target', {
          value: normalElement,
          writable: false,
        });

        const result = shouldPreventDrag(
          mouseEvent as unknown as React.MouseEvent,
          cardElement
        );

        expect(result).toBe(false);
      });
    });

    describe('getCardPosition', () => {
      it('deve retornar a posição do card corretamente', () => {
        const positions: Record<CardType, { x: number; y: number }> = {
          sales: { x: 10, y: 20 },
          revenue: { x: 30, y: 40 },
          produto: { x: 0, y: 0 },
          turno: { x: 0, y: 0 },
          ticketMedio: { x: 0, y: 0 },
          canal: { x: 0, y: 0 },
          produtoRemovido: { x: 0, y: 0 },
          tendencia: { x: 0, y: 0 },
          desvioMedia: { x: 0, y: 0 },
          tempoMedioEntrega: { x: 0, y: 0 },
          sazonalidade: { x: 0, y: 0 },
        };

        const position = getCardPosition('sales', positions);
        expect(position).toEqual({ x: 10, y: 20 });
      });
    });

    describe('getCardRef', () => {
      it('deve retornar a referência do card corretamente', () => {
        const salesRef = createRef<HTMLDivElement>();
        const refs: Record<CardType, React.RefObject<HTMLDivElement>> = {
          sales: salesRef,
          revenue: createRef<HTMLDivElement>(),
          produto: createRef<HTMLDivElement>(),
          turno: createRef<HTMLDivElement>(),
          ticketMedio: createRef<HTMLDivElement>(),
          canal: createRef<HTMLDivElement>(),
          produtoRemovido: createRef<HTMLDivElement>(),
          tendencia: createRef<HTMLDivElement>(),
          desvioMedia: createRef<HTMLDivElement>(),
          tempoMedioEntrega: createRef<HTMLDivElement>(),
          sazonalidade: createRef<HTMLDivElement>(),
        };

        const ref = getCardRef('sales', refs);
        expect(ref).toBe(salesRef);
      });
    });
  });
});

