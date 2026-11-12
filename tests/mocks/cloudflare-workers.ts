// Mock for 'cloudflare:workers' - provides env access in test environment
export const env = {
  COMPLAINT_INTAKE_ENABLED: 'true',
  DATA_ENCRYPTION_KEY_VERSION: 'v1',
  DATA_ENCRYPTION_KEY_V1: 'dGVzdC1lbmNyeXB0aW9uLWtleS12MS0zMi1ieXRlcw==',
  AUDIT_HMAC_KEY: 'dGVzdC1hdWQtaG1hYy1rZXktMzItYnl0ZXM=',
  RATE_LIMIT_HMAC_KEY: 'dGVzdC1yYXRlLWxpbWl0LWhtYWMta2V5LTMyLWJ5dGVz',
  ONVO_SECRET_KEY: 'test-onvo-secret',
  ONVO_WEBHOOK_SECRET: 'test-webhook-secret',
  CRM_ORIGIN: 'http://localhost:3000',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'test-turnstile-site-key',
  TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
};