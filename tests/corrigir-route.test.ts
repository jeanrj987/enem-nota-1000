import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/corrigir/route';

function requestDeCorrecao(body: Record<string, unknown>, ip: string) {
  return new Request('http://localhost/api/corrigir', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
  }) as any;
}

describe('POST /api/corrigir — validação e limites (sem chamar LLM)', () => {
  it('retorna 400 para texto menor que 20 caracteres', async () => {
    const res = await POST(requestDeCorrecao({ texto: 'muito curto' }, '20.0.0.1'));
    expect(res.status).toBe(400);
  });

  it('retorna 413 para texto acima do teto de 8000 caracteres', async () => {
    const res = await POST(requestDeCorrecao({ texto: 'A'.repeat(8001) }, '20.0.0.2'));
    expect(res.status).toBe(413);
  });

  it('bloqueia com 429 após exceder o limite de correções por IP', async () => {
    const ip = '20.0.0.3';
    let ultimaResposta;
    for (let i = 0; i < 6; i++) {
      // texto curto o suficiente para falhar rápido em 400, sem chamar o LLM,
      // mas o rate limit é checado antes da validação de tamanho.
      ultimaResposta = await POST(requestDeCorrecao({ texto: 'curto' }, ip));
    }
    expect(ultimaResposta!.status).toBe(429);
  });
});
