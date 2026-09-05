import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/checkout/verificar/route';

describe('POST /api/checkout/verificar — validação (sem chamar o Stripe de verdade)', () => {
  it('retorna 400 sem session_id', async () => {
    const req = new Request('http://localhost/api/checkout/verificar', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
