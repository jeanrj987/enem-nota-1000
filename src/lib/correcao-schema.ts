import { z } from 'zod';
import { Competencia, Correcao, ErroIdentificado } from '@/types';

const NOTAS_VALIDAS = [0, 40, 80, 120, 160, 200] as const;

/**
 * Conta parágrafos reais do texto (separados por linha em branco ou quebra de
 * linha simples). Usado para (a) informar o modelo do fato real, em vez de
 * deixá-lo inferir/alucinar estrutura, e (b) impor a trava da matriz oficial:
 * texto em bloco único (1 parágrafo) tem teto de 80 pontos em C2.
 */
export function contarParagrafos(texto: string): number {
  const porLinhaEmBranco = texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (porLinhaEmBranco.length > 1) return porLinhaEmBranco.length;

  const porQuebraSimples = texto.split(/\n/).map((p) => p.trim()).filter(Boolean);
  return Math.max(porQuebraSimples.length, 1);
}

const CompetenciaSchema = z.object({
  numero: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  nome: z.string().min(1),
  descricao_curta: z.string().min(1),
  nota: z.number().refine((n) => (NOTAS_VALIDAS as readonly number[]).includes(n), {
    message: 'nota deve ser 0, 40, 80, 120, 160 ou 200',
  }),
  nivel: z.number().int().min(0).max(5),
  comentario: z.string().min(1),
  pontos_fortes: z.array(z.string()).optional().default([]),
  pontos_melhoria: z.array(z.string()).optional().default([]),
});

const TipoErroSchema = z.enum([
  'gramatica',
  'pontuacao',
  'ortografia',
  'coesao',
  'vocabulario',
  'regencia',
  'concordancia',
  'argumentacao',
  'proposta_intervencao',
  'outro',
]);

const ErroSchema = z.object({
  id: z.string().min(1),
  trecho: z.string().min(1),
  tipo: TipoErroSchema,
  correcao: z.string().min(1),
  explicacao: z.string().min(1),
  competencia_relacionada: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
});

export const CorrecaoIASchema = z.object({
  anulada: z.boolean().optional().default(false),
  motivo_anulacao: z.string().nullable().optional().default(null),
  nota_geral: z.number().int().min(0).max(1000),
  competencias: z.array(CompetenciaSchema).length(5),
  erros: z.array(ErroSchema).optional().default([]),
  versao_reescrita: z.string().min(1),
  feedback_pedagogico: z.string().min(1),
  pontos_positivos: z.array(z.string()).optional().default([]),
  proximos_passos: z.array(z.string()).optional().default([]),
});

export type CorrecaoIA = z.infer<typeof CorrecaoIASchema>;

export type ValidacaoResultado =
  | { success: true; data: CorrecaoIA; avisos: string[] }
  | { success: false; error: string };

/**
 * Valida a resposta bruta do modelo antes de aceitá-la como correção.
 * Falha (success: false) quando a estrutura ou a matemática das notas está errada —
 * o chamador deve tratar isso como uma tentativa falha e não expor o resultado ao aluno.
 * Erros cujo trecho não existe literalmente no texto do aluno são descartados (não invalidam
 * a resposta inteira) e reportados em `avisos`.
 */
export function validarCorrecaoIA(raw: unknown, textoOriginal: string): ValidacaoResultado {
  const parsed = CorrecaoIASchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: 'Formato de resposta inválido: ' + parsed.error.message };
  }

  const data = parsed.data;
  const avisos: string[] = [];

  const somaCompetencias = data.competencias.reduce((acc, c) => acc + c.nota, 0);
  if (somaCompetencias !== data.nota_geral) {
    return {
      success: false,
      error: `nota_geral (${data.nota_geral}) não corresponde à soma das competências (${somaCompetencias})`,
    };
  }

  for (const c of data.competencias) {
    if (c.nivel !== c.nota / 40) {
      return {
        success: false,
        error: `nivel (${c.nivel}) da competência ${c.numero} não corresponde à nota (${c.nota})`,
      };
    }
  }

  const numeros = data.competencias.map((c) => c.numero).sort();
  if (JSON.stringify(numeros) !== JSON.stringify([1, 2, 3, 4, 5])) {
    return { success: false, error: 'competencias deve conter exatamente os números 1 a 5, sem repetição' };
  }

  // Regra de anulação: fuga total ao tema, cópia dos motivadores, etc. zeram a
  // redação INTEIRA, não apenas a competência diretamente relacionada. O modelo
  // já foi instruído a fazer isso no próprio JSON — aqui apenas garantimos que
  // ele obedeceu, em vez de aceitar uma nota parcial contraditória com o motivo
  // de anulação que ele mesmo declarou.
  if (data.anulada) {
    if (!data.motivo_anulacao || data.motivo_anulacao.trim().length === 0) {
      return { success: false, error: 'anulada=true mas motivo_anulacao não foi preenchido' };
    }
    if (data.nota_geral !== 0) {
      return {
        success: false,
        error: `redação marcada como anulada (${data.motivo_anulacao}), mas nota_geral é ${data.nota_geral} em vez de 0`,
      };
    }
    const competenciaNaoZerada = data.competencias.find((c) => c.nota !== 0);
    if (competenciaNaoZerada) {
      return {
        success: false,
        error: `redação marcada como anulada, mas a Competência ${competenciaNaoZerada.numero} tem nota ${competenciaNaoZerada.nota} em vez de 0`,
      };
    }
  }

  // Regra de monobloco: a própria matriz do prompt diz que texto em bloco único
  // (sem divisão em parágrafos) tem teto de 80 em C2. Checamos isso contra a
  // contagem REAL de parágrafos do texto original, em vez de confiar na leitura
  // do modelo — evita aceitar uma nota que só se sustenta se o modelo tiver
  // presumido/alucinado uma estrutura de parágrafos que não existe no texto.
  if (!data.anulada) {
    const paragrafos = contarParagrafos(textoOriginal);
    if (paragrafos <= 1) {
      const c2 = data.competencias.find((c) => c.numero === 2);
      if (c2 && c2.nota > 80) {
        return {
          success: false,
          error: `texto está em bloco único (${paragrafos} parágrafo), mas a Competência II recebeu ${c2.nota} — o teto para monobloco é 80`,
        };
      }
    }
  }

  const errosValidos = data.erros.filter((erro) => {
    const existeNoTexto = textoOriginal.includes(erro.trecho.trim());
    if (!existeNoTexto) {
      avisos.push(`Erro descartado (trecho não encontrado no texto original): "${erro.trecho}"`);
    }
    return existeNoTexto;
  });

  return {
    success: true,
    data: { ...data, erros: errosValidos },
    avisos,
  };
}

export function montarCorrecao(
  data: CorrecaoIA,
  duracaoMs: number
): Correcao {
  return {
    id: 'cor_' + Math.random().toString(36).substring(2, 9),
    redacao_id: 'red_' + Math.random().toString(36).substring(2, 9),
    anulada: data.anulada,
    motivo_anulacao: data.motivo_anulacao,
    nota_geral: data.nota_geral,
    competencias: data.competencias as Competencia[],
    erros: data.erros as ErroIdentificado[],
    versao_reescrita: data.versao_reescrita,
    feedback_pedagogico: data.feedback_pedagogico,
    pontos_positivos: data.pontos_positivos,
    proximos_passos: data.proximos_passos,
    tempo_analise_ms: duracaoMs,
    created_at: new Date().toISOString(),
  };
}
