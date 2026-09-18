/**
 * Limites do modelo freemium, num módulo sem dependência nenhuma.
 *
 * Vive separado de `assinatura-servidor.ts` por um motivo prático: aquele
 * arquivo importa `supabase-admin`, que carrega a service role key. A landing
 * é um componente de cliente e não pode importar de lá — puxaria código de
 * servidor para o bundle do navegador.
 *
 * Até 18/09 a saída tinha sido duplicar o número na landing, com um
 * comentário pedindo que alguém lembrasse de sincronizar os dois. Isso é
 * exatamente o tipo de acordo que se quebra em silêncio: a página anuncia um
 * número e a rota aplica outro, e quem descobre é o aluno, no meio do uso.
 * Com o valor aqui, os dois lados leem a mesma fonte.
 */

/**
 * Teto absoluto de correções gratuitas por conta (não confundir com o rate
 * limit por IP em /api/corrigir, que é só uma janela deslizante e não impede
 * alguém de corrigir indefinidamente ao longo do tempo). Uma vez atingido,
 * a conta só corrige de novo assinando — é o que dá sustentação de custo ao
 * modelo freemium.
 *
 * Era 3 até 18/09. Baixado para 1 por decisão de produto: cada correção
 * gratuita é uma chamada paga de LLM, e com a confirmação de e-mail
 * desligada no Supabase nada impede criar contas em série para multiplicar
 * a cota. Uma correção já entrega a prova de valor (a pessoa vê quantos
 * desvios o texto tem) a um terço do custo de abuso.
 */
export const LIMITE_CORRECOES_GRATUITAS = 1;

/**
 * O número por extenso, concordando em singular ou plural.
 *
 * Existe porque a landing repete essa expressão em cinco lugares. Com o
 * limite em 1, texto cravado no plural ("3 correções gratuitas") vira
 * "1 correções gratuitas" — erro de português numa página que vende
 * correção de redação é o pior lugar possível para ele aparecer.
 */
export function textoCorrecoesGratuitas(): string {
  return LIMITE_CORRECOES_GRATUITAS === 1
    ? '1 correção gratuita'
    : `${LIMITE_CORRECOES_GRATUITAS} correções gratuitas`;
}

/** Variante para quando a frase fala de redações enviadas, não de correções. */
export function textoRedacoesGratuitas(): string {
  return LIMITE_CORRECOES_GRATUITAS === 1
    ? 'sua primeira redação'
    : `suas ${LIMITE_CORRECOES_GRATUITAS} primeiras redações`;
}
