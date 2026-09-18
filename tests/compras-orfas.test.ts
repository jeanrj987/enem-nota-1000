import { describe, it, expect, vi, beforeEach } from 'vitest';

interface LinhaOrfa {
  id: string;
  email: string;
  plano_id: string | null;
  status: string;
}

const estado = {
  linhas: [] as LinhaOrfa[],
  ativou: null as { sessionId: string; userId: string; planoId: string } | null,
  falharAtivacao: false,
  upserts: [] as Record<string, unknown>[],
  updates: [] as { id: string; campos: Record<string, unknown> }[],
};

/**
 * Mock mínimo do encadeamento do supabase-js usado por `compras-orfas.ts`:
 * `.from().select().eq().maybeSingle()`, `.from().update().eq()` e
 * `.from().upsert()`. Não é um Supabase de mentira genérico — cobre só o que
 * esta lib chama, para o teste quebrar se o encadeamento mudar.
 */
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: (tabela: string) => {
      if (tabela !== 'compras_orfas') throw new Error(`tabela inesperada: ${tabela}`);
      return {
        select: () => ({
          eq: (_coluna: string, valor: string) => ({
            maybeSingle: async () => ({
              data: estado.linhas.find((l) => l.id === valor) ?? null,
              error: null,
            }),
          }),
        }),
        upsert: async (registro: Record<string, unknown>) => {
          estado.upserts.push(registro);
          return { error: null };
        },
        update: (campos: Record<string, unknown>) => ({
          eq: async (_coluna: string, valor: string) => {
            estado.updates.push({ id: valor, campos });
            const linha = estado.linhas.find((l) => l.id === valor);
            if (linha) linha.status = String(campos.status);
            return { error: null };
          },
        }),
      };
    },
  },
}));

vi.mock('@/lib/ativar-assinatura', () => ({
  ativarAssinatura: async (params: { sessionId: string; userId: string; planoId: string }) => {
    if (estado.falharAtivacao) return { sucesso: false, erro: 'Falha ao registrar assinatura.' };
    estado.ativou = params;
    return { sucesso: true };
  },
}));

const { vincularCompraOrfa, registrarCompraOrfa } = await import('@/lib/compras-orfas');

const PEDIDO = 'kiwify_pedido_99';
const EMAIL_COMPRA = 'pai.da.maria@exemplo.com';

beforeEach(() => {
  estado.linhas = [
    { id: PEDIDO, email: EMAIL_COMPRA, plano_id: 'mensal', status: 'pendente' },
  ];
  estado.ativou = null;
  estado.falharAtivacao = false;
  estado.upserts = [];
  estado.updates = [];
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('vincularCompraOrfa — proteção contra resgate indevido', () => {
  it('não libera acesso quando o código do pedido existe mas o e-mail não bate', async () => {
    const resultado = await vincularCompraOrfa({
      orderId: PEDIDO,
      email: 'estranho@exemplo.com',
      userId: 'user-invasor',
    });
    expect(resultado).toEqual({ tipo: 'nao_encontrada' });
    expect(estado.ativou).toBeNull();
  });

  it('não libera acesso para um código de pedido inexistente', async () => {
    const resultado = await vincularCompraOrfa({
      orderId: 'pedido-chutado',
      email: EMAIL_COMPRA,
      userId: 'user-invasor',
    });
    expect(resultado).toEqual({ tipo: 'nao_encontrada' });
    expect(estado.ativou).toBeNull();
  });

  it('devolve resultado idêntico para pedido inexistente e e-mail errado (não vaza quais pedidos existem)', async () => {
    const pedidoErrado = await vincularCompraOrfa({
      orderId: 'pedido-que-nao-existe',
      email: EMAIL_COMPRA,
      userId: 'user-invasor',
    });
    const emailErrado = await vincularCompraOrfa({
      orderId: PEDIDO,
      email: 'outro@exemplo.com',
      userId: 'user-invasor',
    });
    expect(pedidoErrado).toEqual(emailErrado);
  });
});

describe('vincularCompraOrfa — resgate legítimo', () => {
  it('libera o acesso e marca a compra como vinculada', async () => {
    const resultado = await vincularCompraOrfa({
      orderId: PEDIDO,
      email: EMAIL_COMPRA,
      userId: 'user-maria',
    });

    expect(resultado).toEqual({ tipo: 'vinculada', planoId: 'mensal' });
    expect(estado.ativou).toEqual({
      sessionId: PEDIDO,
      userId: 'user-maria',
      planoId: 'mensal',
    });
    expect(estado.updates[0].campos.status).toBe('vinculada');
    expect(estado.updates[0].campos.user_id).toBe('user-maria');
  });

  it.each([
    ['  Pai.Da.Maria@Exemplo.com  ', 'caixa e espaços diferentes'],
    ['PAI.DA.MARIA@EXEMPLO.COM', 'tudo em maiúsculas'],
  ])('aceita o e-mail com %s (%s)', async (emailDigitado) => {
    const resultado = await vincularCompraOrfa({
      orderId: PEDIDO,
      email: emailDigitado,
      userId: 'user-maria',
    });
    expect(resultado.tipo).toBe('vinculada');
  });

  it('aceita o código do pedido com espaços sobrando (colagem do e-mail)', async () => {
    const resultado = await vincularCompraOrfa({
      orderId: `  ${PEDIDO}  `,
      email: EMAIL_COMPRA,
      userId: 'user-maria',
    });
    expect(resultado.tipo).toBe('vinculada');
  });
});

describe('vincularCompraOrfa — casos que não podem liberar acesso no chute', () => {
  it('recusa quando a compra já foi vinculada a alguém', async () => {
    estado.linhas[0].status = 'vinculada';
    const resultado = await vincularCompraOrfa({
      orderId: PEDIDO,
      email: EMAIL_COMPRA,
      userId: 'user-outro',
    });
    expect(resultado).toEqual({ tipo: 'ja_vinculada' });
    expect(estado.ativou).toBeNull();
  });

  it('manda para resgate manual quando o plano não foi identificado, em vez de chutar um', async () => {
    estado.linhas[0].plano_id = null;
    const resultado = await vincularCompraOrfa({
      orderId: PEDIDO,
      email: EMAIL_COMPRA,
      userId: 'user-maria',
    });
    expect(resultado).toEqual({ tipo: 'exige_resgate_manual' });
    expect(estado.ativou).toBeNull();
  });

  it('mantém a compra pendente quando a ativação falha, para ela não sumir da fila', async () => {
    estado.falharAtivacao = true;
    const resultado = await vincularCompraOrfa({
      orderId: PEDIDO,
      email: EMAIL_COMPRA,
      userId: 'user-maria',
    });
    expect(resultado.tipo).toBe('erro');
    expect(estado.updates).toHaveLength(0);
    expect(estado.linhas[0].status).toBe('pendente');
  });
});

describe('registrarCompraOrfa', () => {
  it('grava a compra como pendente, com o payload cru preservado', async () => {
    const payload = { order_id: 'novo_1', Customer: { email: 'a@b.com' } };
    const resultado = await registrarCompraOrfa({
      orderId: 'novo_1',
      email: 'a@b.com',
      planoId: 'unico',
      payload,
    });

    expect(resultado.sucesso).toBe(true);
    expect(estado.upserts[0]).toMatchObject({
      id: 'novo_1',
      email: 'a@b.com',
      plano_id: 'unico',
      status: 'pendente',
      payload,
    });
  });

  it('aceita plano nulo — a compra entra na fila mesmo sem produto identificado', async () => {
    const resultado = await registrarCompraOrfa({
      orderId: 'novo_2',
      email: 'c@d.com',
      planoId: null,
      payload: {},
    });
    expect(resultado.sucesso).toBe(true);
    expect(estado.upserts[0].plano_id).toBeNull();
  });
});
