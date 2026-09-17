import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    auth: {
      getUser: async (token: string) => {
        if (token.startsWith('token-valido')) {
          // O sufixo vira o id do usuário: assim cada teste isola sua própria
          // janela de rate limit, que agora é por usuário e não por IP.
          return { data: { user: { id: token } }, error: null };
        }
        return { data: { user: null }, error: { message: 'token inválido' } };
      },
    },
  },
}));

const { POST } = await import('@/app/api/upload/route');

function requestComArquivo(
  file: File | null,
  token: string | null = 'token-valido-padrao',
  extraFields: Record<string, string> = {}
) {
  const formData = new FormData();
  if (file) formData.set('file', file);
  for (const [k, v] of Object.entries(extraFields)) formData.set(k, v);

  const headers: Record<string, string> = { 'x-forwarded-for': '10.0.0.1' };
  if (token) headers.Authorization = `Bearer ${token}`;

  return new Request('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
    headers,
  }) as any;
}

function arquivoTxt(texto: string) {
  return new File([texto], 'redacao.txt', { type: 'text/plain' });
}

describe('POST /api/upload — autenticação', () => {
  // Antes desta barreira, qualquer pessoa da internet podia martelar o
  // parser de arquivo sem sequer ter conta.
  it('recusa quem não manda token', async () => {
    const req = requestComArquivo(arquivoTxt('texto qualquer suficientemente longo'), null);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('recusa token inválido', async () => {
    const req = requestComArquivo(arquivoTxt('texto qualquer suficientemente longo'), 'token-falso');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('nem chega a ler o arquivo quando não há sessão', async () => {
    // Arquivo acima do teto: se a resposta fosse 413, significaria que a rota
    // processou o corpo antes de checar quem é — justamente o gasto que a
    // autenticação deve evitar.
    const grande = new Uint8Array(10 * 1024 * 1024 + 1);
    const req = requestComArquivo(new File([grande], 'redacao.txt', { type: 'text/plain' }), null);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/upload — validação e limites (sem I/O externo)', () => {
  it('retorna 400 quando nenhum arquivo é enviado', async () => {
    const res = await POST(requestComArquivo(null, 'token-valido-a'));
    expect(res.status).toBe(400);
  });

  it('retorna 400 para extensão não suportada', async () => {
    const file = new File(['conteúdo'], 'redacao.png', { type: 'image/png' });
    const res = await POST(requestComArquivo(file, 'token-valido-b'));
    expect(res.status).toBe(400);
  });

  it('retorna 413 para arquivo acima de 10MB', async () => {
    const grande = new Uint8Array(10 * 1024 * 1024 + 1);
    const file = new File([grande], 'redacao.txt', { type: 'text/plain' });
    const res = await POST(requestComArquivo(file, 'token-valido-c'));
    expect(res.status).toBe(413);
  });

  it('extrai texto de um .txt válido com sucesso', async () => {
    const texto = 'Esta é uma redação de teste com texto suficiente para passar na validação.';
    const res = await POST(requestComArquivo(arquivoTxt(texto), 'token-valido-d'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.text).toBe(texto);
  });

  it('retorna 422 para .txt com texto curto demais', async () => {
    const res = await POST(requestComArquivo(arquivoTxt('oi'), 'token-valido-e'));
    expect(res.status).toBe(422);
  });

  it('bloqueia com 429 após exceder o limite, contando por usuário', async () => {
    const token = 'token-valido-abusador';
    const texto = 'Texto válido o suficiente para não cair no erro de tamanho mínimo.';
    let ultimaResposta;
    for (let i = 0; i < 16; i++) {
      ultimaResposta = await POST(requestComArquivo(arquivoTxt(texto), token));
    }
    expect(ultimaResposta!.status).toBe(429);
  });

  it('o limite de um usuário não afeta outro, mesmo vindo do mesmo IP', async () => {
    const texto = 'Texto válido o suficiente para não cair no erro de tamanho mínimo.';
    // O usuário acima já estourou a janela vindo de 10.0.0.1; outro usuário
    // no mesmo IP precisa continuar conseguindo enviar.
    const res = await POST(requestComArquivo(arquivoTxt(texto), 'token-valido-inocente'));
    expect(res.status).toBe(200);
  });
});
