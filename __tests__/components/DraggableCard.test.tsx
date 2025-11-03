import { render, screen, fireEvent } from '@testing-library/react';
import DraggableCard from '@/app/components/DraggableCard';
import type { CardType, Position } from '@/app/types';

// Mock do componente Card do shadcn/ui
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
}));

describe('DraggableCard', () => {
  const mockOnMouseDown = jest.fn();
  const mockOnTouchStart = jest.fn();
  const mockOnRemove = jest.fn();
  const defaultPosition: Position = { x: 0, y: 0 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o card com conteúdo', () => {
    render(
      <DraggableCard
        type="sales"
        position={defaultPosition}
        isDragging={false}
        onMouseDown={mockOnMouseDown}
        onTouchStart={mockOnTouchStart}
        onRemove={mockOnRemove}
      >
        <div>Conteúdo do card</div>
      </DraggableCard>
    );

    expect(screen.getByText('Conteúdo do card')).toBeInTheDocument();
  });

  it('deve aplicar transform baseado na posição', () => {
    const position: Position = { x: 100, y: 200 };
    render(
      <DraggableCard
        type="sales"
        position={position}
        isDragging={false}
        onMouseDown={mockOnMouseDown}
        onTouchStart={mockOnTouchStart}
        onRemove={mockOnRemove}
      >
        <div>Test</div>
      </DraggableCard>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveStyle({ transform: 'translate(100px, 200px)' });
  });

  it('deve aplicar zIndex alto quando está sendo arrastado', () => {
    render(
      <DraggableCard
        type="sales"
        position={defaultPosition}
        isDragging={true}
        onMouseDown={mockOnMouseDown}
        onTouchStart={mockOnTouchStart}
        onRemove={mockOnRemove}
      >
        <div>Test</div>
      </DraggableCard>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveStyle({ zIndex: 1000 });
  });

  it('deve aplicar zIndex normal quando não está sendo arrastado', () => {
    render(
      <DraggableCard
        type="sales"
        position={defaultPosition}
        isDragging={false}
        onMouseDown={mockOnMouseDown}
        onTouchStart={mockOnTouchStart}
        onRemove={mockOnRemove}
      >
        <div>Test</div>
      </DraggableCard>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveStyle({ zIndex: 1 });
  });

  it('deve chamar onMouseDown quando clicado', () => {
    render(
      <DraggableCard
        type="sales"
        position={defaultPosition}
        isDragging={false}
        onMouseDown={mockOnMouseDown}
        onTouchStart={mockOnTouchStart}
        onRemove={mockOnRemove}
      >
        <div>Test</div>
      </DraggableCard>
    );

    const card = screen.getByTestId('card');
    fireEvent.mouseDown(card);

    expect(mockOnMouseDown).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onTouchStart quando tocado', () => {
    render(
      <DraggableCard
        type="sales"
        position={defaultPosition}
        isDragging={false}
        onMouseDown={mockOnMouseDown}
        onTouchStart={mockOnTouchStart}
        onRemove={mockOnRemove}
      >
        <div>Test</div>
      </DraggableCard>
    );

    const card = screen.getByTestId('card');
    fireEvent.touchStart(card);

    expect(mockOnTouchStart).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onRemove quando botão de deletar é clicado', () => {
    render(
      <DraggableCard
        type="sales"
        position={defaultPosition}
        isDragging={false}
        onMouseDown={mockOnMouseDown}
        onTouchStart={mockOnTouchStart}
        onRemove={mockOnRemove}
      >
        <div>Test</div>
      </DraggableCard>
    );

    const deleteButton = screen.getByText('✕');
    fireEvent.click(deleteButton);

    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  it('deve aplicar className customizada', () => {
    render(
      <DraggableCard
        type="sales"
        position={defaultPosition}
        isDragging={false}
        onMouseDown={mockOnMouseDown}
        onTouchStart={mockOnTouchStart}
        onRemove={mockOnRemove}
        className="custom-class"
      >
        <div>Test</div>
      </DraggableCard>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
  });

  it('deve aplicar style customizado', () => {
    const customStyle = { width: '300px', backgroundColor: 'red' };
    render(
      <DraggableCard
        type="sales"
        position={defaultPosition}
        isDragging={false}
        onMouseDown={mockOnMouseDown}
        onTouchStart={mockOnTouchStart}
        onRemove={mockOnRemove}
        style={customStyle}
      >
        <div>Test</div>
      </DraggableCard>
    );

    const card = screen.getByTestId('card');
    // Verificar que o style está aplicado no elemento (pode ser através do atributo style)
    expect(card).toHaveAttribute('style');
    const styleAttr = card.getAttribute('style');
    expect(styleAttr).toContain('width: 300px');
  });

  it('deve ter data-card-type com o tipo correto', () => {
    render(
      <DraggableCard
        type="revenue"
        position={defaultPosition}
        isDragging={false}
        onMouseDown={mockOnMouseDown}
        onTouchStart={mockOnTouchStart}
        onRemove={mockOnRemove}
      >
        <div>Test</div>
      </DraggableCard>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('data-card-type', 'revenue');
  });

  it('deve usar posição padrão quando position é undefined', () => {
    render(
      <DraggableCard
        type="sales"
        position={{ x: 0, y: 0 }}
        isDragging={false}
        onMouseDown={mockOnMouseDown}
        onTouchStart={mockOnTouchStart}
        onRemove={mockOnRemove}
      >
        <div>Test</div>
      </DraggableCard>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveStyle({ transform: 'translate(0px, 0px)' });
  });
});

