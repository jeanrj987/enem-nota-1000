import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Correcao } from '@/types';

const estado = {
  assinante: false,
  chamadas: [] as string[],
  correcaoGravada: null as Correcao | null,
};

function correcaoFalsa(nota: number, unica: boolean, motivo?: 'falha' | 'acesso-gratuito'): Correcao {
  return {
    id: 'cor_1',
    redacao_id: 'red_1',
    anulada: false,
    motivo_anulacao: null,
    nota_geral: nota,
    competencias: [],
    erros: [],
    versao_reescrita: '',
    feedback_pedagogico: '',
    pontos_positivos: [],
    proximos_passos: [],
    created_at: new Date().toISOString(),
    ...(unica
      ? {
          reconciliacao: {
            notasIndividuais: [nota],
            divergencia: 0,
            terceiraCorrecaoAcionada: false,
            correcaoUnica: true,
            motivoCorrecaoUnica: motivo,
          },
        }
      : {}),
  } as Correcao;
}

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    auth: {
      getUser: async (token: string) =>
        token === 'token-valido'
          ? { data: { user: { id: 'user-1' } }, error: null }
          : { data: { user: null }, error: { message: 'inválido' } },
    },
  },
}));

vi.mock('@/lib/assinatura-servidor', () => ({
  assinaturaAtivaDoUsuario: async () => estado.assinante,
}));

vi.mock('@/lib/openai', () => ({
  corrigirRedacaoComDuplaCorrecao: async () => {
    estado.chamadas.push('dupla');
    return correcaoFalsa(800, false);
  },
  corrigirRedacaoSimples: async () => {
    estado.chamadas.push('simples');
    return correcaoFalsa(760, true, 'acesso-gratuito');
  },
}));

vi.mock('@/lib/salvar-correcao', () => ({
  salvarCorrecao: async (p: { correcao: Correcao }) => {
    estado.correcaoGravada = p.correcao;
    return true;
  },
}));

const { POST } = await import('@/app/api/corrigir/route');

let contadorIp = 0;
function requisicao(texto: string) {
  contadorIp++;
  return new Request('http://localhost/api/corrigir', {
    method: 'POST',
    body: JSON.stringify({ texto, tema: 'Tema de teste' }),
    headers: {
      'Content-Type': 'application/json',
      // Um IP distinto por chamada: o rate limit é por IP e a janela é
      // compartilhada entre os testes deste arquivo.
      'x-forwarded-for': `30.0.${Math.floor(contadorIp / 250)}.${contadorIp % 250}`,
      authorization: 'Bearer token-valido',
    },
  }) as any;
}

const TEXTO = 'Uma redação de teste com tamanho suficiente para passar na validação de entrada.';

beforeEach(() => {
  estado.chamadas = [];
  estado.correcaoGravada = null;
});

describe('/api/corrigir — quantas correções rodam depende de quem paga', () => {
  it('sem assinatura roda UMA correção, não a dupla', async () => {
    estado.assinante = false;
    await POST(requisicao(TEXTO));
    expect(estado.chamadas).toEqual(['simples']);
  });

  it('com assinatura roda a dupla correção', async () => {
    estado.assinante = true;
    await POST(requisicao(TEXTO));
    expect(estado.chamadas).toEqual(['dupla']);
  });

  it('sem assinatura a resposta traz só o chamariz, nunca a correção', async () => {
    estado.assinante = false;
    const res = await POST(requisicao(TEXTO));
    const body = await res.json();
    expect(body.correcao).toBeUndefined();
    expect(body.chamariz).toEqual({ total_erros: 0, anulada: false });
    expect(body.redacaoId).toBeTruthy();
  });

  it('com assinatura a resposta traz a correção completa', async () => {
    estado.assinante = true;
    const res = await POST(requisicao(TEXTO));
    const body = await res.json();
    expect(body.correcao?.nota_geral).toBe(800);
  });

  // A correção do acesso gratuito precisa ficar marcada, senão não há como
  // saber depois que ela merece uma segunda passagem quando a pessoa assinar.
  it('a correção gratuita é gravada marcada como única por acesso gratuito', async () => {
    estado.assinante = false;
    await POST(requisicao(TEXTO));
    expect(estado.correcaoGravada?.reconciliacao?.correcaoUnica).toBe(true);
    expect(estado.correcaoGravada?.reconciliacao?.motivoCorrecaoUnica).toBe('acesso-gratuito');
  });

  it('a correção do assinante é gravada sem marca de correção única', async () => {
    estado.assinante = true;
    await POST(requisicao(TEXTO));
    expect(estado.correcaoGravada?.reconciliacao?.correcaoUnica).toBeFalsy();
  });
});
