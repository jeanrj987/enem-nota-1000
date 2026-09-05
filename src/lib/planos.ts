/**
 * IDs de preço do Stripe (modo de teste), gerados por scripts/stripe-setup.ts.
 * Ao migrar para produção (modo live), rodar o script de novo com a chave
 * live e atualizar os IDs aqui.
 */
export type PlanoId = 'mensal' | 'anual' | 'semestral';

export interface Plano {
  id: PlanoId;
  nome: string;
  stripePriceId: string;
  diasDeAcesso: number;
}

export const PLANOS: Record<PlanoId, Plano> = {
  mensal: {
    id: 'mensal',
    nome: 'Plano Mensal',
    stripePriceId: 'price_1UCLVPHHPGtJuCmcg85Y9iau',
    diasDeAcesso: 30,
  },
  anual: {
    id: 'anual',
    nome: 'Plano Anual (até o ENEM)',
    stripePriceId: 'price_1UCLVPHHPGtJuCmcRF19oFcQ',
    diasDeAcesso: 365,
  },
  semestral: {
    id: 'semestral',
    nome: 'Plano Semestral',
    stripePriceId: 'price_1UCLVQHHPGtJuCmcuA0AnoNP',
    diasDeAcesso: 180,
  },
};
