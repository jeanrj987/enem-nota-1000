import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PlanoId } from '@/lib/planos';
import { ativarAssinatura, revogarAssinatura } from '@/lib/ativar-assinatura';
import { buscarUserIdPorEmail } from '@/lib/perfil';

const webhookToken = process.env.KIWIFY_WEBHOOK_TOKEN;

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
  if (nomeProduto.includes('40 dias') || nomeProduto.includes('único') || nomeProduto.includes('unico')) {
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
    if (Math.abs(valorReais - 97) < 1) return 'mensal';
    if (Math.abs(valorReais - 147) < 1) return 'unico';
  }

  return null;
}

function normalizarStatus(payload: any): string {
  return String(
    payload?.order_status || payload?.webhook_event_type || payload?.status || ''
  ).toLowerCase();
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
  const orderId: string | undefined = payload?.order_id || payload?.id;

  if (!email) {
    console.error('Webhook da Kiwify sem e-mail de comprador identificável:', payloadBruto);
    return NextResponse.json({ received: true });
  }

  const userId = await buscarUserIdPorEmail(email);
  if (!userId) {
    // Não é erro nosso: a compra pode ter sido feita com um e-mail diferente
    // do cadastro. Fica registrado no painel da Kiwify para ativação manual
    // se o aluno reclamar de não ter recebido acesso.
    console.error(`Webhook da Kiwify: nenhuma conta encontrada para o e-mail ${email}.`);
    return NextResponse.json({ received: true });
  }

  const ehAprovacao = status.includes('paid') || status.includes('approved') || status.includes('aprovad');
  const ehReembolso = status.includes('refund') || status.includes('reembols');
  const ehChargeback = status.includes('chargeback');
  const ehCancelamento = status.includes('cancel');
  const ehAtraso = status.includes('late') || status.includes('atras');

  if (ehAprovacao) {
    const planoId = identificarPlano(payload);
    if (!planoId || !orderId) {
      console.error('Webhook da Kiwify aprovado, mas plano ou order_id não identificados:', payloadBruto);
      return NextResponse.json({ received: true });
    }
    const resultado = await ativarAssinatura({ sessionId: orderId, userId, planoId });
    if (!resultado.sucesso) {
      return NextResponse.json({ error: resultado.erro }, { status: 500 });
    }
  } else if (ehReembolso) {
    await revogarAssinatura(userId, 'reembolsada');
  } else if (ehChargeback) {
    await revogarAssinatura(userId, 'chargeback');
  } else if (ehCancelamento) {
    await revogarAssinatura(userId, 'cancelada');
  } else if (ehAtraso) {
    await revogarAssinatura(userId, 'atrasada');
  }

  return NextResponse.json({ received: true });
}
