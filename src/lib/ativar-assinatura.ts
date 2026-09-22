import { supabaseAdmin } from '@/lib/supabase-admin';
import { PLANOS, PlanoId } from '@/lib/planos';

/**
 * Acesso vitalício não tem data de fim, mas as consultas de acesso e a policy
 * de RLS (`expira_em > now()`) tratam `null` como "sem acesso". Por isso o
 * plano vitalício grava uma data-sentinela bem distante em vez de `null`.
 */
const EXPIRACAO_VITALICIA = '2099-12-31T23:59:59.000Z';
const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Ativa uma assinatura no Supabase a partir de um pagamento já confirmado
 * como pago pelo gateway (hoje: webhook da Kiwify, evento "compra
 * aprovada"). `sessionId` é qualquer identificador único da transação (o
 * `order_id` da Kiwify) — usado como chave primária, então chamar de novo
 * para o mesmo id só sobrescreve com os mesmos dados (idempotente, protege
 * contra reentrega do mesmo webhook).
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
  const expiraEm =
    diasDeAcesso === null
      ? EXPIRACAO_VITALICIA
      : new Date(Date.now() + diasDeAcesso * MS_POR_DIA).toISOString();

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

/**
 * Revoga o acesso na hora — usada pelo webhook da Kiwify nos eventos de
 * reembolso, chargeback, assinatura cancelada e cobrança de renovação
 * atrasada. Marca todas as assinaturas ATIVAS do usuário com o motivo
 * (vira o novo `status`, então `assinaturaAtivaDoUsuario` para de
 * considerá-las ativas) e zera `expira_em` para agora, para não deixar
 * acesso pago esperando a data antiga expirar sozinha.
 */
export async function revogarAssinatura(
  userId: string,
  motivo: 'cancelada' | 'reembolsada' | 'chargeback' | 'atrasada'
): Promise<{ sucesso: boolean; erro?: string }> {
  if (!supabaseAdmin) {
    return { sucesso: false, erro: 'Persistência não configurada.' };
  }

  const { error } = await supabaseAdmin
    .from('assinaturas')
    .update({ status: motivo, expira_em: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'ativa');

  if (error) {
    console.error('Erro ao revogar assinatura no Supabase:', error);
    return { sucesso: false, erro: 'Falha ao revogar assinatura.' };
  }

  console.log(JSON.stringify({ evento: 'assinatura_revogada', user_id: userId, motivo }));
  return { sucesso: true };
}
