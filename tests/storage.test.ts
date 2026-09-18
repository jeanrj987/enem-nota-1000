import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redacao } from '@/types';

const mockState: {
  isSupabaseConfigured: boolean;
  usuario: { id: string } | null;
  selectResult: { data: unknown; error: unknown };
  maybeSingleResult: { data: unknown; error: unknown };
  correcoesResult: { data: unknown; error: unknown };
  correcaoUnicaResult: { data: unknown; error: unknown };
} = {
  isSupabaseConfigured: true,
  usuario: { id: 'user-teste' },
  selectResult: { data: [], error: null },
  maybeSingleResult: { data: null, error: null },
  correcoesResult: { data: [], error: null },
  correcaoUnicaResult: { data: null, error: null },
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
      from: (tabela: string) => ({
        select: (_cols: string) => ({
          eq: (_field: string, _value: string) => ({
            // `correcoes` responde conforme a RLS: quando não há assinatura
            // ativa, o banco simplesmente não devolve linha.
            order: async (_f: string, _o: { ascending?: boolean }) =>
              tabela === 'correcoes' ? mockState.correcoesResult : mockState.selectResult,
            maybeSingle: async () =>
              tabela === 'correcoes' ? mockState.correcaoUnicaResult : mockState.maybeSingleResult,
            then: (resolve: (value: unknown) => unknown) =>
              resolve(tabela === 'correcoes' ? mockState.correcoesResult : mockState.selectResult),
          }),
        }),
      }),
    };
  },
}));

// Importa depois dos mocks para que storage.ts resolva as versões mockadas.
const { getRedacoesSalvas, buscarRedacaoPorId, calcularEstatisticas, gerarHistoricoGraficos } =
  await import('@/lib/storage');

function redacaoDeTeste(overrides: Partial<Redacao> = {}): Redacao {
  return {
    id: 'red_1',
    titulo: 'Teste',
    tema: 'Tema de teste',
    texto: 'Texto de teste.',
    palavras_count: 3,
    linhas_count: 1,
    status: 'corrigida',
    created_at: new Date().toISOString(),
    correcao: {
      id: 'cor_1',
      redacao_id: 'red_1',
      anulada: false,
      motivo_anulacao: null,
      nota_geral: 800,
      competencias: [
        { numero: 1, nome: 'C1', descricao_curta: '', nota: 160, nivel: 4, comentario: '' },
        { numero: 2, nome: 'C2', descricao_curta: '', nota: 160, nivel: 4, comentario: '' },
        { numero: 3, nome: 'C3', descricao_curta: '', nota: 160, nivel: 4, comentario: '' },
        { numero: 4, nome: 'C4', descricao_curta: '', nota: 160, nivel: 4, comentario: '' },
        { numero: 5, nome: 'C5', descricao_curta: '', nota: 160, nivel: 4, comentario: '' },
      ],
      erros: [],
      versao_reescrita: '',
      feedback_pedagogico: '',
      pontos_positivos: [],
      proximos_passos: [],
      created_at: new Date().toISOString(),
    },
    ...overrides,
  };
}

beforeEach(() => {
  mockState.isSupabaseConfigured = true;
  mockState.usuario = { id: 'user-teste' };
  mockState.selectResult = { data: [], error: null };
  mockState.maybeSingleResult = { data: null, error: null };
  mockState.correcoesResult = { data: [], error: null };
  mockState.correcaoUnicaResult = { data: null, error: null };
});

function linhaDoBanco(overrides: Record<string, unknown> = {}) {
  return {
    id: 'red_x',
    titulo: 'Do banco',
    tema: 'Tema X',
    texto: 'Texto X',
    palavras_count: 2,
    linhas_count: 1,
    status: 'corrigida',
    total_erros: 7,
    anulada: false,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('storage.ts com Supabase configurado', () => {
  it('junta a correção quando a RLS libera (assinante ativo)', async () => {
    mockState.selectResult = { data: [linhaDoBanco()], error: null };
    mockState.correcoesResult = {
      data: [{ redacao_id: 'red_x', dados: { nota_geral: 720 } }],
      error: null,
    };

    const lista = await getRedacoesSalvas();
    expect(lista).toHaveLength(1);
    expect(lista[0].correcao?.nota_geral).toBe(720);
    expect(lista[0].chamariz).toBeUndefined();
  });

  it('devolve apenas o chamariz quando a RLS bloqueia (sem assinatura)', async () => {
    mockState.selectResult = { data: [linhaDoBanco()], error: null };
    mockState.correcoesResult = { data: [], error: null };

    const lista = await getRedacoesSalvas();
    expect(lista[0].correcao).toBeUndefined();
    expect(lista[0].chamariz).toEqual({ total_erros: 7, anulada: false });
  });

  it('buscarRedacaoPorId retorna undefined quando o Supabase não encontra a linha', async () => {
    mockState.maybeSingleResult = { data: null, error: null };
    const encontrada = await buscarRedacaoPorId('inexistente');
    expect(encontrada).toBeUndefined();
  });

  it('buscarRedacaoPorId entrega a correção completa para assinante', async () => {
    mockState.maybeSingleResult = { data: linhaDoBanco({ id: 'red_y' }), error: null };
    mockState.correcaoUnicaResult = { data: { dados: { nota_geral: 900 } }, error: null };

    const encontrada = await buscarRedacaoPorId('red_y');
    expect(encontrada?.correcao?.nota_geral).toBe(900);
  });

  it('buscarRedacaoPorId nunca inventa nota quando a correção está bloqueada', async () => {
    mockState.maybeSingleResult = { data: linhaDoBanco({ id: 'red_y', total_erros: 3 }), error: null };
    mockState.correcaoUnicaResult = { data: null, error: null };

    const encontrada = await buscarRedacaoPorId('red_y');
    expect(encontrada?.correcao).toBeUndefined();
    expect(encontrada?.chamariz).toEqual({ total_erros: 3, anulada: false });
  });
});

describe('storage.ts sem Supabase configurado (fallback)', () => {
  it('getRedacoesSalvas não lança erro e devolve um array', async () => {
    mockState.isSupabaseConfigured = false;
    const lista = await getRedacoesSalvas();
    expect(Array.isArray(lista)).toBe(true);
  });

  it('buscarRedacaoPorId não lança erro mesmo sem Supabase', async () => {
    mockState.isSupabaseConfigured = false;
    await expect(buscarRedacaoPorId('qualquer')).resolves.toBeDefined;
  });
});

describe('calcularEstatisticas (função pura)', () => {
  it('retorna zeros para lista sem redações corrigidas', () => {
    const stats = calcularEstatisticas([]);
    expect(stats.total_redacoes).toBe(0);
    expect(stats.media_geral).toBe(0);
  });

  it('calcula média, maior nota e última nota corretamente', () => {
    const r1 = redacaoDeTeste({ id: 'a', correcao: { ...redacaoDeTeste().correcao!, nota_geral: 600 } });
    const r2 = redacaoDeTeste({ id: 'b', correcao: { ...redacaoDeTeste().correcao!, nota_geral: 800 } });
    const stats = calcularEstatisticas([r2, r1]); // mais recente primeiro, como getRedacoesSalvas ordena
    expect(stats.total_redacoes).toBe(2);
    expect(stats.media_geral).toBe(700);
    expect(stats.maior_nota).toBe(800);
    expect(stats.ultima_nota).toBe(800);
  });
});

describe('gerarHistoricoGraficos (função pura)', () => {
  it('ordena da mais antiga para a mais recente', () => {
    const antiga = redacaoDeTeste({ id: 'antiga', created_at: '2026-01-01T00:00:00.000Z' });
    const recente = redacaoDeTeste({ id: 'recente', created_at: '2026-02-01T00:00:00.000Z' });
    const historico = gerarHistoricoGraficos([recente, antiga]);
    expect(historico[0].id).toBe('antiga');
    expect(historico[1].id).toBe('recente');
  });
});
