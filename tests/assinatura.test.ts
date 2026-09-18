import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockState: {
  isSupabaseConfigured: boolean;
  usuario: { id: string } | null;
  maybeSingleResult: { data: { expira_em?: string } | null; error: { message: string } | null };
  ultimaChamada: { user_id?: string; status?: string; expiraAposIso?: string };
} = {
  isSupabaseConfigured: true,
  usuario: { id: 'user-teste-assinatura' },
  maybeSingleResult: { data: null, error: null },
  ultimaChamada: {},
};

vi.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() {
    return mockState.isSupabaseConfigured;
  },
  get supabase() {
    if (!mockState.isSupabaseConfigured) return null;
    return {
      auth: {
        getUser: async () => ({ data: { user: mockState.usuario } }),
      },
      from: (_table: string) => ({
        select: (_cols: string) => ({
          eq: (field: string, value: string) => {
            if (field === 'user_id') mockState.ultimaChamada.user_id = value;
            if (field === 'status') mockState.ultimaChamada.status = value;
            return {
              eq: (field2: string, value2: string) => {
                if (field2 === 'status') mockState.ultimaChamada.status = value2;
                return {
                  gt: (_field3: string, valorIso: string) => {
                    mockState.ultimaChamada.expiraAposIso = valorIso;
                    return {
                      limit: (_n: number) => ({
                        maybeSingle: async () => mockState.maybeSingleResult,
                      }),
                    };
                  },
                };
              },
            };
          },
        }),
      }),
    };
  },
}));

const { temAcessoAtivo } = await import('@/lib/assinatura');

beforeEach(() => {
  mockState.isSupabaseConfigured = true;
  mockState.usuario = { id: 'user-teste-assinatura' };
  mockState.maybeSingleResult = { data: null, error: null };
  mockState.ultimaChamada = {};
});

describe('temAcessoAtivo', () => {
  it('retorna false sem Supabase configurado (nunca libera "no escuro")', async () => {
    mockState.isSupabaseConfigured = false;
    expect(await temAcessoAtivo()).toBe(false);
  });

  it('retorna false sem usuário autenticado', async () => {
    mockState.usuario = null;
    expect(await temAcessoAtivo()).toBe(false);
  });

  it('retorna false quando não há assinatura ativa para o usuário', async () => {
    mockState.maybeSingleResult = { data: null, error: null };
    expect(await temAcessoAtivo()).toBe(false);
  });

  it('retorna true quando há assinatura ativa e não expirada', async () => {
    mockState.maybeSingleResult = { data: { expira_em: '2099-01-01T00:00:00.000Z' }, error: null };
    expect(await temAcessoAtivo()).toBe(true);
  });

  it('retorna false em caso de erro na consulta', async () => {
    mockState.maybeSingleResult = { data: null, error: { message: 'falha de rede' } };
    expect(await temAcessoAtivo()).toBe(false);
  });

  it('filtra por user_id, status ativa e expira_em no futuro', async () => {
    await temAcessoAtivo();
    expect(mockState.ultimaChamada.user_id).toBe('user-teste-assinatura');
    expect(mockState.ultimaChamada.status).toBe('ativa');
    expect(mockState.ultimaChamada.expiraAposIso).toBeTruthy();
  });
});
