'use client';

import { useState, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableReturn {
  positions: Record<string, Position>;
  isDragging: string | null;
  handleMouseDown: (id: string, e: React.MouseEvent) => void;
  resetPosition: (id: string) => void;
  resetAllPositions: () => void;
}

/**
 * Hook customizado para gerenciar drag and drop de múltiplos elementos
 * @returns Funções e estados para controlar elementos arrastáveis
 */
export function useDraggable(): UseDraggableReturn {
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const handleMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Apenas botão esquerdo do mouse
    e.preventDefault();
    
    setIsDragging(id);
    
    // Captura a posição atual do card e do mouse
    const currentPosition = positions[id] || { x: 0, y: 0 };
    const mouseStartX = e.clientX;
    const mouseStartY = e.clientY;
    
    // Calcula o offset (distância entre o ponto de clique e a origem do card)
    const offsetX = mouseStartX - currentPosition.x;
    const offsetY = mouseStartY - currentPosition.y;

    const handleMouseMove = (e: MouseEvent) => {
      // Nova posição = posição do mouse - offset inicial
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;

      setPositions(prev => ({
        ...prev,
        [id]: { x: newX, y: newY }
      }));
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [positions]);

  const resetPosition = useCallback((id: string) => {
    setPositions(prev => ({
      ...prev,
      [id]: { x: 0, y: 0 }
    }));
  }, []);

  const resetAllPositions = useCallback(() => {
    setPositions({});
  }, []);

  return {
    positions,
    isDragging,
    handleMouseDown,
    resetPosition,
    resetAllPositions
  };
}

