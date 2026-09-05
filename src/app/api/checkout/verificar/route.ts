import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ativarAssinatura } from '@/lib/ativar-assinatura';
import { PlanoId } from '@/lib/planos';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

/**
 * Verificação síncrona de pagamento a partir do redirect de sucesso do
 * Stripe. Existe porque webhooks não chegam em localhost (o Stripe não
 * alcança a máquina de dev) e, em produção, porque webhooks podem atrasar
 * ou falhar — consultar a Checkout Session diretamente pelo session_id é a
 * verificação recomendada pelo próprio Stripe para o fluxo de sucesso,
 * complementar ao webhook (que continua sendo a fonte de verdade
 * assíncrona). Idempotente: pode ser chamada várias vezes para a mesma
 * sessão sem duplicar nada.
 */
export async function POST(req: NextRequest) {
  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'Pagamento não está configurado.' }, { status: 503 });
  }

  try {
    const { sessionId } = (await req.json()) as { sessionId?: string };
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id ausente.' }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ ativo: false });
    }

    const deviceId = session.client_reference_id || session.metadata?.device_id;
    const planoId = session.metadata?.plano_id as PlanoId | undefined;

    if (!deviceId || !planoId) {
      return NextResponse.json({ error: 'Sessão sem device_id/plano_id.' }, { status: 400 });
    }

    const resultado = await ativarAssinatura({ sessionId: session.id, deviceId, planoId });
    if (!resultado.sucesso) {
      return NextResponse.json({ error: resultado.erro }, { status: 500 });
    }

    return NextResponse.json({ ativo: true });
  } catch (error: any) {
    console.error('Erro ao verificar sessão de checkout:', error);
    return NextResponse.json({ error: 'Não foi possível verificar o pagamento.' }, { status: 500 });
  }
}
