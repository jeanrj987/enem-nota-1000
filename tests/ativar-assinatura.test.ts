import { describe, it, expect, vi, beforeEach } from 'vitest';

const upsert = vi.fn();

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: () => ({ upsert }) },
}));

import { ativarAssinatura } from '@/lib/ativar-assinatura';

describe('ativarAssinatura — plano único vitalício', () => {
  beforeEach(() => {
    upsert.mockReset();
    upsert.mockResolvedValue({ error: null });
  });

  it('grava expira_em numa data-sentinela distante, nunca null (RLS e consultas filtram por expira_em > now())', async () => {
    const resultado = await ativarAssinatura({ sessionId: 'pedido-1', userId: 'user-1', planoId: 'unico' });

    expect(resultado.sucesso).toBe(true);
    const gravado = upsert.mock.calls[0][0] as { expira_em: string; status: string; plano_id: string };
    expect(gravado.status).toBe('ativa');
    expect(gravado.plano_id).toBe('unico');
    expect(gravado.expira_em).not.toBeNull();
    expect(new Date(gravado.expira_em).getFullYear()).toBeGreaterThanOrEqual(2099);
  });
});
