import { useState, RefObject } from 'react';
import type { Position, CardType } from '@/app/types';

interface UseCardDragProps {
  positions: Record<CardType, Position>;
  refs: Record<CardType, RefObject<HTMLDivElement | null>>;
  onPositionChange: (type: CardType, position: Position) => void;
}

export function useCardDrag({ positions, refs, onPositionChange }: UseCardDragProps) {
  const [isDragging, setIsDragging] = useState<CardType | null>(null);

  const startDrag = (
    type: CardType,
    clientX: number,
    clientY: number
  ) => {
    setIsDragging(type);
    
    const currentPosition = positions[type];
    const cardRef = refs[type].current;
    
    if (!cardRef) return;
    
    const cardRect = cardRef.getBoundingClientRect();
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;
    
    const startX = clientX;
    const startY = clientY;
    
    const offsetX = startX - cardRect.left;
    const offsetY = startY - cardRect.top;

    let isCleanedUp = false;
    let shouldCleanup = false;

    const handleMove = (moveX: number, moveY: number) => {
      try {
        if (!cardRef || !cardRef.isConnected) {
          shouldCleanup = true;
          return;
        }

        const deltaX = moveX - startX;
        const deltaY = moveY - startY;
        
        let newX = currentPosition.x + deltaX;
        let newY = currentPosition.y + deltaY;

        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
        const gridContainer = document.querySelector('.grid');
        if (!gridContainer) return;
        
        const gridRect = gridContainer.getBoundingClientRect();
        const lineY = gridRect.top;
        
        const baseTop = cardRect.top - currentPosition.y;
        const baseLeft = cardRect.left - currentPosition.x;
        const baseBottom = baseTop + cardHeight;
        const baseRight = baseLeft + cardWidth;
        
        const minY = lineY - baseTop;
        if (newY < minY) {
          newY = minY;
        }
        
        const maxY = windowHeight - baseBottom;
        if (newY > maxY) {
          newY = maxY;
        }
        
        const minX = -baseLeft;
        if (newX < minX) {
          newX = minX;
        }
        
        const maxX = windowWidth - baseRight;
        if (newX > maxX) {
          newX = maxX;
        }

        onPositionChange(type, { x: newX, y: newY });
      } catch (error) {
        console.error('Erro durante movimento do card:', error);
        shouldCleanup = true;
      }
    };

    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      setIsDragging(null);
      try {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      } catch (error) {
        // Ignorar erro se listeners já foram removidos
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isCleanedUp) {
        handleMove(e.clientX, e.clientY);
        if (shouldCleanup) {
          cleanup();
        }
      }
    };

    const handleMouseUp = () => {
      cleanup();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isCleanedUp) return;
      try {
        e.preventDefault();
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          handleMove(touch.clientX, touch.clientY);
          if (shouldCleanup) {
            cleanup();
          }
        }
      } catch (error) {
        shouldCleanup = true;
      }
    };

    const handleTouchEnd = () => {
      cleanup();
    };

    try {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    } catch (error) {
      console.error('Erro ao adicionar listeners de drag:', error);
    }
  };

  return {
    isDragging,
    startDrag
  };
}

