import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PLANOS, PlanoId } from '@/lib/planos';
import { ativarAssinatura } from '@/lib/ativar-assinatura';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook não configurado.' }, { status: 503 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Persistência não configurada.' }, { status: 503 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const signature = req.headers.get('stripe-signature');
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error('Assinatura ausente.');
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error('Assinatura do webhook do Stripe inválida:', err.message);
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const deviceId = session.client_reference_id || session.metadata?.device_id;
    const planoId = session.metadata?.plano_id as PlanoId | undefined;

    if (!deviceId || !planoId || !PLANOS[planoId]) {
      console.error('Webhook checkout.session.completed sem device_id/plano_id válidos:', session.id);
      return NextResponse.json({ received: true });
    }

    const resultado = await ativarAssinatura({ sessionId: session.id, deviceId, planoId });
    if (!resultado.sucesso) {
      return NextResponse.json({ error: resultado.erro }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
