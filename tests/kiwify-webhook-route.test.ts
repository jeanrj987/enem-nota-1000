import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const TOKEN = 'token-de-teste-kiwify';
process.env.KIWIFY_WEBHOOK_TOKEN = TOKEN;

interface CompraOrfaRegistrada {
  orderId: string;
  email: string;
  planoId: string | null;
}

const estado = {
  userIdPorEmail: null as string | null,
  ativou: null as { sessionId: string; userId: string; planoId: string } | null,
  revogou: null as { userId: string; motivo: string } | null,
  orfaRegistrada: null as CompraOrfaRegistrada | null,
  orfasRegistradas: [] as CompraOrfaRegistrada[],
};

vi.mock('@/lib/perfil', () => ({
  buscarUserIdPorEmail: async (_email: string) => estado.userIdPorEmail,
}));

vi.mock('@/lib/compras-orfas', () => ({
  registrarCompraOrfa: async (params: CompraOrfaRegistrada) => {
    estado.orfaRegistrada = params;
    estado.orfasRegistradas.push(params);
    return { sucesso: true };
  },
}));

vi.mock('@/lib/ativar-assinatura', () => ({
  ativarAssinatura: async (params: { sessionId: string; userId: string; planoId: string }) => {
    estado.ativou = params;
    return { sucesso: true };
  },
  revogarAssinatura: async (userId: string, motivo: string) => {
    estado.revogou = { userId, motivo };
    return { sucesso: true };
  },
}));

const { POST } = await import('@/app/api/kiwify/webhook/route');

function assinar(corpo: string): string {
  return crypto.createHmac('sha1', TOKEN).update(corpo).digest('hex');
}

function requisicao(corpoObjeto: unknown, opcoes: { semAssinatura?: boolean; assinaturaForjada?: boolean } = {}) {
  const corpo = JSON.stringify(corpoObjeto);
  const assinatura = opcoes.semAssinatura
    ? null
    : opcoes.assinaturaForjada
      ? 'assinatura-forjada-completamente-invalida'
      : assinar(corpo);

  const url = new URL('http://localhost/api/kiwify/webhook');
  if (assinatura) url.searchParams.set('signature', assinatura);

  return new Request(url.toString(), {
    method: 'POST',
    body: corpo,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as NextRequest;
}

beforeEach(() => {
  estado.userIdPorEmail = null;
  estado.ativou = null;
  estado.revogou = null;
  estado.orfaRegistrada = null;
  estado.orfasRegistradas = [];
});

describe('POST /api/kiwify/webhook — verificação de assinatura', () => {
  it('rejeita payload sem assinatura', async () => {
    const res = await POST(requisicao({ order_status: 'paid' }, { semAssinatura: true }));
    expect(res.status).toBe(400);
  });

  it('rejeita assinatura inválida/forjada', async () => {
    const res = await POST(requisicao({ order_status: 'paid' }, { assinaturaForjada: true }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/kiwify/webhook — compra aprovada', () => {
  it('ativa a assinatura do plano mensal quando o produto é identificado pelo nome', async () => {
    estado.userIdPorEmail = 'user-1';
    const res = await POST(
      requisicao({
        order_id: 'kiwify_pedido_1',
        order_status: 'paid',
        Customer: { email: 'aluno@exemplo.com' },
        Product: { product_name: 'Nota 1000 — Plano Mensal' },
      })
    );
    expect(res.status).toBe(200);
    expect(estado.ativou).toEqual({ sessionId: 'kiwify_pedido_1', userId: 'user-1', planoId: 'mensal' });
  });

  it('ativa o plano único quando o produto é identificado pelo nome "30 dias"', async () => {
    estado.userIdPorEmail = 'user-2';
    const res = await POST(
      requisicao({
        order_id: 'kiwify_pedido_2',
        order_status: 'paid',
        Customer: { email: 'aluno2@exemplo.com' },
        Product: { product_name: 'Nota 1000 AI — Acesso 30 dias' },
      })
    );
    expect(res.status).toBe(200);
    expect(estado.ativou).toEqual({ sessionId: 'kiwify_pedido_2', userId: 'user-2', planoId: 'unico' });
  });

  it('identifica o plano pelo valor cobrado quando o nome do produto não é reconhecido', async () => {
    estado.userIdPorEmail = 'user-3';
    await POST(
      requisicao({
        order_id: 'kiwify_pedido_3',
        order_status: 'paid',
        Customer: { email: 'aluno3@exemplo.com' },
        Product: { product_name: 'Produto sem nome reconhecível' },
        charge_amount: 97,
      })
    );
    expect(estado.ativou?.planoId).toBe('mensal');
  });

  it('registra compra órfã quando não existe conta com o e-mail do comprador', async () => {
    estado.userIdPorEmail = null;
    const res = await POST(
      requisicao({
        order_id: 'kiwify_pedido_4',
        order_status: 'paid',
        Customer: { email: 'nao-cadastrado@exemplo.com' },
        Product: { product_name: 'Nota 1000 — Plano Mensal' },
      })
    );
    expect(res.status).toBe(200);
    expect(estado.ativou).toBeNull();
    // O ponto do caso: o dinheiro já saiu da conta de alguém. A compra tem
    // que sobrar em algum lugar resgatável, não só num log.
    expect(estado.orfaRegistrada).toMatchObject({
      orderId: 'kiwify_pedido_4',
      email: 'nao-cadastrado@exemplo.com',
      planoId: 'mensal',
    });
  });

  it('registra compra órfã quando a conta existe mas o plano não foi identificado', async () => {
    estado.userIdPorEmail = 'user-6';
    const res = await POST(
      requisicao({
        order_id: 'kiwify_pedido_6',
        order_status: 'paid',
        Customer: { email: 'aluno6@exemplo.com' },
        Product: { product_name: 'Produto desconhecido' },
      })
    );
    expect(res.status).toBe(200);
    expect(estado.ativou).toBeNull();
    expect(estado.orfaRegistrada).toMatchObject({
      orderId: 'kiwify_pedido_6',
      planoId: null,
    });
  });

  it('usa uma chave derivada do payload quando a Kiwify não manda order_id, para a reentrega continuar idempotente', async () => {
    estado.userIdPorEmail = null;
    const corpo = {
      order_status: 'paid',
      Customer: { email: 'sem-pedido@exemplo.com' },
      Product: { product_name: 'Nota 1000 — Plano Mensal' },
    };
    await POST(requisicao(corpo));
    await POST(requisicao(corpo));

    expect(estado.orfasRegistradas).toHaveLength(2);
    expect(estado.orfasRegistradas[0].orderId).toMatch(/^sem-pedido-/);
    // Mesma chave nas duas entregas: no banco, o upsert por `id` colapsa as
    // duas numa linha só. Um id sorteado criaria uma compra órfã nova a
    // cada reentrega do mesmo webhook.
    expect(estado.orfasRegistradas[1].orderId).toBe(estado.orfasRegistradas[0].orderId);
  });
});

describe('POST /api/kiwify/webhook — revogação de acesso', () => {
  it.each([
    ['refunded', 'reembolsada'],
    ['chargeback', 'chargeback'],
    ['subscription_canceled', 'cancelada'],
    ['subscription_late', 'atrasada'],
  ])('status "%s" revoga a assinatura com motivo "%s"', async (status, motivoEsperado) => {
    estado.userIdPorEmail = 'user-5';
    const res = await POST(
      requisicao({
        order_id: 'kiwify_pedido_5',
        order_status: status,
        Customer: { email: 'aluno5@exemplo.com' },
      })
    );
    expect(res.status).toBe(200);
    expect(estado.revogou).toEqual({ userId: 'user-5', motivo: motivoEsperado });
  });

  it('não revoga nada em status que não reconhecemos', async () => {
    // Os nomes de evento de cancelamento e atraso ainda são suposição
    // nossa. Um status inesperado tem que cair no ramo "desconhecida" e não
    // fazer NADA — revogar por engano tira o acesso de quem está em dia.
    estado.userIdPorEmail = 'user-7';
    const res = await POST(
      requisicao({
        order_id: 'kiwify_pedido_7',
        order_status: 'pix_gerado',
        Customer: { email: 'aluno7@exemplo.com' },
      })
    );
    expect(res.status).toBe(200);
    expect(estado.revogou).toBeNull();
    expect(estado.ativou).toBeNull();
  });

  it('não registra compra órfã em evento de revogação sem conta (não há acesso a resgatar)', async () => {
    estado.userIdPorEmail = null;
    await POST(
      requisicao({
        order_id: 'kiwify_pedido_8',
        order_status: 'refunded',
        Customer: { email: 'desconhecido@exemplo.com' },
      })
    );
    expect(estado.orfaRegistrada).toBeNull();
  });
});
