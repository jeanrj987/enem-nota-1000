import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checarRateLimit, obterIpCliente } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { vincularCompraOrfa } from '@/lib/compras-orfas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Limite deliberadamente baixo. Esta rota libera acesso PAGO mediante acerto
 * de um código de pedido — ou seja, é adivinhável por força bruta se deixar.
 * 5 tentativas por hora torna a busca cega inviável sem atrapalhar quem está
 * só conferindo se digitou o código certo.
 */
const LIMITE_TENTATIVAS = 5;
const JANELA_TENTATIVAS_MS = 60 * 60 * 1000;

const corpoSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail usado na compra.').email('E-mail inválido.'),
  codigoPedido: z.string().trim().min(1, 'Informe o código do pedido.').max(200),
});

/** Mensagem única para "pedido não existe" e "e-mail não bate": distinguir os
 *  dois diria a um estranho quais códigos de pedido são válidos. */
const NAO_ENCONTRADA =
  'Não encontramos uma compra com esse código e e-mail. Confira os dois no e-mail de confirmação que a Kiwify enviou — o código costuma aparecer como "Pedido" ou "ID da compra".';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json(
      { error: 'Entre na sua conta para vincular uma compra.' },
      { status: 401 }
    );
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Serviço indisponível no momento.' }, { status: 503 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Sessão inválida. Faça login novamente.' }, { status: 401 });
  }

  // Por usuário, com o IP como reserva: quem quiser martelar precisa criar
  // contas, e conta criada deixa rastro.
  const rate = checarRateLimit(
    `vincular:${userData.user.id || obterIpCliente(req)}`,
    LIMITE_TENTATIVAS,
    JANELA_TENTATIVAS_MS
  );
  if (!rate.permitido) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde uma hora e tente de novo, ou fale com o suporte.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.resetEm - Date.now()) / 1000)) } }
    );
  }

  let corpo: z.infer<typeof corpoSchema>;
  try {
    corpo = corpoSchema.parse(await req.json());
  } catch (erro) {
    const mensagem =
      erro instanceof z.ZodError ? erro.issues[0]?.message : 'Dados inválidos.';
    return NextResponse.json({ error: mensagem ?? 'Dados inválidos.' }, { status: 400 });
  }

  const resultado = await vincularCompraOrfa({
    orderId: corpo.codigoPedido,
    email: corpo.email,
    userId: userData.user.id,
  });

  return respostaPara(resultado, userData.user.id);
}

function respostaPara(
  resultado: Awaited<ReturnType<typeof vincularCompraOrfa>>,
  userId: string
): NextResponse {
  switch (resultado.tipo) {
    case 'vinculada':
      return NextResponse.json({ sucesso: true, planoId: resultado.planoId });

    case 'ja_vinculada':
      return NextResponse.json(
        { error: 'Essa compra já foi vinculada a uma conta. Se não foi você, fale com o suporte.' },
        { status: 409 }
      );

    case 'exige_resgate_manual':
      // A compra existe e é da pessoa, mas o webhook não identificou qual
      // produto foi comprado. Liberar um plano no chute entregaria prazo
      // errado — e prazo a menos é reclamação justa.
      console.error(
        JSON.stringify({ evento: 'compra_orfa_resgate_manual', user_id: userId })
      );
      return NextResponse.json(
        {
          error:
            'Encontramos sua compra, mas não conseguimos identificar o plano automaticamente. Já avisamos nossa equipe — seu acesso será liberado manualmente.',
        },
        { status: 409 }
      );

    case 'nao_encontrada':
      return NextResponse.json({ error: NAO_ENCONTRADA }, { status: 404 });

    case 'erro':
      return NextResponse.json({ error: resultado.mensagem }, { status: 500 });
  }
}
