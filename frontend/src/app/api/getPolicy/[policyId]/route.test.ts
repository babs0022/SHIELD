import { GET } from './route';
import { NextRequest } from 'next/server';
import { Pool } from 'pg';

// Mock the 'pg' module
jest.mock('pg', () => {
  const mockQuery = jest.fn();
  const mockRelease = jest.fn();
  const mockConnect = jest.fn(() => ({
    query: mockQuery,
    release: mockRelease,
  }));
  return {
    Pool: jest.fn(() => ({
      connect: mockConnect,
      query: mockQuery, // Also mock query on the pool for direct calls if any
    })),
  };
});

// Helper to create a mock NextRequest
const createMockRequest = (url: string) => {
  return {
    url: url,
    json: async () => ({}), // GET requests typically don't have a body
  } as NextRequest;
};

describe('/api/getPolicy/[policyId]', () => {
  let mockPool: jest.Mocked<Pool>;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = new Pool() as jest.Mocked<Pool>;
    const mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
    mockQuery = mockClient.query;
  });

  it('should return a policy if found', async () => {
    const policyId = '0x123';
    const mockPolicy = {
      resource_cid: 'cid123',
      recipient_address: '0xabc',
      secret_key: 'secret',
      mime_type: 'text/plain',
      is_text: true,
    };
    mockQuery.mockResolvedValueOnce({ rows: [mockPolicy], rowCount: 1 });

    const request = createMockRequest(`http://localhost:3000/api/getPolicy/${policyId}`);
    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      resourceCid: mockPolicy.resource_cid,
      recipient_address: mockPolicy.recipient_address,
      secretKey: mockPolicy.secret_key,
      mimeType: mockPolicy.mime_type,
      isText: mockPolicy.is_text,
    });
    expect(mockPool.connect).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM policies WHERE policy_id = $1', [policyId]);
  });

  it('should return 404 if policy is not found', async () => {
    const policyId = '0x456';
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const request = createMockRequest(`http://localhost:3000/api/getPolicy/${policyId}`);
    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody.error).toBe('Policy not found.');
    expect(mockPool.connect).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM policies WHERE policy_id = $1', [policyId]);
  });

  it('should return 400 if policyId is not provided in the URL', async () => {
    // The route extracts policyId from the URL pathname, so we simulate a URL without it
    const request = createMockRequest(`http://localhost:3000/api/getPolicy/`);
    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('Policy ID not provided.');
    expect(mockPool.connect).not.toHaveBeenCalled(); // No DB interaction if policyId is missing
  });

  it('should return 500 if there is a database error', async () => {
    const policyId = '0x789';
    const dbError = new Error('Database connection failed');
    mockQuery.mockRejectedValueOnce(dbError);

    const request = createMockRequest(`http://localhost:3000/api/getPolicy/${policyId}`);
    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody.error).toBe('Failed to retrieve policy.');
    expect(responseBody.details).toBe(dbError.message);
    expect(mockPool.connect).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM policies WHERE policy_id = $1', [policyId]);
  });
});
