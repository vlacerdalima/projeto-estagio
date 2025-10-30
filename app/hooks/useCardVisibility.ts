import { useState, useRef, useEffect } from 'react';
import type { VisibleCards, TemplateType } from '@/app/types';

export function useCardVisibility(isSmartphone: boolean, selectedRestaurant: number | null) {
  const [visibleCards, setVisibleCards] = useState<VisibleCards>({
    sales: false,
    revenue: false,
    produto: false,
    turno: false,
    ticketMedio: false,
    canal: false
  });
  
  const [currentTemplate, setCurrentTemplate] = useState<TemplateType>('geral');
  const cardsInitializedRef = useRef(false);

  // Mostrar cards automaticamente quando restaurante for selecionado (apenas no desktop)
  useEffect(() => {
    if (selectedRestaurant && !isSmartphone && !cardsInitializedRef.current) {
      setCurrentTemplate('geral');
      setVisibleCards({
        sales: true,
        revenue: true,
        produto: true,
        turno: true,
        ticketMedio: true,
        canal: true
      });
      cardsInitializedRef.current = true;
    }
  }, [selectedRestaurant, isSmartphone]);

  const removeCard = (cardType: keyof VisibleCards) => {
    setVisibleCards(prev => ({ ...prev, [cardType]: false }));
  };

  const addCard = (cardType: keyof VisibleCards) => {
    setVisibleCards(prev => ({ ...prev, [cardType]: true }));
  };

  const applyTemplate = (template: TemplateType) => {
    setCurrentTemplate(template);
    switch (template) {
      case 'geral':
        setVisibleCards({
          sales: true,
          revenue: true,
          produto: true,
          turno: true,
          ticketMedio: true,
          canal: true
        });
        break;
      case 'vendas':
        setVisibleCards({
          sales: true,
          revenue: false,
          produto: true,
          turno: true,
          ticketMedio: false,
          canal: true
        });
        break;
      case 'faturamento':
        setVisibleCards({
          sales: false,
          revenue: true,
          produto: false,
          turno: false,
          ticketMedio: true,
          canal: false
        });
        break;
    }
  };

  const removeAllCards = () => {
    setVisibleCards({
      sales: false,
      revenue: false,
      produto: false,
      turno: false,
      ticketMedio: false,
      canal: false
    });
  };

  return {
    visibleCards,
    currentTemplate,
    removeCard,
    addCard,
    applyTemplate,
    removeAllCards
  };
}

