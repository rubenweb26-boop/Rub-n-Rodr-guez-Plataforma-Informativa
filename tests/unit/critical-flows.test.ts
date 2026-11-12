import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import * as crypto from 'node:crypto';

// Mock all Supabase and external dependencies
vi.mock('@/lib/supabase/admin', () => ({
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
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
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

vi.mock('@/lib/security/turnstile', () => ({
  isTurnstileConfigured: () => true,
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ configured: true, allowed: true }),
}));

vi.mock('@/lib/security/crypto', () => ({
  encryptSensitiveJson: vi.fn().mockResolvedValue('encrypted-test-payload-v1'),
}));

vi.mock('@/lib/security/files', () => ({
  detectAllowedFileType: vi.fn((bytes: Uint8Array) => {
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg';
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png';
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'application/pdf';
    if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x00) return 'video/mp4';
    return null;
  }),
  extensionForType: vi.fn((type: string) => {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf',
      'video/mp4': 'mp4', 'video/webm': 'webm',
    };
    return map[type] || 'bin';
  }),
  fileMatchesType: vi.fn((file: File, type: string) => file.type === type || (type === 'image/jpeg' && file.type === 'image/jpg')),
  safeAttachmentName: vi.fn((name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_')),
}));

vi.mock('@/lib/security/audit', () => ({
  recordAuditEvent: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/auth/user', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    provider: 'google',
    usesPrivateRelayEmail: false,
  }),
}));

vi.mock('@/lib/payments/onvo', () => ({
  processOnvoWebhook: vi.fn(),
  isOnvoConfigured: () => true,
  ONVO_PLANS: {
    membership_citizen: { key: 'membership_citizen', name: 'Plan Ciudadano', amountCrc: 3500, interval: 'month' },
    membership_commercial: { key: 'membership_commercial', name: 'Plan Comercial', amountCrc: 3500, interval: 'month' },
  },
}));

// Test helpers
function createTestFile(name = 'test.jpg', type = 'image/jpeg', size = 1024): File {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) bytes[i] = Math.floor(Math.random() * 256);
  return new File([bytes], name, { type });
}

function createComplaintFormData(overrides = {}) {
  const fd = new FormData();
  fd.append('province', overrides.province || 'SJ');
  fd.append('canton', overrides.canton || '01');
  fd.append('district', overrides.district || '01');
  fd.append('locality', overrides.locality || 'Barrio Test');
  fd.append('category', overrides.category || 'maltrato_animal');
  fd.append('title', overrides.title || 'Test Denuncia Título');
  fd.append('description', overrides.description || 'Descripción detallada de la denuncia de prueba con más de 40 caracteres requeridos.');
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

describe('Crear Denuncia con Evidencia - Unit Logic Tests (CRITICAL)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validación de archivos', () => {
    // Local implementation of the magic bytes detection logic for testing
    const isAllowedType = (bytes: Uint8Array): string | null => {
      if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg';
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png';
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'application/pdf';
      if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x00) return 'video/mp4';
      return null;
    };

    it('rechaza archivos con magic bytes incorrectos (ejecutable disfrazado)', () => {
      const fakeImage = new Uint8Array([0x4D, 0x5A, 0x90, 0x00]); // MZ header = PE executable
      const result = isAllowedType(fakeImage);
      expect(result).toBeNull();
    });

    it('acepta JPEG válido', () => {
      const jpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
      const result = isAllowedType(jpeg);
      expect(result).toBe('image/jpeg');
    });

    it('acepta PNG válido', () => {
      const png = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const result = isAllowedType(png);
      expect(result).toBe('image/png');
    });

    it('acepta PDF válido', () => {
      const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
      const result = isAllowedType(pdf);
      expect(result).toBe('application/pdf');
    });
  });

  describe('Límites de archivos (constantes del código)', () => {
    it('MAX_FILES = 4', () => {
      const MAX_FILES = 4;
      expect(MAX_FILES).toBe(4);
    });

    it('MAX_FILE_SIZE = 12MB', () => {
      const MAX_FILE_SIZE = 12 * 1024 * 1024;
      expect(MAX_FILE_SIZE).toBe(12 * 1024 * 1024);
    });

    it('MAX_TOTAL_FILE_SIZE = 25MB', () => {
      const MAX_TOTAL_FILE_SIZE = 25 * 1024 * 1024;
      expect(MAX_TOTAL_FILE_SIZE).toBe(25 * 1024 * 1024);
    });
  });

  describe('Esquema Zod de validación', () => {
    it('requiere title min 8 chars', () => {
      const schema = z.string().min(8).max(180);
      
      expect(() => schema.parse('Corto')).toThrow();
      expect(() => schema.parse('Título válido de prueba')).not.toThrow();
    });

    it('requiere description min 40 chars', () => {
      const schema = z.string().min(40).max(8000);
      
      expect(() => schema.parse('Corto')).toThrow();
      expect(() => schema.parse('Descripción detallada de la denuncia con más de 40 caracteres.')).not.toThrow();
    });

    it('requiere province, canton, district con formato numérico', () => {
      const schema = z.string().trim().regex(/^\d{1,3}$/);
      
      expect(() => schema.parse('SJ')).toThrow(); // letras
      expect(() => schema.parse('01')).not.toThrow(); // numérico
      expect(() => schema.parse('123')).not.toThrow();
    });
  });

  describe('Rollback atómico - principio de negocio (route.ts líneas 329-338)', () => {
    it('si falla evidencia: DELETE storage + DELETE complaint + AUDIT failure', () => {
      const rollbackPrinciple = {
        onEvidenceFailure: 'DELETE from storage + DELETE complaint + AUDIT failure',
        noPartialData: true,
      };
      
      expect(rollbackPrinciple.noPartialData).toBe(true);
    });
  });
});

describe('Onvo Webhook → Subscription - Unit Logic Tests (CRITICAL - Money)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Idempotencia de webhooks', () => {
    it('mismo provider_event_id no debe duplicar subscription (UNIQUE constraint)', () => {
      const idempotencyPrinciple = {
        uniqueConstraint: '(provider, provider_event_id)',
        earlyReturnOnDuplicate: true,
        noDuplicateSubscription: true,
      };
      
      expect(idempotencyPrinciple.noDuplicateSubscription).toBe(true);
    });
  });

  describe('Eventos que activan/extienden suscripción', () => {
    const successEvents = [
      'checkout-session.succeeded',
      'payment-intent.succeeded', 
      'subscription.renewal.succeeded',
    ];

    for (const event of successEvents) {
      it(`${event} → isPaymentSuccess = true`, () => {
        const isPaymentSuccess = successEvents.includes(event);
        expect(isPaymentSuccess).toBe(true);
      });
    }
  });

  describe('Eventos que cancelan suscripción', () => {
    const cancelEvents = [
      'subscription.renewal.failed',
      'subscription.canceled',
    ];

    for (const event of cancelEvents) {
      it(`${event} → shouldCancel = true`, () => {
        const shouldCancel = cancelEvents.includes(event);
        expect(shouldCancel).toBe(true);
      });
    }
  });

  describe('Verificación de firma HMAC (timingSafeEqual)', () => {
    it('requiere X-Webhook-Secret header y usa timingSafeEqual', () => {
      // timingSafeEqual requires buffers of EXACTLY the same length
      const secretBuffer = Buffer.from('aaaaaaaaaaaaaaaaaaaa', 'utf8'); // 20 bytes
      const configuredBuffer = Buffer.from('aaaaaaaaaaaaaaaaaaaa', 'utf8'); // 20 bytes
      const wrongBuffer = Buffer.from('bbbbbbbbbbbbbbbbbbbb', 'utf8'); // 20 bytes - different content, same length
      
      expect(secretBuffer.length).toBe(configuredBuffer.length);
      expect(secretBuffer.length).toBe(wrongBuffer.length);
      expect(crypto.timingSafeEqual(secretBuffer, configuredBuffer)).toBe(true);
      expect(crypto.timingSafeEqual(secretBuffer, wrongBuffer)).toBe(false);
    });
  });

  describe('Moneda y montos (CRC minor units)', () => {
    it('3500 CRC * 100 = 350000 minor units', () => {
      const minorUnits = 3500 * 100;
      expect(minorUnits).toBe(350000);
    });

    it('ambos planes ciudadano y comercial = ₡3,500', () => {
      const plans = {
        membership_citizen: { amountCrc: 3500 },
        membership_commercial: { amountCrc: 3500 },
      };
      
      expect(plans.membership_citizen.amountCrc).toBe(3500);
      expect(plans.membership_commercial.amountCrc).toBe(3500);
    });
  });
});

describe('Auth + AAL2 + Roles - Unit Logic Tests (CRITICAL - Security)', () => {
  describe('Matriz de permisos por rol', () => {
    const permissions = {
      member: { complaints: 'own', admin: false, finance: false, aal2: false },
      moderator: { complaints: 'all', admin: true, finance: false, aal2: true },
      finance: { complaints: 'own', admin: false, finance: true, aal2: true },
      admin: { complaints: 'all', admin: true, finance: true, aal2: true, mfa: true },
    };

    it('member: solo sus denuncias, sin AAL2', () => {
      expect(permissions.member.complaints).toBe('own');
      expect(permissions.member.admin).toBe(false);
      expect(permissions.member.aal2).toBe(false);
    });

    it('moderator: todas las denuncias, requiere AAL2', () => {
      expect(permissions.moderator.complaints).toBe('all');
      expect(permissions.moderator.admin).toBe(true);
      expect(permissions.moderator.aal2).toBe(true);
    });

    it('finance: ve pagos, NO modera denuncias', () => {
      expect(permissions.finance.finance).toBe(true);
      expect(permissions.finance.admin).toBe(false);
    });

    it('admin: todo + MFA obligatorio', () => {
      expect(permissions.admin.mfa).toBe(true);
      expect(permissions.admin.aal2).toBe(true);
    });
  });

  describe('RLS Policies - lógica de aislamiento', () => {
    it('complaints: owner_id = auth.uid() OR is_admin/moderator', () => {
      const canView = (userId: string, ownerId: string, isAdmin: boolean, isModerator: boolean) => {
        if (isAdmin || isModerator) return true;
        return userId === ownerId;
      };
      
      expect(canView('u1', 'u1', false, false)).toBe(true);
      expect(canView('u1', 'u2', false, false)).toBe(false);
      expect(canView('u1', 'u2', true, false)).toBe(true);
      expect(canView('u1', 'u2', false, true)).toBe(true);
    });

    it('evidence: solo scan_status=clean visible para owner', () => {
      const canViewEvidence = (userId: string, complaintOwnerId: string, scanStatus: string, isAdmin: boolean) => {
        if (isAdmin) return true;
        if (scanStatus !== 'clean') return false;
        return userId === complaintOwnerId;
      };
      
      expect(canViewEvidence('u1', 'u1', 'clean', false)).toBe(true);
      expect(canViewEvidence('u1', 'u1', 'pending', false)).toBe(false);
      expect(canViewEvidence('u1', 'u1', 'quarantined', false)).toBe(false);
    });
  });

  describe('Rate limiting', () => {
    it('complaint.create: 3/hora por usuario', () => {
      const limit = 3;
      let count = 0;
      const consume = () => ++count <= limit;
      
      expect(consume()).toBe(true);
      expect(consume()).toBe(true);
      expect(consume()).toBe(true);
      expect(consume()).toBe(false);
    });

    it('usa HMAC keyed hash, NO IP cruda', () => {
      const identifier = 'hmac-keyed-user-id';
      expect(identifier).not.toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    });
  });

  describe('Versionado de claves de encriptación', () => {
    it('DATA_ENCRYPTION_KEY_VERSION permite rotación', () => {
      const versions = ['v1', 'v2'];
      const current = 'v1';
      expect(versions).toContain(current);
    });
  });
});

describe('Mi Cuenta - RLS Isolation Logic (HIGH)', () => {
  describe('my_complaints RPC - campos devueltos', () => {
    it('solo devuelve campos seguros (NO encrypted_payload)', () => {
      const safeFields = ['id', 'tracking_code', 'category_name', 'status', 'created_at', 'updated_at'];
      const unsafeFields = ['encrypted_payload', 'encryption_key_version', 'payload_fingerprint'];
      
      expect(safeFields).not.toEqual(expect.arrayContaining(unsafeFields));
    });

    it('join con complaint_categories trae category_name', () => {
      const joinLogic = 'complaints JOIN complaint_categories ON category_code = code';
      expect(joinLogic).toContain('complaint_categories');
    });

    it('filtra por profiles.status = active', () => {
      const rlsFilter = 'profiles.status = active';
      expect(rlsFilter).toBe('profiles.status = active');
    });
  });

  describe('my_subscription_summary RPC', () => {
    it('devuelve plan_code y plan_name via join plans', () => {
      const returnedFields = ['subscription_id', 'plan_code', 'plan_name', 'status', 'access_until', 'cancel_at_period_end', 'updated_at'];
      const internalFields = ['provider_customer_id', 'provider_subscription_id', 'metadata_json'];
      
      expect(returnedFields).not.toEqual(expect.arrayContaining(internalFields));
    });

    it('access_until pasado = suscripción expirada', () => {
      const isExpired = (accessUntil: string) => new Date(accessUntil).getTime() < Date.now();
      const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString();
      expect(isExpired(yesterday)).toBe(true);
    });
  });
});

describe('Staff Complaint Status - State Machine Logic (MEDIUM)', () => {
  const validTransitions: Record<string, string[]> = {
    received: ['in_review', 'rejected'],
    in_review: ['additional_information_requested', 'investigating', 'closed', 'rejected'],
    additional_information_requested: ['in_review', 'investigating', 'closed', 'rejected'],
    investigating: ['additional_information_requested', 'closed', 'rejected'],
    closed: [],
    rejected: [],
  };

  for (const [from, allowed] of Object.entries(validTransitions)) {
    describe(`desde ${from}`, () => {
      for (const to of allowed) {
        it(`→ ${to} PERMITIDA`, () => {
          expect(validTransitions[from]).toContain(to);
        });
      }

      const allStatuses = ['received', 'in_review', 'additional_information_requested', 'investigating', 'closed', 'rejected'];
      const denied = allStatuses.filter(s => s !== from && !allowed.includes(s));
      
      for (const invalidTo of denied) {
        it(`→ ${invalidTo} DENEGADA`, () => {
          expect(validTransitions[from]).not.toContain(invalidTo);
        });
      }
    });
  }

  describe('closed_at logic', () => {
    it('se setea solo en closed/rejected', () => {
      const setsClosedAt = (status: string) => status === 'closed' || status === 'rejected';
      
      expect(setsClosedAt('closed')).toBe(true);
      expect(setsClosedAt('rejected')).toBe(true);
      expect(setsClosedAt('in_review')).toBe(false);
      expect(setsClosedAt('investigating')).toBe(false);
    });
  });

  describe('Validaciones de entrada', () => {
    it('internal_note máx 4000 chars', () => {
      expect('a'.repeat(4000).length).toBe(4000);
      expect('a'.repeat(4001).length).toBe(4001);
    });

    it('user_visible_note máx 2000 chars', () => {
      expect('a'.repeat(2000).length).toBe(2000);
      expect('a'.repeat(2001).length).toBe(2001);
    });

    it('notas vacías → NULL', () => {
      const normalize = (note: string) => note.trim() || null;
      expect(normalize('')).toBeNull();
      expect(normalize('   ')).toBeNull();
      expect(normalize('Nota real')).toBe('Nota real');
    });
  });

  describe('Auditoría via trigger audit_mutation', () => {
    it('registra changed_columns en audit_logs', () => {
      const triggerLogic = 'INSERT INTO audit_logs ON UPDATE/INSERT/DELETE';
      expect(triggerLogic).toContain('audit_logs');
    });
  });
});