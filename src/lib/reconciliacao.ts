import { Correcao, Competencia, ReconciliacaoInfo } from '@/types';
import { gerarId } from './ids';

/**
 * Limiar de divergência entre correções, em pontos de nota_geral, acima do
 * qual uma terceira correção é acionada — mesmo princípio do protocolo oficial
 * do INEP (dois corretores independentes; se divergem mais que o limiar, um
 * terceiro corretor arbitra).
 */
export const LIMIAR_DIVERGENCIA = 100;

/** Uma correção "leve" (segunda opinião só de nota, ver openai.ts) devolve
 *  versao_reescrita vazia de propósito. */
function temNarrativa(c: Correcao): boolean {
  return c.versao_reescrita.trim().length > 0;
}

/** Se `base` não tem narrativa mas `alternativa` tem, empresta dela o texto
 *  pedagógico — é o que permite que uma correção "leve" nunca vire a fonte
 *  de uma reescrita vazia, mesmo quando é ela quem melhor representa a nota
 *  final. Quando nenhuma das duas tem (só acontece se algo já saiu do
 *  esperado a montante), `base` é devolvida como está. */
function comNarrativaEmprestada(base: Correcao, alternativa: Correcao): Correcao {
  if (temNarrativa(base) || !temNarrativa(alternativa)) return base;
  return {
    ...base,
    versao_reescrita: alternativa.versao_reescrita,
    feedback_pedagogico: alternativa.feedback_pedagogico,
    pontos_positivos: alternativa.pontos_positivos,
    proximos_passos: alternativa.proximos_passos,
  };
}

/**
 * Reconcilia 2 ou 3 correções independentes da mesma redação em uma única
 * correção final: a nota de cada competência vira a MÉDIA das duas correções
 * mais próximas entre si (podendo não ser múltiplo de 40, exatamente como a
 * nota final oficial do ENEM também pode não ser). O texto pedagógico
 * (comentários, versão reescrita, feedback) vem da correção cuja nota_geral
 * ficou mais próxima da média final — não é possível "misturar" prosa de duas
 * respostas diferentes sem produzir texto incoerente.
 */
export function reconciliarCorrecoes(
  correcoes: Correcao[],
  motivoCorrecaoUnica: 'falha' | 'acesso-gratuito' = 'falha'
): Correcao {
  if (correcoes.length === 1) {
    return {
      ...correcoes[0],
      reconciliacao: {
        notasIndividuais: [correcoes[0].nota_geral],
        divergencia: 0,
        terceiraCorrecaoAcionada: false,
        correcaoUnica: true,
        motivoCorrecaoUnica,
      },
    };
  }

  // Escolhe o par com MENOR divergência entre si (relevante quando há 3
  // correções, por causa da terceira correção de arbitragem).
  let melhorPar: [Correcao, Correcao] = [correcoes[0], correcoes[1]];
  let menorDivergencia = Math.abs(correcoes[0].nota_geral - correcoes[1].nota_geral);

  for (let i = 0; i < correcoes.length; i++) {
    for (let j = i + 1; j < correcoes.length; j++) {
      const divergencia = Math.abs(correcoes[i].nota_geral - correcoes[j].nota_geral);
      if (divergencia < menorDivergencia) {
        menorDivergencia = divergencia;
        melhorPar = [correcoes[i], correcoes[j]];
      }
    }
  }

  const [a, b] = melhorPar;

  // Se as duas correções mais próximas discordam sobre anulação, não faz
  // sentido tirar média das notas (não existe "meio anulada") — nesse caso,
  // confiamos no julgamento da correção com nota_geral mais alta, que é a
  // leitura mais garantista para o aluno, e sinalizamos a divergência.
  if (a.anulada !== b.anulada) {
    const escolhidaBruta = a.nota_geral >= b.nota_geral ? a : b;
    // A escolha aqui é sobre qual JULGAMENTO de anulação prevalece (a mais
    // garantista); o texto pedagógico é uma questão à parte — se a escolhida
    // for a correção "leve" (sem narrativa), pega emprestada da outra.
    const escolhida = comNarrativaEmprestada(escolhidaBruta, escolhidaBruta === a ? b : a);
    return {
      ...escolhida,
      id: gerarId('cor'),
      redacao_id: gerarId('red'),
      reconciliacao: {
        notasIndividuais: correcoes.map((c) => c.nota_geral),
        divergencia: menorDivergencia,
        terceiraCorrecaoAcionada: correcoes.length === 3,
        correcaoUnica: false,
        divergenciaDeAnulacao: true,
      } satisfies ReconciliacaoInfo,
    };
  }

  const notaGeralMedia = Math.round((a.nota_geral + b.nota_geral) / 2);

  // A correção "representativa" fornece os comentários por competência e a
  // lista de erros: a mais próxima da média final, como antes. Mas o texto
  // pedagógico central (reescrita, feedback, pontos positivos e próximos
  // passos) só existe em correções "completas" — uma correção "leve" (a
  // segunda opinião gerada só para conferir a nota, ver openai.ts) devolve
  // esses campos vazios de propósito, para não gastar tokens de saída num
  // texto que seria descartado de qualquer forma. Por isso a narrativa é
  // emprestada da outra correção quando a representativa não tem a sua.
  const representativaBruta =
    Math.abs(a.nota_geral - notaGeralMedia) <= Math.abs(b.nota_geral - notaGeralMedia) ? a : b;
  const representativa = comNarrativaEmprestada(
    representativaBruta,
    representativaBruta === a ? b : a
  );

  // A outra correção (para a média por competência) é definida a partir de
  // `representativaBruta`, não de `representativa`: esta última pode ser um
  // objeto novo (quando a narrativa foi emprestada), e comparar por
  // identidade contra `a`/`b` quebraria silenciosamente nesse caso.
  const outraParaMedia = representativaBruta === a ? b : a;
  const competenciasMedia: Competencia[] = representativa.competencias.map((compRepresentativa) => {
    const compOutra =
      outraParaMedia.competencias.find((c) => c.numero === compRepresentativa.numero) ??
      compRepresentativa;
    return {
      ...compRepresentativa,
      nota: Math.round((compRepresentativa.nota + compOutra.nota) / 2),
    };
  });

  return {
    ...representativa,
    id: gerarId('cor'),
    redacao_id: gerarId('red'),
    nota_geral: notaGeralMedia,
    competencias: competenciasMedia,
    reconciliacao: {
      notasIndividuais: correcoes.map((c) => c.nota_geral),
      divergencia: menorDivergencia,
      terceiraCorrecaoAcionada: correcoes.length === 3,
      correcaoUnica: false,
      divergenciaDeAnulacao: false,
    } satisfies ReconciliacaoInfo,
  };
}
