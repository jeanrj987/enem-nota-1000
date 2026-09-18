import { describe, it, expect, vi } from 'vitest';
import type { NextRequest } from 'next/server';

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

const { POST } = await import('@/app/api/corrigir/route');

function requestDeCorrecao(body: Record<string, unknown>, ip: string, token?: string) {
  return new Request('http://localhost/api/corrigir', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }) as unknown as NextRequest;
}

describe('POST /api/corrigir — validação, autenticação e limites (sem chamar LLM)', () => {
  it('retorna 401 sem token de autenticação', async () => {
    const res = await POST(requestDeCorrecao({ texto: 'Texto de teste com tamanho razoável.' }, '20.0.1.1'));
    expect(res.status).toBe(401);
  });

  it('retorna 401 com token inválido', async () => {
    const res = await POST(requestDeCorrecao({ texto: 'Texto de teste' }, '20.0.1.2', 'token-invalido'));
    expect(res.status).toBe(401);
  });

  it('retorna 400 para texto menor que 20 caracteres (autenticado)', async () => {
    const res = await POST(requestDeCorrecao({ texto: 'muito curto' }, '20.0.0.1', 'token-valido'));
    expect(res.status).toBe(400);
  });

  it('retorna 413 para texto acima do teto de 8000 caracteres (autenticado)', async () => {
    const res = await POST(requestDeCorrecao({ texto: 'A'.repeat(8001) }, '20.0.0.2', 'token-valido'));
    expect(res.status).toBe(413);
  });

  it('bloqueia com 429 após exceder o limite de correções por IP (antes mesmo de checar login)', async () => {
    const ip = '20.0.0.3';
    let ultimaResposta;
    for (let i = 0; i < 6; i++) {
      // sem token: se o rate limit não disparasse primeiro, cairia em 401 em vez de 429.
      ultimaResposta = await POST(requestDeCorrecao({ texto: 'curto' }, ip));
    }
    expect(ultimaResposta!.status).toBe(429);
  });
});
