import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PlanoId } from '@/lib/planos';
import { ativarAssinatura, revogarAssinatura } from '@/lib/ativar-assinatura';
import { buscarUserIdPorEmail } from '@/lib/perfil';
import { registrarCompraOrfa } from '@/lib/compras-orfas';
import { registrarCompraNoMeta } from '@/lib/analytics/compra';

const webhookToken = process.env.KIWIFY_WEBHOOK_TOKEN;

/**
 * Formato do payload confirmado contra a Kiwify real em 17/09 (ADR 028): o
 * "Testar Webhook" do painel (evento "Compra aprovada") bateu exatamente com
 * `order_status`/`Product.product_name`/`Customer.email`/
 * `Commissions.charge_amount`, e uma compra real de valor mínimo confirmou o
 * fluxo de ponta a ponta (webhook recebido, conta resolvida, acesso
 * liberado). Único ponto ainda sem confirmação contra um envio real: os
 * eventos de cancelamento/atraso de assinatura, que o "Testar Webhook" da
 * Kiwify não simula — o mapeamento de `ehCancelamento`/`ehAtraso` em
 * `normalizarStatus` continua sendo a melhor suposição.
 *
 * Os campos abaixo continuam todos opcionais e em variações de grafia
 * (`Customer` vs `customer`) porque a Kiwify documenta o payload de forma
 * inconsistente entre os próprios eventos — mais seguro aceitar as
 * variantes conhecidas do que assumir uma grafia fixa.
 */
interface PayloadWebhookKiwify {
  Customer?: { email?: string };
  customer?: { email?: string };
  Buyer?: { email?: string };
  buyer?: { email?: string };
  email?: string;
  Product?: { product_name?: string; name?: string };
  product?: { product_name?: string };
  product_name?: string;
  Commissions?: { charge_amount?: number };
  charge_amount?: number;
  amount?: number;
  price?: number;
  order_status?: string;
  webhook_event_type?: string;
  status?: string;
  order_id?: string;
  id?: string;
}

function assinaturaValida(payloadBruto: string, assinaturaRecebida: string | null): boolean {
  if (!webhookToken) return false;
  if (!assinaturaRecebida) return false;
  const esperada = crypto.createHmac('sha1', webhookToken).update(payloadBruto).digest('hex');
  const bufA = Buffer.from(esperada);
  const bufB = Buffer.from(assinaturaRecebida);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function extrairEmail(payload: PayloadWebhookKiwify): string | null {
  return (
    payload?.Customer?.email ||
    payload?.customer?.email ||
    payload?.Buyer?.email ||
    payload?.buyer?.email ||
    payload?.email ||
    null
  );
}

/**
 * Só existe um produto (pagamento único de R$ 56,90, acesso vitalício), então
 * toda compra aprovada vinda deste webhook ativa o plano único. Não
 * identificamos o plano pelo nome ou valor: cupons, renomeação do produto no
 * painel ou renovações de assinaturas antigas fariam a compra cair na fila de
 * órfãs mesmo com o pagamento confirmado.
 */
const PLANO_VENDIDO: PlanoId = 'unico';

function normalizarStatus(payload: PayloadWebhookKiwify): string {
  return String(
    payload?.order_status || payload?.webhook_event_type || payload?.status || ''
  ).toLowerCase();
}

/** Motivos aceitos por `revogarAssinatura`, mais a aprovação e o caso em que
 *  o status não casou com nada que a gente conheça. */
type AcaoDoWebhook =
  | 'aprovacao'
  | 'reembolsada'
  | 'chargeback'
  | 'cancelada'
  | 'atrasada'
  | 'desconhecida';

/**
 * ATENÇÃO — só "aprovacao" está confirmada contra um envio real da Kiwify.
 * Os identificadores de reembolso, chargeback, cancelamento e atraso
 * continuam sendo suposição: casam por trecho (`includes`) justamente para
 * tolerar variações de grafia enquanto ninguém confirmou os nomes reais.
 * Ver o cabeçalho deste arquivo para como confirmar.
 */
function classificarStatus(status: string): AcaoDoWebhook {
  if (status.includes('paid') || status.includes('approved') || status.includes('aprovad')) {
    return 'aprovacao';
  }
  if (status.includes('refund') || status.includes('reembols')) return 'reembolsada';
  if (status.includes('chargeback')) return 'chargeback';
  if (status.includes('cancel')) return 'cancelada';
  if (status.includes('late') || status.includes('atras')) return 'atrasada';
  return 'desconhecida';
}

/**
 * Identificador da transação, usado como chave primária tanto em
 * `assinaturas` quanto em `compras_orfas` — é o que torna a reentrega do
 * mesmo webhook inofensiva.
 *
 * Quando a Kiwify não manda `order_id`, o hash do payload cru serve de
 * substituto: reentrega do MESMO corpo produz a MESMA chave (continua
 * idempotente), e duas compras diferentes nunca colidem. Sortear um id
 * aqui criaria uma linha nova a cada reentrega.
 */
function idDoPedido(payload: PayloadWebhookKiwify, payloadBruto: string): string {
  const id = payload.order_id ?? payload.id;
  if (typeof id === 'string' && id.trim()) return id.trim();
  return `sem-pedido-${crypto.createHash('sha1').update(payloadBruto).digest('hex').slice(0, 16)}`;
}

export async function POST(req: NextRequest) {
  if (!webhookToken) {
    return NextResponse.json({ error: 'Webhook da Kiwify não configurado.' }, { status: 503 });
  }

  const payloadBruto = await req.text();
  const assinaturaRecebida = new URL(req.url).searchParams.get('signature');

  if (!assinaturaValida(payloadBruto, assinaturaRecebida)) {
    // Diagnóstico temporário: ainda não confirmamos onde/como a Kiwify manda
    // a assinatura de verdade. Loga tudo que a chamada trouxe para
    // descobrir pelo log real, em vez de adivinhar de novo.
    console.error('kiwify_webhook_assinatura_invalida', {
      url_completa: req.url,
      assinatura_recebida_na_query: assinaturaRecebida,
      todos_os_headers: Object.fromEntries(req.headers.entries()),
      payload_bruto: payloadBruto,
    });
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 });
  }

  let payload: PayloadWebhookKiwify;
  try {
    payload = JSON.parse(payloadBruto);
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const status = normalizarStatus(payload);
  const email = extrairEmail(payload);
  const acao = classificarStatus(status);

  if (!email) {
    console.error('Webhook da Kiwify sem e-mail de comprador identificável:', payloadBruto);
    return NextResponse.json({ received: true });
  }

  // Status que não reconhecemos não pode passar batido: os identificadores
  // de cancelamento e atraso ainda são suposição nossa, nunca conferidos
  // contra um envio real da Kiwify. Este log é o que permite descobrir o
  // nome verdadeiro do evento sem precisar adivinhar de novo.
  if (acao === 'desconhecida') {
    console.error(
      JSON.stringify({ evento: 'kiwify_status_desconhecido', status, payload_bruto: payloadBruto })
    );
    return NextResponse.json({ received: true });
  }

  const userId = await buscarUserIdPorEmail(email);

  if (acao === 'aprovacao') {
    return aprovar({ payload, payloadBruto, email, userId });
  }

  if (!userId) {
    // Revogação sem conta correspondente não deixa ninguém sem o que pagou
    // — não há acesso ativo para tirar. Só registra e segue.
    console.error(`Webhook da Kiwify (${status}): nenhuma conta para o e-mail ${email}.`);
    return NextResponse.json({ received: true });
  }

  await revogarAssinatura(userId, acao);
  return NextResponse.json({ received: true });
}

/**
 * Compra aprovada: o único caminho em que o dinheiro já saiu da conta de
 * alguém. Toda saída que não seja "acesso liberado" precisa terminar numa
 * linha de `compras_orfas` — é a fila de quem pagou e está sem acesso.
 * Nenhum desses casos pode acabar só num `console.error`, que foi
 * exatamente o que deixou compras se perderem em silêncio até 18/09.
 */
async function aprovar(ctx: {
  payload: PayloadWebhookKiwify;
  payloadBruto: string;
  email: string;
  userId: string | null;
}): Promise<NextResponse> {
  const planoId = PLANO_VENDIDO;
  const orderId = idDoPedido(ctx.payload, ctx.payloadBruto);

  if (ctx.userId) {
    const resultado = await ativarAssinatura({ sessionId: orderId, userId: ctx.userId, planoId });
    if (!resultado.sucesso) {
      // 500 de propósito: a Kiwify reentrega em erro, e a reentrega é
      // idempotente (`ativarAssinatura` usa o pedido como chave). Responder
      // 200 aqui perderia a compra para sempre.
      return NextResponse.json({ error: resultado.erro }, { status: 500 });
    }

    // Depois de liberar o acesso, nunca antes: o que importa para a pessoa é
    // entrar no produto. `registrarCompraNoMeta` não lança, então uma falha
    // de medição não derruba um webhook de pagamento aprovado — mas também
    // não é ignorada, porque a Kiwify reentregaria e o `event_id` derivado do
    // pedido faz o Meta deduplicar.
    await registrarCompraNoMeta({
      orderId,
      userId: ctx.userId,
      planoId,
      email: ctx.email,
    });

    return NextResponse.json({ received: true });
  }

  // Sem conta (e-mail do checkout ≠ e-mail do cadastro): vai para a fila, com o payload cru, para a pessoa poder
  // resgatar sozinha em /vincular-compra.
  await registrarCompraOrfa({
    orderId,
    email: ctx.email,
    planoId,
    payload: ctx.payload,
  });
  return NextResponse.json({ received: true });
}
