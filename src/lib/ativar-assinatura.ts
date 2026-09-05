import { supabaseAdmin } from '@/lib/supabase-admin';
import { PLANOS, PlanoId } from '@/lib/planos';

/**
 * Ativa uma assinatura no Supabase a partir dos dados de uma Checkout
 * Session já confirmada como paga. Compartilhado entre o webhook do Stripe
 * (fonte de verdade em produção) e a verificação síncrona no redirect de
 * sucesso (necessária em dev, já que o Stripe não alcança localhost, e
 * também como reforço em produção contra webhooks atrasados/perdidos —
 * prática recomendada pelo próprio Stripe). Idempotente: chamar de novo
 * para a mesma session_id só sobrescreve com os mesmos dados.
 */
export async function ativarAssinatura(params: {
  sessionId: string;
  userId: string;
  planoId: PlanoId;
}): Promise<{ sucesso: boolean; erro?: string }> {
  if (!supabaseAdmin) {
    return { sucesso: false, erro: 'Persistência não configurada.' };
  }
  if (!PLANOS[params.planoId]) {
    return { sucesso: false, erro: 'Plano inválido.' };
  }

  const diasDeAcesso = PLANOS[params.planoId].diasDeAcesso;
  const expiraEm = new Date(Date.now() + diasDeAcesso * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin.from('assinaturas').upsert({
    id: params.sessionId,
    user_id: params.userId,
    plano_id: params.planoId,
    status: 'ativa',
    expira_em: expiraEm,
  });

  if (error) {
    console.error('Erro ao ativar assinatura no Supabase:', error);
    return { sucesso: false, erro: 'Falha ao registrar assinatura.' };
  }

  console.log(
    JSON.stringify({ evento: 'assinatura_ativada', user_id: params.userId, plano_id: params.planoId, expira_em: expiraEm })
  );
  return { sucesso: true };
}
