import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PLANOS, PlanoId } from '@/lib/planos';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(req: NextRequest) {
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: 'Pagamento não está configurado no momento.' },
      { status: 503 }
    );
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Autenticação não está configurada.' }, { status: 503 });
  }

  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'É necessário estar logado para comprar.' }, { status: 401 });
    }
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Sessão inválida. Faça login novamente.' }, { status: 401 });
    }
    const userId = userData.user.id;

    const { planoId } = (await req.json()) as { planoId?: PlanoId };
    if (!planoId || !PLANOS[planoId]) {
      return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const plano = PLANOS[planoId];
    const origin = req.headers.get('origin') || new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: plano.stripePriceId, quantity: 1 }],
      client_reference_id: userId,
      metadata: { plano_id: plano.id, user_id: userId },
      success_url: `${origin}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/vendas`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error);
    return NextResponse.json({ error: 'Não foi possível iniciar o pagamento.' }, { status: 500 });
  }
}
