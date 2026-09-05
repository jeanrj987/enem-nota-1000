import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/stripe/webhook/route';

describe('POST /api/stripe/webhook — verificação de assinatura', () => {
  it('rejeita payload sem header stripe-signature', async () => {
    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejeita assinatura inválida/forjada', async () => {
    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed' }),
      headers: { 'stripe-signature': 't=1,v1=assinatura_forjada_invalida' },
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
