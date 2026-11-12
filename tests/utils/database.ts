import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Test database helper - provides isolated test database operations
 * Uses the real Supabase client with service role for integration tests
 */
export class TestDatabase {
  private admin: SupabaseClient;
  private createdRecords: Array<{ table: string; id: string }> = [];

  constructor() {
    this.admin = createSupabaseAdminClient();
  }

  get client() {
    return this.admin;
  }

  async cleanup() {
    // Clean up in reverse order to respect foreign keys
    for (const { table, id } of this.createdRecords.reverse()) {
      try {
        await this.admin.from(table).delete().eq('id', id);
      } catch {
        // Ignore cleanup errors
      }
    }
    this.createdRecords = [];
  }

  trackRecord(table: string, id: string) {
    this.createdRecords.push({ table, id });
  }

  async createTestUser(overrides = {}) {
    const userId = overrides.id || `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { data, error } = await this.admin
      .from('profiles')
      .insert({
        id: userId,
        email: overrides.email || `test-${userId}@example.com`,
        display_name: overrides.displayName || 'Test User',
        status: 'active',
        locale: 'es-CR',
        ...overrides,
      })
      .select()
      .single();

    if (error) throw error;
    this.trackRecord('profiles', data.id);
    return data;
  }

  async createTestSubscription(userId: string, overrides = {}) {
    const { data, error } = await this.admin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: overrides.planId || 'plan-citizen-monthly',
        provider: overrides.provider || 'onvo',
        status: overrides.status || 'active',
        access_until: overrides.accessUntil || new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
        current_period_start: overrides.currentPeriodStart || new Date().toISOString(),
        current_period_end: overrides.currentPeriodEnd || new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
        ...overrides,
      })
      .select()
      .single();

    if (error) throw error;
    this.trackRecord('subscriptions', data.id);
    return data;
  }

  async createTestComplaint(userId: string, overrides = {}) {
    const { data, error } = await this.admin
      .from('complaints')
      .insert({
        owner_id: userId,
        category_code: overrides.categoryCode || 'maltrato_animal',
        province_code: overrides.provinceCode || 'SJ',
        canton_code: overrides.cantonCode || '01',
        district_code: overrides.districtCode || '01',
        encrypted_payload: overrides.encryptedPayload || 'encrypted-test-payload',
        encryption_key_version: 'v1',
        status: overrides.status || 'received',
        truth_declaration_accepted: true,
        privacy_consent_accepted: true,
        urgent_channel_notice_accepted: true,
        ...overrides,
      })
      .select()
      .single();

    if (error) throw error;
    this.trackRecord('complaints', data.id);
    return data;
  }

  async createTestEvidence(complaintId: string, userId: string, overrides = {}) {
    const { data, error } = await this.admin
      .from('complaint_evidence')
      .insert({
        complaint_id: complaintId,
        uploaded_by_profile_id: userId,
        storage_object_path: overrides.storagePath || `${userId}/${complaintId}/test-file.jpg`,
        encrypted_original_filename: overrides.encryptedFilename || 'encrypted-filename',
        filename_encryption_key_version: 'v1',
        detected_mime_type: overrides.mimeType || 'image/jpeg',
        size_bytes: overrides.sizeBytes || 1024,
        sha256: overrides.sha256 || 'a'.repeat(64),
        scan_status: 'clean',
        ...overrides,
      })
      .select()
      .single();

    if (error) throw error;
    this.trackRecord('complaint_evidence', data.id);
    return data;
  }

  async createTestPlan(overrides = {}) {
    const { data, error } = await this.admin
      .from('plans')
      .insert({
        code: overrides.code || 'test_plan',
        name: overrides.name || 'Test Plan',
        description: overrides.description,
        is_active: overrides.isActive ?? true,
        ...overrides,
      })
      .select()
      .single();

    if (error) throw error;
    this.trackRecord('plans', data.id);
    return data;
  }

  async createTestPlanPrice(planId: string, overrides = {}) {
    const { data, error } = await this.admin
      .from('plan_prices')
      .insert({
        plan_id: planId,
        currency: overrides.currency || 'CRC',
        amount_minor: overrides.amountMinor || 350000,
        billing_interval: overrides.billingInterval || 'month',
        provider: overrides.provider || 'onvo',
        is_active: overrides.isActive ?? true,
        ...overrides,
      })
      .select()
      .single();

    if (error) throw error;
    this.trackRecord('plan_prices', data.id);
    return data;
  }
}

/**
 * Create a fresh test database instance for each test
 */
export function createTestDb() {
  return new TestDatabase();
}

/**
 * Helper to create authenticated request context for testing
 */
export function createMockRequest(overrides = {}) {
  const userId = overrides.userId || 'test-user-123';
  return {
    headers: new Headers({
      'content-type': 'application/json',
      'cf-ray': 'test-ray-id',
      ...overrides.headers,
    }),
    method: overrides.method || 'POST',
    url: overrides.url || 'http://localhost:3000/api/test',
    json: async () => overrides.body || {},
    formData: async () => {
      const fd = new FormData();
      if (overrides.formData) {
        Object.entries(overrides.formData).forEach(([key, value]) => {
          fd.append(key, value as string);
        });
      }
      return fd;
    },
    clone: function() {
      return createMockRequest(overrides);
    },
  } as unknown as Request;
}

/**
 * Helper to wait for async operations (webhook processing, etc.)
 */
export async function waitFor(condition: () => Promise<boolean>, timeout = 5000, interval = 100) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return true;
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Generate valid test file for upload testing
 */
export function createTestFile(name = 'test.jpg', type = 'image/jpeg', size = 1024): File {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) bytes[i] = Math.floor(Math.random() * 256);
  return new File([bytes], name, { type });
}

/**
 * Generate valid multipart form data for complaint testing
 */
export function createComplaintFormData(overrides = {}) {
  const fd = new FormData();
  fd.append('province', overrides.province || 'SJ');
  fd.append('canton', overrides.canton || '01');
  fd.append('district', overrides.district || '01');
  fd.append('locality', overrides.locality || 'Barrio Test');
  fd.append('category', overrides.category || 'maltrato_animal');
  fd.append('title', overrides.title || 'Test Denuncia Título');
  fd.append('description', overrides.description || 'Descripción detallada de la denuncia de prueba con más de 40 caracteres.');
  fd.append('occurredOn', overrides.occurredOn || '');
  fd.append('approximateLocation', overrides.approximateLocation || 'Cerca de la escuela');
  fd.append('truth', 'on');
  fd.append('privacy', 'on');
  fd.append('urgentNotice', 'on');
  fd.append('cf-turnstile-response', overrides.turnstileToken || 'test-turnstile-token');

  if (overrides.files) {
    overrides.files.forEach(file => fd.append('evidence', file));
  }

  return fd;
}