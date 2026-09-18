import { PLANOS, PlanoId } from '@/lib/planos';
import { buscarAtribuicao } from './atribuicao-servidor';
import { capiAtivo, enviarCompra } from './meta-capi';

/**
 * Reporta ao Meta uma venda já confirmada. Chamada nos dois pontos em que o
 * acesso pago passa a existir: o webhook da Kiwify e o resgate de compra
 * órfã em `/vincular-compra`.
 *
 * O `event_id` é derivado do id do pedido, não sorteado. Isso é o que torna
 * a chamada segura de repetir: reentrega do webhook, reprocessamento manual
 * ou uma compra que foi ativada pelo resgate depois de já ter sido reportada
 * chegam ao Meta com o mesmo id, e ele conta **uma** conversão. Um id
 * aleatório inflaria o número de vendas no Gerenciador de Anúncios e faria o
 * custo por aquisição parecer menor do que é — o erro que leva a escalar uma
 * campanha que não se paga.
 */
export async function registrarCompraNoMeta(params: {
  orderId: string;
  userId: string;
  planoId: PlanoId;
  email: string | null;
}): Promise<void> {
  if (!capiAtivo) return;

  const plano = PLANOS[params.planoId];
  if (!plano) {
    console.error('Compra sem plano conhecido não foi reportada ao Meta:', params);
    return;
  }

  // Sem atribuição guardada o evento ainda vale a pena: o Meta consegue casar
  // pelo e-mail (hasheado) com o usuário do Facebook. A precisão cai, mas uma
  // venda não reportada vale zero.
  const atribuicao = await buscarAtribuicao(params.userId);

  await enviarCompra({
    eventId: `compra_${params.orderId}`,
    valor: plano.precoReais,
    planoId: params.planoId,
    pessoa: {
      email: params.email,
      fbc: atribuicao?.fbc ?? null,
      fbp: atribuicao?.fbp ?? null,
      userAgent: atribuicao?.userAgent ?? null,
    },
  });
}
