import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PLANOS, PlanoId } from '@/lib/planos';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(req: NextRequest) {
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: 'Pagamento não está configurado no momento.' },
      { status: 503 }
    );
  }

  try {
    const { planoId, deviceId } = (await req.json()) as { planoId?: PlanoId; deviceId?: string };

    if (!planoId || !PLANOS[planoId]) {
      return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
    }
    if (!deviceId || typeof deviceId !== 'string') {
      return NextResponse.json({ error: 'device_id ausente.' }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const plano = PLANOS[planoId];
    const origin = req.headers.get('origin') || new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: plano.stripePriceId, quantity: 1 }],
      client_reference_id: deviceId,
      metadata: { plano_id: plano.id, device_id: deviceId },
      success_url: `${origin}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/vendas`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error);
    return NextResponse.json({ error: 'Não foi possível iniciar o pagamento.' }, { status: 500 });
  }
}
