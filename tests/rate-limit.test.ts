import { describe, it, expect } from 'vitest';
import { checarRateLimit, obterIpCliente } from '@/lib/rate-limit';

describe('checarRateLimit', () => {
  it('permite requisições até o limite', () => {
    const id = 'teste-' + Math.random();
    for (let i = 0; i < 3; i++) {
      const r = checarRateLimit(id, 3, 60_000);
      expect(r.permitido).toBe(true);
    }
  });

  it('bloqueia a partir da requisição além do limite', () => {
    const id = 'teste-' + Math.random();
    checarRateLimit(id, 2, 60_000);
    checarRateLimit(id, 2, 60_000);
    const bloqueada = checarRateLimit(id, 2, 60_000);
    expect(bloqueada.permitido).toBe(false);
    expect(bloqueada.restantes).toBe(0);
  });

  it('reseta a contagem após a janela expirar', () => {
    const id = 'teste-' + Math.random();
    checarRateLimit(id, 1, 10);
    const bloqueada = checarRateLimit(id, 1, 10);
    expect(bloqueada.permitido).toBe(false);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const liberada = checarRateLimit(id, 1, 10);
        expect(liberada.permitido).toBe(true);
        resolve();
      }, 20);
    });
  });

  it('mantém identificadores diferentes isolados entre si', () => {
    const a = 'a-' + Math.random();
    const b = 'b-' + Math.random();
    checarRateLimit(a, 1, 60_000);
    const aBloqueada = checarRateLimit(a, 1, 60_000);
    const bPermitida = checarRateLimit(b, 1, 60_000);
    expect(aBloqueada.permitido).toBe(false);
    expect(bPermitida.permitido).toBe(true);
  });
});

describe('obterIpCliente', () => {
  it('usa o primeiro IP de x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(obterIpCliente(req)).toBe('1.2.3.4');
  });

  it('cai para x-real-ip quando x-forwarded-for está ausente', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '9.9.9.9' },
    });
    expect(obterIpCliente(req)).toBe('9.9.9.9');
  });

  it('retorna "desconhecido" sem nenhum header de IP', () => {
    const req = new Request('http://localhost');
    expect(obterIpCliente(req)).toBe('desconhecido');
  });
});
