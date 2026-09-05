import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/upload/route';

function requestComArquivo(
  file: File | null,
  ip: string,
  extraFields: Record<string, string> = {}
) {
  const formData = new FormData();
  if (file) formData.set('file', file);
  for (const [k, v] of Object.entries(extraFields)) formData.set(k, v);

  return new Request('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
    headers: { 'x-forwarded-for': ip },
  }) as any;
}

describe('POST /api/upload — validação e limites (sem I/O externo)', () => {
  it('retorna 400 quando nenhum arquivo é enviado', async () => {
    const req = requestComArquivo(null, '10.0.0.1');
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retorna 400 para extensão não suportada', async () => {
    const file = new File(['conteúdo'], 'redacao.png', { type: 'image/png' });
    const req = requestComArquivo(file, '10.0.0.2');
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retorna 413 para arquivo acima de 10MB', async () => {
    const grande = new Uint8Array(10 * 1024 * 1024 + 1);
    const file = new File([grande], 'redacao.txt', { type: 'text/plain' });
    const req = requestComArquivo(file, '10.0.0.3');
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('extrai texto de um .txt válido com sucesso', async () => {
    const texto = 'Esta é uma redação de teste com texto suficiente para passar na validação.';
    const file = new File([texto], 'redacao.txt', { type: 'text/plain' });
    const req = requestComArquivo(file, '10.0.0.4');
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.text).toBe(texto);
  });

  it('retorna 422 para .txt com texto curto demais', async () => {
    const file = new File(['oi'], 'redacao.txt', { type: 'text/plain' });
    const req = requestComArquivo(file, '10.0.0.5');
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it('bloqueia com 429 após exceder o limite de uploads por IP', async () => {
    const ip = '10.0.0.6';
    const texto = 'Texto válido o suficiente para não cair no erro de tamanho mínimo.';
    let ultimaResposta;
    for (let i = 0; i < 16; i++) {
      const file = new File([texto], 'redacao.txt', { type: 'text/plain' });
      ultimaResposta = await POST(requestComArquivo(file, ip));
    }
    expect(ultimaResposta!.status).toBe(429);
  });
});
