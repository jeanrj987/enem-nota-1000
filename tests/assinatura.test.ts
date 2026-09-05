import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockState: {
  isSupabaseConfigured: boolean;
  maybeSingleResult: { data: any; error: any };
  ultimaChamada: { device_id?: string; status?: string; expiraAposIso?: string };
} = {
  isSupabaseConfigured: true,
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
      from: (_table: string) => ({
        select: (_cols: string) => ({
          eq: (field: string, value: string) => {
            if (field === 'device_id') mockState.ultimaChamada.device_id = value;
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

vi.mock('@/lib/device-id', () => ({
  getDeviceId: () => 'device-teste-assinatura',
}));

const { temAcessoAtivo } = await import('@/lib/assinatura');

beforeEach(() => {
  mockState.isSupabaseConfigured = true;
  mockState.maybeSingleResult = { data: null, error: null };
  mockState.ultimaChamada = {};
});

describe('temAcessoAtivo', () => {
  it('retorna false sem Supabase configurado (nunca libera "no escuro")', async () => {
    mockState.isSupabaseConfigured = false;
    expect(await temAcessoAtivo()).toBe(false);
  });

  it('retorna false quando não há assinatura ativa para o device_id', async () => {
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

  it('filtra por device_id, status ativa e expira_em no futuro', async () => {
    await temAcessoAtivo();
    expect(mockState.ultimaChamada.device_id).toBe('device-teste-assinatura');
    expect(mockState.ultimaChamada.status).toBe('ativa');
    expect(mockState.ultimaChamada.expiraAposIso).toBeTruthy();
  });
});
