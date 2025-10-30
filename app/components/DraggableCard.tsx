'use client';

import { forwardRef } from 'react';
import { Card } from "@/components/ui/card";
import type { CardType, Position } from '@/app/types';

interface DraggableCardProps {
  type: CardType;
  position: Position;
  isDragging: boolean;
  children: React.ReactNode;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onRemove: () => void;
  className?: string;
}

const DraggableCard = forwardRef<HTMLDivElement, DraggableCardProps>(({
  type,
  position,
  isDragging,
  children,
  onMouseDown,
  onTouchStart,
  onRemove,
  className = ''
}, ref) => {
  return (
    <Card
      ref={ref}
      data-card-type={type}
      className={`border-[--color-primary]/30 p-4 md:p-6 cursor-move select-none transition-none relative self-start touch-none ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: isDragging ? 1000 : 1
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <button
        onClick={onRemove}
        className="delete-button absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
      >
        ✕
      </button>
      {children}
    </Card>
  );
});

DraggableCard.displayName = 'DraggableCard';

export default DraggableCard;

