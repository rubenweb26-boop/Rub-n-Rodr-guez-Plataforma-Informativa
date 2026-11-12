import { vi } from 'vitest';

// Mock environment variables for tests
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.DATA_ENCRYPTION_KEY_V1 = 'dGVzdC1lbmNyeXB0aW9uLWtleS12MS0zMi1ieXRlcw=='; // base64url encoded 32 bytes
process.env.DATA_ENCRYPTION_KEY_VERSION = 'v1';
process.env.AUDIT_HMAC_KEY = 'dGVzdC1hdWQtaG1hYy1rZXktMzItYnl0ZXM='; // base64 32 bytes
process.env.RATE_LIMIT_HMAC_KEY = 'dGVzdC1yYXRlLWxpbWl0LWhtYWMta2V5LTMyLWJ5dGVz'; // base64 32 bytes
process.env.ONVO_SECRET_KEY = 'test-onvo-secret';
process.env.ONVO_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.CRM_ORIGIN = 'http://localhost:3000';
process.env.COMPLAINT_INTAKE_ENABLED = 'true';
process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'test-turnstile-site-key';
process.env.TURNSTILE_SECRET_KEY = 'test-turnstile-secret';

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  })),
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  })),
}));

// Mock crypto.subtle methods for consistent hashing in tests
// We can't replace global.crypto, so we mock the specific methods we need
const originalSubtleDigest = global.crypto.subtle.digest;
const originalSubtleImportKey = global.crypto.subtle.importKey;
const originalSubtleEncrypt = global.crypto.subtle.encrypt;
const originalSubtleDecrypt = global.crypto.subtle.decrypt;
const originalSubtleGenerateKey = global.crypto.subtle.generateKey;
const originalSubtleExportKey = global.crypto.subtle.exportKey;
const originalRandomUUID = global.crypto.randomUUID;
const originalGetRandomValues = global.crypto.getRandomValues;

global.crypto.subtle.digest = vi.fn(async (algorithm: string, data: ArrayBuffer) => {
  // Simple deterministic hash for testing
  const bytes = new Uint8Array(data);
  let hash = 0;
  for (let i = 0; i < bytes.length; i++) {
    hash = ((hash << 5) - hash) + bytes[i];
    hash |= 0;
  }
  const hashBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    hashBytes[i] = (hash >> (i % 4) * 8) & 0xff;
  }
  return hashBytes.buffer;
});

global.crypto.subtle.importKey = vi.fn().mockResolvedValue({});
global.crypto.subtle.encrypt = vi.fn(async (algorithm: any, key: any, data: ArrayBuffer) => {
  const encrypted = new Uint8Array(data.byteLength + 16);
  encrypted.set(new Uint8Array(data));
  return encrypted.buffer;
});
global.crypto.subtle.decrypt = vi.fn(async (algorithm: any, key: any, data: ArrayBuffer) => {
  return data.slice(0, -16);
});
global.crypto.subtle.generateKey = vi.fn().mockResolvedValue({});
global.crypto.subtle.exportKey = vi.fn().mockResolvedValue(new ArrayBuffer(32));

global.crypto.randomUUID = vi.fn(() => '00000000-0000-4000-8000-000000000000');
global.crypto.getRandomValues = vi.fn((arr: Uint8Array) => {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = Math.floor(Math.random() * 256);
  }
  return arr;
});

// Restore original methods after all tests
afterAll(() => {
  global.crypto.subtle.digest = originalSubtleDigest;
  global.crypto.subtle.importKey = originalSubtleImportKey;
  global.crypto.subtle.encrypt = originalSubtleEncrypt;
  global.crypto.subtle.decrypt = originalSubtleDecrypt;
  global.crypto.subtle.generateKey = originalSubtleGenerateKey;
  global.crypto.subtle.exportKey = originalSubtleExportKey;
  global.crypto.randomUUID = originalRandomUUID;
  global.crypto.getRandomValues = originalGetRandomValues;
});

// Mock fetch for external API calls
global.fetch = vi.fn(async (url: string | URL, options?: RequestInit) => {
  const urlStr = url.toString();

  // ONVO Pay API mock
  if (urlStr.includes('api.onvopay.com')) {
    return {
      ok: true,
      json: async () => ({
        url: 'https://checkout.onvopay.com/test-session',
        id: 'session_test_123',
      }),
    } as Response;
  }

  // Turnstile verification mock
  if (urlStr.includes('challenges.cloudflare.com')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        score: 0.9,
        action: 'complaint_submit',
        challenge_ts: new Date().toISOString(),
        hostname: 'localhost',
      }),
    } as Response;
  }

  // Default mock
  return {
    ok: true,
    json: async () => ({}),
    text: async () => '',
    headers: new Headers(),
  } as Response;
});

// Test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-' + Math.random().toString(36).substr(2, 9),
  email: 'test@example.com',
  displayName: 'Test User',
  provider: 'google',
  usesPrivateRelayEmail: false,
  ...overrides,
});

export const createMockComplaint = (overrides = {}) => ({
  id: 'complaint-' + Math.random().toString(36).substr(2, 9),
  tracking_code: 'RW-2024-ABC123DEF456',
  category_code: 'maltrato_animal',
  category_name: 'Maltrato animal y crueldad',
  province_code: 'SJ',
  canton_code: '01',
  district_code: '01',
  status: 'received',
  owner_id: 'test-user-123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockSubscription = (overrides = {}) => ({
  id: 'sub-' + Math.random().toString(36).substr(2, 9),
  user_id: 'test-user-123',
  plan_id: 'plan-citizen-monthly',
  status: 'active',
  provider: 'onvo',
  access_until: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockPlan = (overrides = {}) => ({
  id: 'plan-citizen-monthly',
  code: 'citizen_monthly',
  name: 'Plan Ciudadano Mensual',
  description: 'Acceso mensual al contenido para miembros.',
  is_active: true,
  ...overrides,
});

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Suppress console.error in tests unless explicitly testing error handling
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.('test') || args[0]?.includes?.('Test')) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
});
afterAll(() => {
  console.error = originalConsoleError;
});