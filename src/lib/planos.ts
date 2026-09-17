/**
 * Modelo de planos definido em 14 de setembro: só duas opções, substituindo
 * as três antigas (mensal/semestral/anual). O gateway está migrando de
 * Stripe para Kiwify (ver checklist) — os `stripePriceId` abaixo são os
 * antigos, de teste, e ficam como placeholder só até essa migração terminar;
 * não refletem mais o preço real do plano `unico` e não têm efeito nenhum
 * depois que o checkout for reescrito para a Kiwify.
 */
export type PlanoId = 'mensal' | 'unico';

export interface Plano {
  id: PlanoId;
  nome: string;
  stripePriceId: string;
  diasDeAcesso: number;
  /** Assinatura que renova sozinha (mensal) vs. pagamento único com prazo fixo. */
  recorrente: boolean;
}

export const PLANOS: Record<PlanoId, Plano> = {
  mensal: {
    id: 'mensal',
    nome: 'Plano Mensal',
    stripePriceId: 'price_1UCLVPHHPGtJuCmcg85Y9iau',
    diasDeAcesso: 30,
    recorrente: true,
  },
  unico: {
    id: 'unico',
    nome: 'Acesso 40 dias',
    stripePriceId: 'price_1UCLVPHHPGtJuCmcRF19oFcQ',
    diasDeAcesso: 40,
    recorrente: false,
  },
};
