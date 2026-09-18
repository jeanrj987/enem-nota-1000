import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const TOKEN = 'token-de-teste-kiwify';
process.env.KIWIFY_WEBHOOK_TOKEN = TOKEN;

const estado = {
  userIdPorEmail: null as string | null,
  ativou: null as { sessionId: string; userId: string; planoId: string } | null,
  revogou: null as { userId: string; motivo: string } | null,
};

vi.mock('@/lib/perfil', () => ({
  buscarUserIdPorEmail: async (_email: string) => estado.userIdPorEmail,
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

  it('não ativa nada quando não existe conta com o e-mail do comprador (fica para ativação manual)', async () => {
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
});
