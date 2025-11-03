import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import RestaurantSearch from '@/components/RestaurantSearch';

// Mock do fetch global
global.fetch = jest.fn();

// Mock dos componentes UI
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
}));

const mockOnSelect = jest.fn();

describe('RestaurantSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    
    // Mock padrão para a chamada de restaurantes
    (fetch as jest.Mock).mockResolvedValue({
      json: async () => [],
    });
  });

  it('deve renderizar o botão de seleção', async () => {
    await act(async () => {
      render(<RestaurantSearch onSelect={mockOnSelect} period="anual" />);
    });
    
    expect(screen.getByText('Unidade')).toBeInTheDocument();
  });

  it('deve carregar restaurantes da API', async () => {
    const mockRestaurants = [
      { id: 1, name: 'Restaurante A' },
      { id: 2, name: 'Restaurante B' },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRestaurants,
    });

    await act(async () => {
      render(<RestaurantSearch onSelect={mockOnSelect} period="anual" />);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/restaurantes');
    });
  });

  it('deve abrir dropdown quando clicado', async () => {
    const mockRestaurants = [{ id: 1, name: 'Restaurante A' }];
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRestaurants,
    });

    await act(async () => {
      render(<RestaurantSearch onSelect={mockOnSelect} period="anual" />);
    });

    await waitFor(() => {
      const button = screen.getByText('Unidade');
      act(() => {
        fireEvent.click(button);
      });
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Digite para buscar...')).toBeInTheDocument();
    });
  });

  it('deve filtrar restaurantes pela busca', async () => {
    const mockRestaurants = [
      { id: 1, name: 'Restaurante Alpha' },
      { id: 2, name: 'Restaurante Beta' },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRestaurants,
    });

    await act(async () => {
      render(<RestaurantSearch onSelect={mockOnSelect} period="anual" />);
    });

    await waitFor(() => {
      const button = screen.getByText('Unidade');
      act(() => {
        fireEvent.click(button);
      });
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Digite para buscar...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Digite para buscar...');
    act(() => {
      fireEvent.change(input, { target: { value: 'Alpha' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Restaurante Alpha')).toBeInTheDocument();
      expect(screen.queryByText('Restaurante Beta')).not.toBeInTheDocument();
    });
  });

  it('deve chamar onSelect quando restaurante é selecionado', async () => {
    const mockRestaurants = [{ id: 1, name: 'Restaurante A' }];
    const mockResponses = {
      total: 100,
      revenue: 5000.50,
      nome: 'Produto X',
      total: 50,
      manha: 30,
      tarde: 40,
      noite: 30,
      ticketMedio: 50.25,
      variacao: 5.0,
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => mockRestaurants })
      .mockResolvedValueOnce({ json: async () => ({ total: 100 }) })
      .mockResolvedValueOnce({ json: async () => ({ revenue: '5000.50' }) })
      .mockResolvedValueOnce({ json: async () => ({ nome: 'Produto X', total: 50 }) })
      .mockResolvedValueOnce({ json: async () => ({ manha: 30, tarde: 40, noite: 30 }) })
      .mockResolvedValueOnce({ json: async () => ({ ticketMedio: 50.25, variacao: 5.0 }) });

    await act(async () => {
      render(<RestaurantSearch onSelect={mockOnSelect} period="anual" />);
    });

    await waitFor(() => {
      const button = screen.getByText('Unidade');
      act(() => {
        fireEvent.click(button);
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Restaurante A')).toBeInTheDocument();
    });

    const restaurantButton = screen.getByText('Restaurante A');
    fireEvent.click(restaurantButton);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalled();
    });
  });

  it('deve exibir "Carregando..." durante o carregamento', async () => {
    const mockRestaurants = [{ id: 1, name: 'Restaurante A' }];

    (fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => mockRestaurants })
      .mockImplementationOnce(() => new Promise(() => {})); // Nunca resolve

    await act(async () => {
      render(<RestaurantSearch onSelect={mockOnSelect} period="anual" />);
    });

    await waitFor(() => {
      const button = screen.getByText('Unidade');
      act(() => {
        fireEvent.click(button);
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Restaurante A')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Restaurante A'));

    await waitFor(() => {
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });
  });

  it('deve usar o período correto nas chamadas de API', async () => {
    const mockRestaurants = [{ id: 1, name: 'Restaurante A' }];

    (fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => mockRestaurants })
      .mockResolvedValueOnce({ json: async () => ({ total: 100 }) })
      .mockResolvedValueOnce({ json: async () => ({ revenue: '5000' }) })
      .mockResolvedValueOnce({ json: async () => ({ nome: 'Produto', total: 50 }) })
      .mockResolvedValueOnce({ json: async () => ({ manha: 30, tarde: 40, noite: 30 }) })
      .mockResolvedValueOnce({ json: async () => ({ ticketMedio: 50, variacao: 0 }) });

    render(<RestaurantSearch onSelect={mockOnSelect} period="mensal" />);

    const button = screen.getByText('Unidade');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Restaurante A')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Restaurante A'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/restaurante/1/vendas?period=mensal');
      expect(fetch).toHaveBeenCalledWith('/api/restaurante/1/faturamento?period=mensal');
    });
  });

  it('deve fechar dropdown ao clicar fora', async () => {
    const mockRestaurants = [{ id: 1, name: 'Restaurante A' }];

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRestaurants,
    });

    await act(async () => {
      render(<RestaurantSearch onSelect={mockOnSelect} period="anual" />);
    });

    await waitFor(() => {
      const button = screen.getByText('Unidade');
      act(() => {
        fireEvent.click(button);
      });
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Digite para buscar...')).toBeInTheDocument();
    });

    // Simular clique fora
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Digite para buscar...')).not.toBeInTheDocument();
    });
  });

  it('deve limpar busca quando dropdown fechar', async () => {
    const mockRestaurants = [{ id: 1, name: 'Restaurante A' }];

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRestaurants,
    });

    await act(async () => {
      render(<RestaurantSearch onSelect={mockOnSelect} period="anual" />);
    });

    await waitFor(() => {
      const button = screen.getByText('Unidade');
      act(() => {
        fireEvent.click(button);
      });
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Digite para buscar...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Digite para buscar...');
    act(() => {
      fireEvent.change(input, { target: { value: 'teste' } });
    });
    expect(input).toHaveValue('teste');

    // Fechar dropdown
    act(() => {
      fireEvent.mouseDown(document.body);
    });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Digite para buscar...')).not.toBeInTheDocument();
    });

    // Reabrir e verificar que busca foi limpa
    const buttonAgain = screen.getByText('Unidade');
    act(() => {
      fireEvent.click(buttonAgain);
    });

    await waitFor(() => {
      const newInput = screen.getByPlaceholderText('Digite para buscar...');
      expect(newInput).toHaveValue('');
    });
  });
});

