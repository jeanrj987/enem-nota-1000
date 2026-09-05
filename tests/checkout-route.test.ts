import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    auth: {
      getUser: async (token: string) => {
        if (token === 'token-valido') {
          return { data: { user: { id: 'user-1' } }, error: null };
        }
        return { data: { user: null }, error: { message: 'token inválido' } };
      },
    },
  },
}));

const { POST } = await import('@/app/api/checkout/route');

function req(body: Record<string, unknown>, token?: string) {
  return new Request('http://localhost/api/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      origin: 'http://localhost:3000',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }) as any;
}

describe('POST /api/checkout — validação (sem chamar o Stripe de verdade)', () => {
  it('retorna 401 sem token de autenticação', async () => {
    const res = await POST(req({ planoId: 'mensal' }));
    expect(res.status).toBe(401);
  });

  it('retorna 401 com token inválido', async () => {
    const res = await POST(req({ planoId: 'mensal' }, 'token-invalido'));
    expect(res.status).toBe(401);
  });

  it('retorna 400 para plano inválido mesmo autenticado', async () => {
    const res = await POST(req({ planoId: 'inexistente' }, 'token-valido'));
    expect(res.status).toBe(400);
  });
});
