import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PLANOS, PlanoId } from '@/lib/planos';
import { ativarAssinatura, revogarAssinatura } from '@/lib/ativar-assinatura';
import { buscarUserIdPorEmail } from '@/lib/perfil';
import { registrarCompraOrfa } from '@/lib/compras-orfas';
import { registrarCompraNoMeta } from '@/lib/analytics/compra';

const webhookToken = process.env.KIWIFY_WEBHOOK_TOKEN;

/** Margem ao casar o valor cobrado com o preço do plano — cobre centavos de
 *  diferença por arredondamento ou desconto pequeno, sem confundir R$97 com
 *  R$147. */
const TOLERANCIA_VALOR_REAIS = 1;

/**
 * ATENÇÃO — mapeamento de payload não confirmado contra um envio real.
 *
 * Este arquivo foi escrito a partir do padrão mais comum de integração com
 * a Kiwify (assinatura HMAC-SHA1 na query string `?signature=`, payload com
 * `order_status`/`Customer`/`Product` em algum formato aproximado disso),
 * mas NINGUÉM confirmou o formato exato contra um envio de teste real da
 * conta do usuário. Antes de confiar nisso em produção: disparar "Testar
 * Webhook" no painel da Kiwify (ou uma compra de teste) e conferir os logs
 * do Vercel para essa rota — `console.log('kiwify_webhook_payload_bruto', ...)`
 * abaixo grava o corpo inteiro de propósito, para isso ser possível sem
 * adivinhar.
 */

function assinaturaValida(payloadBruto: string, assinaturaRecebida: string | null): boolean {
  if (!webhookToken) return false;
  if (!assinaturaRecebida) return false;
  const esperada = crypto.createHmac('sha1', webhookToken).update(payloadBruto).digest('hex');
  const bufA = Buffer.from(esperada);
  const bufB = Buffer.from(assinaturaRecebida);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function extrairEmail(payload: any): string | null {
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
 * Tenta identificar qual dos nossos 2 planos corresponde ao produto
 * comprado, cruzando nome do produto e valor cobrado — heurística porque
 * não sabemos ainda o formato exato do identificador de produto que a
 * Kiwify manda no payload.
 */
function identificarPlano(payload: any): PlanoId | null {
  const nomeProduto: string = (
    payload?.Product?.product_name ||
    payload?.product?.product_name ||
    payload?.Product?.name ||
    payload?.product_name ||
    ''
  ).toLowerCase();

  if (nomeProduto.includes('mensal')) return 'mensal';
  if (nomeProduto.includes('30 dias') || nomeProduto.includes('único') || nomeProduto.includes('unico')) {
    return 'unico';
  }

  const valorCentavos: number | undefined =
    payload?.Commissions?.charge_amount ??
    payload?.charge_amount ??
    payload?.amount ??
    payload?.price;

  if (typeof valorCentavos === 'number') {
    // Aceita tanto reais quanto centavos, dependendo de como a Kiwify manda.
    const valorReais = valorCentavos > 1000 ? valorCentavos / 100 : valorCentavos;
    // Os preços vêm de `PLANOS`, não cravados aqui: eram dois números soltos
    // que precisavam ser lembrados junto com o painel da Kiwify e com o
    // valor mandado ao Meta.
    const porValor = Object.values(PLANOS).find(
      (plano) => Math.abs(valorReais - plano.precoReais) < TOLERANCIA_VALOR_REAIS
    );
    if (porValor) return porValor.id;
  }

  return null;
}

function normalizarStatus(payload: any): string {
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
function idDoPedido(payload: unknown, payloadBruto: string): string {
  const campos = payload as { order_id?: unknown; id?: unknown } | null | undefined;
  const id = campos?.order_id ?? campos?.id;
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

  let payload: any;
  try {
    payload = JSON.parse(payloadBruto);
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  // Gravado de propósito, para confirmar o formato real no primeiro envio.
  console.log('kiwify_webhook_payload_bruto', payloadBruto);

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
  payload: unknown;
  payloadBruto: string;
  email: string;
  userId: string | null;
}): Promise<NextResponse> {
  const planoId = identificarPlano(ctx.payload);
  const orderId = idDoPedido(ctx.payload, ctx.payloadBruto);

  if (ctx.userId && planoId) {
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

  // Sem conta (e-mail do checkout ≠ e-mail do cadastro) ou sem plano
  // identificável: vai para a fila, com o payload cru, para a pessoa poder
  // resgatar sozinha em /vincular-compra.
  await registrarCompraOrfa({
    orderId,
    email: ctx.email,
    planoId,
    payload: ctx.payload,
  });
  return NextResponse.json({ received: true });
}
