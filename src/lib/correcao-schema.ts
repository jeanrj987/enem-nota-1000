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

const ElementosC5Schema = z.object({
  agente: z.boolean(),
  acao: z.boolean(),
  meio: z.boolean(),
  efeito: z.boolean(),
  detalhamento: z.boolean(),
});

const HabilidadesC1Schema = z.object({
  ortografia_e_acentuacao: z.boolean(),
  concordancia_e_regencia: z.boolean(),
  pontuacao_adequada: z.boolean(),
  registro_formal_sem_oralidade: z.boolean(),
});

const HabilidadesC3Schema = z.object({
  tese_clara: z.boolean(),
  argumentos_bem_selecionados: z.boolean(),
  progressao_logica: z.boolean(),
  conclusao_articulada: z.boolean(),
});

const HabilidadesC4Schema = z.object({
  conectivos_interparagrafos: z.boolean(),
  conectivos_intraparagrafos_variados: z.boolean(),
  ausencia_repeticao_excessiva: z.boolean(),
  ausencia_marcadores_orais: z.boolean(),
});

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
  // Cada campo abaixo é preenchido apenas na competência correspondente — ver
  // regras de consistência em validarCorrecaoIA.
  habilidades_c1: HabilidadesC1Schema.optional(),
  habilidades_c3: HabilidadesC3Schema.optional(),
  habilidades_c4: HabilidadesC4Schema.optional(),
  elementos_c5: ElementosC5Schema.optional(),
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

  // Regra de consistência de C5: o modelo declara quais dos 5 elementos da
  // proposta de intervenção (Agente, Ação, Meio, Efeito, Detalhamento) estão
  // presentes como campos estruturados, em vez de só descrever em texto livre.
  // Só travamos as faixas inequívocas da matriz (4-5 elementos ⇒ nota alta;
  // 0 elementos ⇒ nota 0) — as faixas intermediárias (1, 2-3 elementos, ou
  // "proposta genérica") envolvem julgamento qualitativo que não dá pra reduzir
  // a uma contagem mecânica, então não são travadas aqui.
  if (!data.anulada) {
    const c5 = data.competencias.find((c) => c.numero === 5);
    if (c5?.elementos_c5) {
      const presentes = Object.values(c5.elementos_c5).filter(Boolean).length;
      if (presentes >= 4 && c5.nota < 160) {
        return {
          success: false,
          error: `Competência V declara ${presentes} de 5 elementos presentes, mas recebeu nota ${c5.nota} — 4 ou 5 elementos exige nota mínima de 160`,
        };
      }
      if (presentes === 0 && c5.nota !== 0) {
        return {
          success: false,
          error: `Competência V declara 0 elementos presentes, mas recebeu nota ${c5.nota} em vez de 0`,
        };
      }
    }
  }

  // Regra de consistência de C1, C3 e C4: cada uma declara 4 habilidades
  // estruturadas (ver schemas acima). Mesma lógica de C5 — só travamos as
  // pontas inequívocas: se as 4 habilidades foram marcadas como presentes,
  // a nota não pode ficar na faixa "mediana ou pior" (< 160); se nenhuma foi
  // marcada como presente, a nota não pode ficar na faixa "boa ou melhor" (> 80).
  // As faixas do meio continuam por conta do julgamento qualitativo do modelo.
  if (!data.anulada) {
    const regrasHabilidades: { numero: 1 | 3 | 4; campo: 'habilidades_c1' | 'habilidades_c3' | 'habilidades_c4' }[] = [
      { numero: 1, campo: 'habilidades_c1' },
      { numero: 3, campo: 'habilidades_c3' },
      { numero: 4, campo: 'habilidades_c4' },
    ];

    for (const { numero, campo } of regrasHabilidades) {
      const competencia = data.competencias.find((c) => c.numero === numero);
      const habilidades = competencia?.[campo];
      if (!competencia || !habilidades) continue;

      const presentes = Object.values(habilidades).filter(Boolean).length;
      if (presentes === 4 && competencia.nota < 160) {
        return {
          success: false,
          error: `Competência ${numero} declara as 4 habilidades presentes, mas recebeu nota ${competencia.nota} — deveria ser no mínimo 160`,
        };
      }
      if (presentes === 0 && competencia.nota > 80) {
        return {
          success: false,
          error: `Competência ${numero} declara 0 habilidades presentes, mas recebeu nota ${competencia.nota} — não pode passar de 80`,
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

  // Checagem cruzada de C1: se a nota for a máxima (200 — "poucos ou nenhum
  // deslize"), mas o próprio modelo listou 2 ou mais erros gramaticais válidos
  // (grounded) relacionados a C1 em erros[], há uma contradição entre a nota
  // e os próprios apontamentos do modelo.
  if (!data.anulada) {
    const c1 = data.competencias.find((c) => c.numero === 1);
    if (c1 && c1.nota === 200) {
      const errosC1 = errosValidos.filter((e) => e.competencia_relacionada === 1);
      if (errosC1.length >= 2) {
        return {
          success: false,
          error: `Competência I recebeu nota 200 ("poucos ou nenhum deslize"), mas o próprio modelo listou ${errosC1.length} erros gramaticais válidos relacionados a essa competência`,
        };
      }
    }
  }

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
