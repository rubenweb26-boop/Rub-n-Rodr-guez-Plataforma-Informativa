import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/complaints/route';

// Mocks específicos para simular las capas de seguridad
vi.mock('@/lib/auth/user', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/security/origin', () => ({
  isSameOriginMutation: vi.fn(() => true),
  hasContentType: vi.fn(() => true),
  readRequestWithLimit: vi.fn(async () => new Uint8Array([1, 2, 3])),
  RequestBodyTooLargeError: class RequestBodyTooLargeError extends Error {},
}));

vi.mock('@/lib/security/turnstile', () => ({
  isTurnstileConfigured: vi.fn(() => true),
  verifyTurnstile: vi.fn(async () => true),
}));

vi.mock('@/lib/security/audit', () => ({
  recordAuditEvent: vi.fn(async () => {}),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

describe('Simulación de Ataque Masivo y Pruebas de Resiliencia (QA Stress & Abuse)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Escenario 1: Ataque masivo anónimo sin autenticación (Rechazo inmediato 401)', async () => {
    const { getCurrentUser } = await import('@/lib/auth/user');
    // El atacante no tiene sesión
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    // Simulamos una ráfaga masiva de 1,000 peticiones concurrentes
    const attackBatch = Array.from({ length: 1000 }, (_, i) => {
      const request = new Request('http://localhost:5173/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=test',
          'Origin': 'http://localhost:5173',
          'cf-connecting-ip': `192.168.1.${(i % 250) + 1}`,
        },
      });
      return POST(request);
    });

    const responses = await Promise.all(attackBatch);

    // Ninguna de las 1,000 peticiones pasa: el 100% es bloqueado antes de tocar la DB
    expect(responses.every((res) => res.status === 401)).toBe(true);

    const firstBody = await responses[0].json();
    expect(firstBody.error).toBe('Debes iniciar sesión.');
  });

  it('Escenario 2: Usuario autenticado disparando ráfaga masiva (Rate Limiter 429 activado)', async () => {
    const { getCurrentUser } = await import('@/lib/auth/user');
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    const { recordAuditEvent } = await import('@/lib/security/audit');

    // Atacante con sesión iniciada
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'attacker-uuid-1234',
      email: 'attacker@evil.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any);

    // Contador del Rate Limiter en memoria: límite = 3 por hora
    let requestCount = 0;
    vi.mocked(checkRateLimit).mockImplementation(async () => {
      requestCount++;
      return {
        configured: true,
        allowed: requestCount <= 3, // Solo las 3 primeras pasan
      };
    });

    // Disparamos 100 peticiones seguidas
    const burstRequests = Array.from({ length: 100 }, () => {
      const request = new Request('http://localhost:5173/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=test',
          'Origin': 'http://localhost:5173',
        },
      });
      return POST(request);
    });

    const responses = await Promise.all(burstRequests);

    // Verificamos que se ejecutaron las 100 peticiones
    expect(responses.length).toBe(100);

    // De las 100 peticiones, 97 fueron bloqueadas con HTTP 429 Too Many Requests
    const blockedResponses = responses.filter((res) => res.status === 429);
    expect(blockedResponses.length).toBe(97);

    // El cuerpo del error confirma que el Rate Limiter lo frenó
    const sampleBlocked = await blockedResponses[0].json();
    expect(sampleBlocked.error).toBe('Has realizado demasiados intentos. Intenta más tarde.');

    // Se registró evento de auditoría de denegación para monitoreo de seguridad
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'attacker-uuid-1234',
        action: 'complaint.create',
        outcome: 'denied',
        metadata: { reason: 'rate_limited' },
      }),
    );
  });

  it('Escenario 3: Ataque externo CSRF / Cross-Origin (Rechazo 403 Forbidden)', async () => {
    const { isSameOriginMutation } = await import('@/lib/security/origin');
    // El atacante viene de un origen malicioso
    vi.mocked(isSameOriginMutation).mockReturnValue(false);

    const request = new Request('http://localhost:5173/api/complaints', {
      method: 'POST',
      headers: {
        'Origin': 'https://sitio-malicioso.com',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Solicitud no autorizada.');
  });
});

