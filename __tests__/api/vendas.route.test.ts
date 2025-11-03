import { GET } from '@/app/api/restaurante/[id]/vendas/route';
import pool from '@/lib/db';
import { buildDateFilter } from '@/lib/dateFilter';
import { NextResponse } from 'next/server';

// Mock das dependências
jest.mock('@/lib/db');
jest.mock('@/lib/dateFilter');
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      statusText: init?.statusText || 'OK',
    })),
  },
}));

const mockedPool = pool as jest.Mocked<typeof pool>;
const mockedBuildDateFilter = buildDateFilter as jest.MockedFunction<typeof buildDateFilter>;

describe('GET /api/restaurante/[id]/vendas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar total de vendas com sucesso', async () => {
    const mockParams = Promise.resolve({ id: '123' });
    const mockRequest = new Request('http://localhost/api/restaurante/123/vendas?period=anual');
    
    mockedBuildDateFilter.mockReturnValue({
      filter: '',
      params: []
    });

    mockedPool.query.mockResolvedValue({
      rows: [{ total: '500' }],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    } as any);

    const response = await GET(mockRequest, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ total: 500 });
    expect(mockedPool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT COUNT(*)'),
      ['123']
    );
  });

  it('deve usar filtros de data quando fornecidos', async () => {
    const mockParams = Promise.resolve({ id: '123' });
    const mockRequest = new Request('http://localhost/api/restaurante/123/vendas?period=anual&year=2024&month=3');
    
    mockedBuildDateFilter.mockReturnValue({
      filter: 'AND EXTRACT(YEAR FROM created_at) = $2 AND EXTRACT(MONTH FROM created_at) = $3',
      params: [2024, 3]
    });

    mockedPool.query.mockResolvedValue({
      rows: [{ total: '250' }],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    } as any);

    const response = await GET(mockRequest, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total).toBe(250);
    // buildDateFilter é chamado sem paramIndex explicitamente, usa default (2)
    expect(mockedBuildDateFilter).toHaveBeenCalledWith('2024', '3', 'anual', '');
    expect(mockedPool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE store_id = $1'),
      ['123', 2024, 3]
    );
  });

  it('deve usar período padrão "anual" quando não fornecido', async () => {
    const mockParams = Promise.resolve({ id: '123' });
    const mockRequest = new Request('http://localhost/api/restaurante/123/vendas');
    
    mockedBuildDateFilter.mockReturnValue({
      filter: '',
      params: []
    });

    mockedPool.query.mockResolvedValue({
      rows: [{ total: '1000' }],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    } as any);

    await GET(mockRequest, { params: mockParams });

    // buildDateFilter é chamado sem paramIndex explicitamente, usa default (2)
    expect(mockedBuildDateFilter).toHaveBeenCalledWith(null, null, 'anual', '');
  });

  it('deve retornar erro 500 quando ocorre erro no banco', async () => {
    const mockParams = Promise.resolve({ id: '123' });
    const mockRequest = new Request('http://localhost/api/restaurante/123/vendas');
    
    mockedBuildDateFilter.mockReturnValue({
      filter: '',
      params: []
    });

    mockedPool.query.mockRejectedValue(new Error('Database error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const response = await GET(mockRequest, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erro ao buscar vendas');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

