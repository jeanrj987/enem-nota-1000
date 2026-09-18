import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { salvarAtribuicao } from '@/lib/analytics/atribuicao-servidor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Guarda a atribuição de anúncio da pessoa logada, chamada no instante em que
 * ela clica para pagar e sai para a Kiwify — o último momento em que os
 * cookies `_fbc`/`_fbp` ainda estão ao nosso alcance.
 *
 * É deliberadamente "melhor esforço": responde 200 mesmo quando não consegue
 * gravar. Quem chama está de saída para o checkout, e um erro de medição não
 * pode, em hipótese alguma, atrapalhar uma compra.
 */

const corpoSchema = z.object({
  fbc: z.string().trim().max(255).nullish(),
  fbp: z.string().trim().max(255).nullish(),
});

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token || !supabaseAdmin) return NextResponse.json({ registrado: false });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ registrado: false });

  let corpo: z.infer<typeof corpoSchema>;
  try {
    corpo = corpoSchema.parse(await req.json());
  } catch (erro) {
    console.warn('Payload de atribuição inválido:', erro);
    return NextResponse.json({ registrado: false });
  }

  const { sucesso } = await salvarAtribuicao(userData.user.id, {
    fbc: corpo.fbc ?? null,
    fbp: corpo.fbp ?? null,
    // O Meta exige que o user agent do evento de servidor seja o do
    // navegador da pessoa, não o do nosso servidor — é parte do que ele usa
    // para casar o evento com o usuário do Facebook.
    userAgent: req.headers.get('user-agent'),
  });

  return NextResponse.json({ registrado: sucesso });
}
