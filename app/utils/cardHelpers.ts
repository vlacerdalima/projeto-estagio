import type { CardType } from '@/app/types';

export function getCardPosition(
  type: CardType,
  positions: Record<CardType, { x: number; y: number }>
): { x: number; y: number } {
  return positions[type];
}

export function getCardRef(
  type: CardType,
  refs: Record<CardType, React.RefObject<HTMLDivElement>>
): React.RefObject<HTMLDivElement> {
  return refs[type];
}

export function shouldPreventDrag(e: React.MouseEvent | React.TouchEvent, cardRef: HTMLElement): boolean {
  const target = e.target as HTMLElement;
  
  // Verificar se o clique foi no botão de deletar
  if (target.classList.contains('delete-button')) {
    return true;
  }
  
  // Verificar se o clique foi dentro da tabela de ranking
  let element = target;
  while (element && element !== cardRef) {
    if (element.classList.contains('ranking-table-container')) {
      return true;
    }
    element = element.parentElement as HTMLElement;
  }
  
  return false;
}

