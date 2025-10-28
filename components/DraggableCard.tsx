'use client';

import { Card } from '@/components/ui/card';

interface DraggableCardProps {
  id: string;
  children: React.ReactNode;
  position: { x: number; y: number };
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}

/**
 * Componente genérico de Card arrastável
 * @param id - Identificador único do card
 * @param children - Conteúdo do card
 * @param position - Posição atual {x, y}
 * @param isDragging - Indica se está sendo arrastado
 * @param onMouseDown - Handler de mouse down
 * @param className - Classes CSS adicionais
 */
export function DraggableCard({ 
  id, 
  children, 
  position, 
  isDragging, 
  onMouseDown, 
  className 
}: DraggableCardProps) {
  return (
    <Card
      className={`flex-1 border-[--color-primary]/30 p-6 cursor-move select-none transition-none ${className || ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: isDragging ? 1000 : 1
      }}
      onMouseDown={onMouseDown}
    >
      {children}
    </Card>
  );
}

