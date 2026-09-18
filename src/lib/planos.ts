/**
 * Modelo de planos definido em 14 de setembro: só duas opções, substituindo
 * as três antigas (mensal/semestral/anual). Migrado do Stripe para a Kiwify
 * em 17 de setembro — `checkoutUrl` é o link de checkout fixo criado no
 * painel da Kiwify (não é mais uma sessão dinâmica criada pela nossa API,
 * como era no Stripe).
 */
export type PlanoId = 'mensal' | 'unico';

export interface Plano {
  id: PlanoId;
  nome: string;
  checkoutUrl: string;
  diasDeAcesso: number;
  /** Assinatura que renova sozinha (mensal) vs. pagamento único com prazo fixo. */
  recorrente: boolean;
  /**
   * Preço em reais. Precisa existir no código (e não só no painel da Kiwify)
   * por dois motivos: o webhook identifica o plano pelo valor cobrado quando
   * o nome do produto não é reconhecido, e a Conversions API do Meta precisa
   * do valor da venda para calcular retorno sobre investimento em anúncio.
   *
   * Tem que bater com o preço configurado na Kiwify. Divergência aqui não dá
   * erro em lugar nenhum: o plano deixa de ser identificado pelo valor e o
   * ROAS no Gerenciador de Anúncios fica errado, os dois em silêncio.
   */
  precoReais: number;
}

export const PLANOS: Record<PlanoId, Plano> = {
  mensal: {
    id: 'mensal',
    nome: 'Plano Mensal',
    checkoutUrl: 'https://pay.kiwify.com.br/C2b4RMM',
    diasDeAcesso: 30,
    recorrente: true,
    precoReais: 97,
  },
  unico: {
    id: 'unico',
    nome: 'Acesso 30 dias',
    checkoutUrl: 'https://pay.kiwify.com.br/BE4tQoq',
    diasDeAcesso: 30,
    recorrente: false,
    precoReais: 147,
  },
};
