import { supabaseAdmin } from '@/lib/supabase-admin';
import { PlanoId, PLANOS } from '@/lib/planos';
import { ativarAssinatura } from '@/lib/ativar-assinatura';
import { registrarCompraNoMeta } from '@/lib/analytics/compra';

/**
 * Compra aprovada e cobrada pela Kiwify que não encontrou conta para
 * liberar — porque o e-mail do checkout é editável e nem sempre é o do
 * cadastro (ver supabase/schema-compras-orfas.sql para o caso completo).
 *
 * Antes daqui, esse cenário terminava num `console.error`. O prejuízo não
 * era o log perdido: era não existir nenhum caminho de volta. A pessoa
 * pagou, não recebeu acesso, e só descobriria abrindo um chamado.
 */

/** Compara e-mails do jeito que gente digita: sobra de espaço e CAIXA ALTA
 *  no teclado do celular não podem custar o acesso de quem pagou. */
function mesmoEmail(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Registra a compra sem dono. Idempotente pelo `order_id`: a Kiwify reentrega
 * webhook, e reentrega não pode gerar linha duplicada na fila nem
 * ressuscitar uma compra que já foi vinculada — por isso o upsert só
 * carimba `status` na inserção, e `ignoreDuplicates` protege o que já mudou
 * de estado.
 */
export async function registrarCompraOrfa(params: {
  orderId: string;
  email: string;
  planoId: PlanoId | null;
  payload: unknown;
}): Promise<{ sucesso: boolean; erro?: string }> {
  if (!supabaseAdmin) {
    return { sucesso: false, erro: 'Persistência não configurada.' };
  }

  const { error } = await supabaseAdmin.from('compras_orfas').upsert(
    {
      id: params.orderId,
      email: params.email.trim(),
      plano_id: params.planoId,
      status: 'pendente',
      payload: params.payload as never,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  if (error) {
    // Falhar aqui é grave e silencioso: a compra some da fila e ninguém
    // fica sabendo. Fica gritante no log, com o pedido e o e-mail, para dar
    // para resgatar na mão pelo painel da Kiwify.
    console.error('Erro ao registrar compra órfã:', {
      order_id: params.orderId,
      email: params.email,
      erro: error.message,
    });
    return { sucesso: false, erro: 'Falha ao registrar compra órfã.' };
  }

  console.error(
    JSON.stringify({
      evento: 'compra_orfa_registrada',
      order_id: params.orderId,
      email: params.email,
      plano_id: params.planoId,
      alerta: 'Pagamento confirmado sem conta correspondente — acesso NÃO liberado.',
    })
  );
  return { sucesso: true };
}

export type ResultadoVinculacao =
  | { tipo: 'vinculada'; planoId: PlanoId }
  | { tipo: 'nao_encontrada' }
  | { tipo: 'ja_vinculada' }
  | { tipo: 'exige_resgate_manual' }
  | { tipo: 'erro'; mensagem: string };

/**
 * Vincula uma compra órfã à conta logada e libera o acesso na hora.
 *
 * Exige `orderId` **e** `email` batendo com a mesma linha. O `orderId` é a
 * prova de posse: ele chega no e-mail de confirmação da Kiwify, quem não
 * comprou não tem como adivinhar. Sem essa exigência, bastaria uma conta
 * grátis e um chute de e-mail para roubar o acesso pago de outra pessoa —
 * e a tabela viraria um oráculo de "esse e-mail comprou?".
 *
 * Por isso também: pedido inexistente e e-mail que não bate devolvem o
 * MESMO resultado. Distinguir os dois na resposta entregaria de graça a
 * confirmação de quais pedidos existem.
 */
export async function vincularCompraOrfa(params: {
  orderId: string;
  email: string;
  userId: string;
}): Promise<ResultadoVinculacao> {
  if (!supabaseAdmin) {
    return { tipo: 'erro', mensagem: 'Persistência não configurada.' };
  }

  const { data, error } = await supabaseAdmin
    .from('compras_orfas')
    .select('id, email, plano_id, status')
    .eq('id', params.orderId.trim())
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar compra órfã:', { order_id: params.orderId, erro: error.message });
    return { tipo: 'erro', mensagem: 'Falha ao consultar a compra.' };
  }

  if (!data || !mesmoEmail(data.email, params.email)) {
    return { tipo: 'nao_encontrada' };
  }
  if (data.status === 'vinculada') {
    return { tipo: 'ja_vinculada' };
  }

  const planoId = data.plano_id as PlanoId | null;
  if (!planoId || !PLANOS[planoId]) {
    // O webhook não conseguiu identificar o produto. Liberar "algum" plano
    // no chute daria acesso errado — e errar para menos é tão ruim quanto
    // errar para mais. Vai para resgate manual, com a compra preservada.
    return { tipo: 'exige_resgate_manual' };
  }

  const ativacao = await ativarAssinatura({
    sessionId: data.id,
    userId: params.userId,
    planoId,
  });
  if (!ativacao.sucesso) {
    return { tipo: 'erro', mensagem: ativacao.erro ?? 'Falha ao liberar o acesso.' };
  }

  // A marcação vem DEPOIS da ativação, de propósito. Se o update falhar
  // aqui, a pessoa já está com o acesso liberado e a linha continua
  // pendente — alguém vê de novo na fila e confere. O inverso (marcar antes
  // e a ativação falhar) apagaria da fila uma compra que ficou sem acesso.
  const { error: erroUpdate } = await supabaseAdmin
    .from('compras_orfas')
    .update({ status: 'vinculada', user_id: params.userId, vinculada_em: new Date().toISOString() })
    .eq('id', data.id);

  if (erroUpdate) {
    console.error('Compra órfã ativada, mas não marcada como vinculada:', {
      order_id: data.id,
      user_id: params.userId,
      erro: erroUpdate.message,
    });
  }

  // A venda existiu de verdade, então precisa chegar ao Meta — senão fica de
  // fora do cálculo de retorno da campanha que a gerou. O `event_id` deriva
  // do pedido, então se o webhook já tiver reportado esta mesma compra, o
  // Meta deduplica em vez de contar duas.
  await registrarCompraNoMeta({
    orderId: data.id,
    userId: params.userId,
    planoId,
    email: data.email,
  });

  console.log(
    JSON.stringify({
      evento: 'compra_orfa_vinculada',
      order_id: data.id,
      user_id: params.userId,
      plano_id: planoId,
    })
  );
  return { tipo: 'vinculada', planoId };
}
