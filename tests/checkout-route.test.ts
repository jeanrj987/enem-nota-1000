import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/checkout/route';

function req(body: Record<string, unknown>) {
  return new Request('http://localhost/api/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', origin: 'http://localhost:3000' },
  }) as any;
}

describe('POST /api/checkout — validação (sem chamar o Stripe de verdade)', () => {
  it('retorna 400 para plano inválido', async () => {
    const res = await POST(req({ planoId: 'inexistente', deviceId: 'd1' }));
    expect(res.status).toBe(400);
  });

  it('retorna 400 sem device_id', async () => {
    const res = await POST(req({ planoId: 'mensal' }));
    expect(res.status).toBe(400);
  });
});
