/**
 * Modelo de planos: a partir de 21 de setembro há um único produto —
 * pagamento único de R$ 56,90, sem recorrência e com acesso vitalício (antes
 * eram 2 opções: mensal R$ 97 e único R$ 147). `checkoutUrl` é o link de
 * checkout fixo criado no painel da Kiwify (não é uma sessão dinâmica criada
 * pela nossa API, como era no Stripe).
 */
export type PlanoId = 'unico';

export interface Plano {
  id: PlanoId;
  nome: string;
  checkoutUrl: string;
  /** `null` = acesso vitalício, sem data de expiração. */
  diasDeAcesso: number | null;
  /** Assinatura que renova sozinha vs. pagamento único. */
  recorrente: boolean;
  /**
   * Preço em reais. Precisa existir no código (e não só no painel da Kiwify)
   * porque é o valor da venda que a Conversions API do Meta usa para calcular
   * retorno sobre investimento em anúncio, e o que a landing exibe.
   *
   * Tem que bater com o preço configurado na Kiwify. Divergência aqui não dá
   * erro em lugar nenhum: o ROAS no Gerenciador de Anúncios fica errado, em
   * silêncio.
   */
  precoReais: number;
}

export const PLANOS: Record<PlanoId, Plano> = {
  unico: {
    id: 'unico',
    nome: 'Acesso vitalício',
    checkoutUrl: 'https://pay.kiwify.com.br/BE4tQoq',
    diasDeAcesso: null,
    recorrente: false,
    precoReais: 56.9,
  },
};
