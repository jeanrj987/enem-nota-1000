import { Correcao, Competencia, ReconciliacaoInfo } from '@/types';
import { gerarId } from './ids';

/**
 * Limiar de divergência entre correções, em pontos de nota_geral, acima do
 * qual uma terceira correção é acionada — mesmo princípio do protocolo oficial
 * do INEP (dois corretores independentes; se divergem mais que o limiar, um
 * terceiro corretor arbitra).
 */
export const LIMIAR_DIVERGENCIA = 100;

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
    const escolhida = a.nota_geral >= b.nota_geral ? a : b;
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

  // A correção "representativa" (fonte do texto pedagógico) é a mais próxima
  // da média final.
  const representativa =
    Math.abs(a.nota_geral - notaGeralMedia) <= Math.abs(b.nota_geral - notaGeralMedia) ? a : b;

  const competenciasMedia: Competencia[] = representativa.competencias.map((compRepresentativa) => {
    const compOutra =
      (representativa === a ? b : a).competencias.find((c) => c.numero === compRepresentativa.numero) ??
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
