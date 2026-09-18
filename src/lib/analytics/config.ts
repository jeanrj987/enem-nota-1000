/**
 * Configuração de medição — Meta Pixel (navegador), Meta Conversions API
 * (servidor) e GA4.
 *
 * O PROBLEMA CENTRAL QUE ESTA PASTA RESOLVE
 *
 * O checkout da Kiwify roda em `pay.kiwify.com.br`, outro domínio. O Pixel
 * que carrega no nosso site **nunca vê a venda acontecer** — ele perde a
 * pessoa no instante em que ela clica em "assinar". Sem tratar isso, o Meta
 * recebe cliques e visitas mas nenhuma compra, e otimiza a campanha às
 * cegas: o custo por clique fica visível, o custo por venda não existe.
 *
 * A saída tem duas metades, e as duas são obrigatórias:
 *
 * 1. **Guardar a atribuição antes de a pessoa sair.** O `fbclid` que vem na
 *    URL do anúncio é o que liga aquela visita àquele clique pago. Ele vira
 *    o cookie `_fbc` e é gravado no banco junto do `user_id` no momento em
 *    que o checkout é aberto (`src/lib/analytics/atribuicao.ts`).
 * 2. **Mandar a compra pelo servidor.** Quando o webhook da Kiwify confirma
 *    o pagamento, o evento `Purchase` sai do nosso servidor para a
 *    Conversions API com o `_fbc` guardado (`meta-capi.ts`). Vai pelo
 *    servidor porque bloqueador de anúncio e ITP do Safari derrubam boa
 *    parte dos eventos de navegador — justamente os de quem compra no
 *    celular.
 *
 * Tudo aqui é opcional por design: sem as variáveis configuradas, as funções
 * viram no-op silencioso. Medição quebrada nunca pode derrubar a venda.
 */

/** Pixel do Meta, lado navegador. Público por natureza (fica no HTML). */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || '';

/** Medição do GA4, lado navegador. Também público. */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || '';

export const metaPixelAtivo = Boolean(META_PIXEL_ID);
export const ga4Ativo = Boolean(GA_MEASUREMENT_ID);

/**
 * Nomes dos eventos padrão do Meta. Usar os nomes padrão (e não eventos
 * customizados) é o que permite escolher "Compra" como objetivo de
 * otimização dentro do Gerenciador de Anúncios — evento customizado não
 * aparece nessa lista.
 */
export const EVENTOS_META = {
  /** Chegou na página de vendas. */
  visualizouConteudo: 'ViewContent',
  /** Criou conta. É o "lead" real deste funil. */
  completouCadastro: 'CompleteRegistration',
  /** Enviou a primeira redação para correção — prova de que o produto foi usado. */
  usouProduto: 'Lead',
  /** Clicou para pagar e foi embora para a Kiwify. */
  iniciouCheckout: 'InitiateCheckout',
  /** Pagamento confirmado. Só sai pelo servidor (ver meta-capi.ts). */
  comprou: 'Purchase',
} as const;

export type EventoMeta = (typeof EVENTOS_META)[keyof typeof EVENTOS_META];
