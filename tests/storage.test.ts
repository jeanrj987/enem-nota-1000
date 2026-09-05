import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redacao } from '@/types';

const mockState: {
  isSupabaseConfigured: boolean;
  selectResult: { data: any; error: any };
  maybeSingleResult: { data: any; error: any };
  upsertResult: { error: any };
  upsertCalls: any[];
} = {
  isSupabaseConfigured: true,
  selectResult: { data: [], error: null },
  maybeSingleResult: { data: null, error: null },
  upsertResult: { error: null },
  upsertCalls: [],
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
          eq: (_field: string, _value: string) => ({
            order: async (_field: string, _opts: any) => mockState.selectResult,
            maybeSingle: async () => mockState.maybeSingleResult,
          }),
        }),
        upsert: async (row: any) => {
          mockState.upsertCalls.push(row);
          return mockState.upsertResult;
        },
      }),
    };
  },
}));

vi.mock('@/lib/device-id', () => ({
  getDeviceId: () => 'device-teste',
}));

// Importa depois dos mocks para que storage.ts resolva as versões mockadas.
const { getRedacoesSalvas, salvarRedacao, buscarRedacaoPorId, calcularEstatisticas, gerarHistoricoGraficos } =
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
  mockState.selectResult = { data: [], error: null };
  mockState.maybeSingleResult = { data: null, error: null };
  mockState.upsertResult = { error: null };
  mockState.upsertCalls = [];
});

describe('storage.ts com Supabase configurado', () => {
  it('getRedacoesSalvas mapeia as linhas retornadas para Redacao[]', async () => {
    mockState.selectResult = {
      data: [
        {
          id: 'red_x',
          titulo: 'Do banco',
          tema: 'Tema X',
          texto: 'Texto X',
          palavras_count: 2,
          linhas_count: 1,
          status: 'corrigida',
          correcao: { nota_geral: 720 },
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      error: null,
    };

    const lista = await getRedacoesSalvas();
    expect(lista).toHaveLength(1);
    expect(lista[0].id).toBe('red_x');
    expect(lista[0].correcao?.nota_geral).toBe(720);
  });

  it('salvarRedacao envia device_id e os campos da redação no upsert', async () => {
    await salvarRedacao(redacaoDeTeste());
    expect(mockState.upsertCalls).toHaveLength(1);
    expect(mockState.upsertCalls[0]).toMatchObject({
      id: 'red_1',
      device_id: 'device-teste',
      titulo: 'Teste',
    });
    expect(mockState.upsertCalls[0].correcao.nota_geral).toBe(800);
  });

  it('buscarRedacaoPorId retorna undefined quando o Supabase não encontra a linha', async () => {
    mockState.maybeSingleResult = { data: null, error: null };
    const encontrada = await buscarRedacaoPorId('inexistente');
    expect(encontrada).toBeUndefined();
  });

  it('buscarRedacaoPorId mapeia a linha encontrada', async () => {
    mockState.maybeSingleResult = {
      data: {
        id: 'red_y',
        titulo: 'Achada',
        tema: 'Tema Y',
        texto: 'Texto Y',
        palavras_count: 5,
        linhas_count: 1,
        status: 'corrigida',
        correcao: { nota_geral: 900 },
        created_at: '2026-01-01T00:00:00.000Z',
      },
      error: null,
    };
    const encontrada = await buscarRedacaoPorId('red_y');
    expect(encontrada?.titulo).toBe('Achada');
  });
});

describe('storage.ts sem Supabase configurado (fallback)', () => {
  it('getRedacoesSalvas não lança erro e devolve um array', async () => {
    mockState.isSupabaseConfigured = false;
    const lista = await getRedacoesSalvas();
    expect(Array.isArray(lista)).toBe(true);
  });

  it('salvarRedacao não lança erro mesmo sem Supabase', async () => {
    mockState.isSupabaseConfigured = false;
    await expect(salvarRedacao(redacaoDeTeste())).resolves.toBeUndefined();
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
