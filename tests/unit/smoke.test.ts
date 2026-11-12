import { describe, it, expect } from 'vitest';

describe('Prueba de humo unitaria (Smoke Test)', () => {
  it('confirma que el entorno de pruebas ejecuta TypeScript correctamente', () => {
    const suma = (a: number, b: number): number => a + b;
    expect(suma(2, 3)).toBe(5);
  });
});

