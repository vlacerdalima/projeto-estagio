import { GET } from '@/app/api/restaurante/[id]/faturamento/route';
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

describe('GET /api/restaurante/[id]/faturamento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar faturamento com sucesso', async () => {
    const mockParams = Promise.resolve({ id: '123' });
    const mockRequest = new Request('http://localhost/api/restaurante/123/faturamento?period=anual');
    
    mockedBuildDateFilter.mockReturnValue({
      filter: '',
      params: []
    });

    mockedPool.query.mockResolvedValue({
      rows: [{ revenue: '12500.50' }],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    } as any);

    const response = await GET(mockRequest, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.revenue).toBe(12500.50);
    expect(mockedPool.query).toHaveBeenCalledWith(
      expect.stringContaining('COALESCE(SUM(p.value), 0)'),
      ['123']
    );
  });

  it('deve usar filtros de data quando fornecidos', async () => {
    const mockParams = Promise.resolve({ id: '123' });
    const mockRequest = new Request('http://localhost/api/restaurante/123/faturamento?period=mensal&year=2024&month=5');
    
    mockedBuildDateFilter.mockReturnValue({
      filter: 'AND EXTRACT(YEAR FROM s.created_at) = $2 AND EXTRACT(MONTH FROM s.created_at) = $3',
      params: [2024, 5]
    });

    mockedPool.query.mockResolvedValue({
      rows: [{ revenue: '8500.25' }],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    } as any);

    const response = await GET(mockRequest, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.revenue).toBe(8500.25);
    // buildDateFilter é chamado sem paramIndex explicitamente, usa default (2)
    expect(mockedBuildDateFilter).toHaveBeenCalledWith('2024', '5', 'mensal', 's.');
    expect(mockedPool.query).toHaveBeenCalledWith(
      expect.stringContaining('JOIN payments p ON s.id = p.sale_id'),
      ['123', 2024, 5]
    );
  });

  it('deve retornar 0 quando não há faturamento', async () => {
    const mockParams = Promise.resolve({ id: '123' });
    const mockRequest = new Request('http://localhost/api/restaurante/123/faturamento');
    
    mockedBuildDateFilter.mockReturnValue({
      filter: '',
      params: []
    });

    mockedPool.query.mockResolvedValue({
      rows: [{ revenue: '0' }],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    } as any);

    const response = await GET(mockRequest, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.revenue).toBe(0);
  });

  it('deve usar tableAlias "s." corretamente', async () => {
    const mockParams = Promise.resolve({ id: '123' });
    const mockRequest = new Request('http://localhost/api/restaurante/123/faturamento');
    
    mockedBuildDateFilter.mockReturnValue({
      filter: '',
      params: []
    });

    mockedPool.query.mockResolvedValue({
      rows: [{ revenue: '1000' }],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    } as any);

    await GET(mockRequest, { params: mockParams });

    // buildDateFilter é chamado sem paramIndex explicitamente, usa default (2)
    expect(mockedBuildDateFilter).toHaveBeenCalledWith(null, null, 'anual', 's.');
  });

  it('deve retornar erro 500 quando ocorre erro no banco', async () => {
    const mockParams = Promise.resolve({ id: '123' });
    const mockRequest = new Request('http://localhost/api/restaurante/123/faturamento');
    
    mockedBuildDateFilter.mockReturnValue({
      filter: '',
      params: []
    });

    mockedPool.query.mockRejectedValue(new Error('Database connection failed'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const response = await GET(mockRequest, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erro ao buscar faturamento');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

