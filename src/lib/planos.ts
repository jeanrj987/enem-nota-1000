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
}

export const PLANOS: Record<PlanoId, Plano> = {
  mensal: {
    id: 'mensal',
    nome: 'Plano Mensal',
    checkoutUrl: 'https://pay.kiwify.com.br/C2b4RMM',
    diasDeAcesso: 30,
    recorrente: true,
  },
  unico: {
    id: 'unico',
    nome: 'Acesso 40 dias',
    checkoutUrl: 'https://pay.kiwify.com.br/BE4tQoq',
    diasDeAcesso: 40,
    recorrente: false,
  },
};
