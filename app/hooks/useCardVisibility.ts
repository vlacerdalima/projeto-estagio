import { useState, useRef, useEffect } from 'react';
import type { VisibleCards, TemplateType } from '@/app/types';

export function useCardVisibility(isSmartphone: boolean, selectedRestaurant: number | null) {
  const [visibleCards, setVisibleCards] = useState<VisibleCards>({
    sales: false,
    revenue: false,
    produto: false,
    turno: false,
    ticketMedio: false,
    canal: false,
    produtoRemovido: false,
    tendencia: false,
    desvioMedia: false,
    tempoMedioEntrega: false
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
        canal: true,
        produtoRemovido: false,
        tendencia: false,
        desvioMedia: false,
        tempoMedioEntrega: false
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
          canal: true,
          produtoRemovido: false,
          tendencia: false,
          desvioMedia: false,
          tempoMedioEntrega: false
        });
        break;
      case 'vendas':
        setVisibleCards({
          sales: true,
          revenue: false,
          produto: true,
          turno: true,
          ticketMedio: false,
          canal: true,
          produtoRemovido: false,
          tendencia: true,
          desvioMedia: true,
          tempoMedioEntrega: false
        });
        break;
      case 'faturamento':
        setVisibleCards({
          sales: false,
          revenue: true,
          produto: false,
          turno: false,
          ticketMedio: true,
          canal: false,
          produtoRemovido: false,
          tendencia: false,
          desvioMedia: false,
          tempoMedioEntrega: false
        });
        break;
      case 'produtos':
        setVisibleCards({
          sales: false,
          revenue: false,
          produto: true,
          turno: false,
          ticketMedio: false,
          canal: false,
          produtoRemovido: true,
          tendencia: false,
          desvioMedia: false,
          tempoMedioEntrega: true
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
      canal: false,
      produtoRemovido: false,
      tendencia: false,
      desvioMedia: false,
      tempoMedioEntrega: false
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

