import { Correcao } from '@/types';
import { RedacaoCalibrada } from './fixtures';

export interface ExecucaoCalibracao {
  redacaoId: string;
  execucao: number;
  correcao: Correcao | null;
  erro: string | null;
  duracaoMs: number;
}

export interface MetricasPorRedacao {
  redacaoId: string;
  candidato: string;
  execucoesOk: number;
  execucoesFalhas: number;
  // Erro absoluto médio da nota geral em relação à nota oficial, entre as execuções bem-sucedidas.
  maeNotaGeral: number | null;
  // Erro absoluto médio por competência.
  maePorCompetencia: Record<1 | 2 | 3 | 4 | 5, number | null>;
  // % de competências em que o modelo acertou exatamente a nota oficial (recall no teto, quando notaOficial = 200).
  acertoExatoPorCompetencia: Record<1 | 2 | 3 | 4 | 5, number | null>;
  // Desvio padrão da nota geral entre execuções repetidas da MESMA redação (consistência).
  desvioPadraoNotaGeral: number | null;
}

function media(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function desvioPadrao(nums: number[]): number | null {
  if (nums.length < 2) return null;
  const m = media(nums)!;
  const variancia = nums.reduce((acc, n) => acc + (n - m) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variancia);
}

export function calcularMetricas(
  redacao: RedacaoCalibrada,
  execucoes: ExecucaoCalibracao[]
): MetricasPorRedacao {
  const ok = execucoes.filter((e) => e.correcao !== null);
  const falhas = execucoes.filter((e) => e.correcao === null);

  const errosNotaGeral = ok.map((e) => Math.abs(e.correcao!.nota_geral - redacao.notaOficial.geral));
  const notasGerais = ok.map((e) => e.correcao!.nota_geral);

  const competencias: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];
  const maePorCompetencia = {} as Record<1 | 2 | 3 | 4 | 5, number | null>;
  const acertoExatoPorCompetencia = {} as Record<1 | 2 | 3 | 4 | 5, number | null>;

  for (const num of competencias) {
    const chave = (`c${num}` as const) as keyof typeof redacao.notaOficial;
    const oficial = redacao.notaOficial[chave] as number;

    const notasModelo = ok
      .map((e) => e.correcao!.competencias.find((c) => c.numero === num)?.nota)
      .filter((n): n is number => typeof n === 'number');

    maePorCompetencia[num] = media(notasModelo.map((n) => Math.abs(n - oficial)));
    acertoExatoPorCompetencia[num] =
      notasModelo.length > 0
        ? notasModelo.filter((n) => n === oficial).length / notasModelo.length
        : null;
  }

  return {
    redacaoId: redacao.id,
    candidato: redacao.candidato,
    execucoesOk: ok.length,
    execucoesFalhas: falhas.length,
    maeNotaGeral: media(errosNotaGeral),
    maePorCompetencia,
    acertoExatoPorCompetencia,
    desvioPadraoNotaGeral: desvioPadrao(notasGerais),
  };
}
