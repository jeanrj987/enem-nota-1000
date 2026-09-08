import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Versão server-side de `temAcessoAtivo` (src/lib/assinatura.ts), usada para
 * decidir o que a API pode devolver ao navegador. Diferente da versão do
 * cliente, esta não depende de sessão no browser nem de RLS: consulta com
 * service role a partir de um user_id já validado pela rota.
 *
 * Sem persistência configurada ou em caso de erro, nega — o padrão é não
 * entregar conteúdo pago no escuro.
 */
export async function assinaturaAtivaDoUsuario(userId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const { data, error } = await supabaseAdmin
    .from('assinaturas')
    .select('expira_em')
    .eq('user_id', userId)
    .eq('status', 'ativa')
    .gt('expira_em', new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erro ao verificar assinatura no servidor:', error);
    return false;
  }

  return !!data;
}

/**
 * Teto absoluto de correções gratuitas por conta (não confundir com o rate
 * limit por IP em /api/corrigir, que é só uma janela deslizante e não impede
 * alguém de corrigir indefinidamente ao longo do tempo). Uma vez atingido,
 * a conta só corrige de novo assinando — é o que dá sustentação de custo ao
 * modelo freemium.
 */
export const LIMITE_CORRECOES_GRATUITAS = 3;

/**
 * Conta quantas redações essa conta já enviou no total (histórico completo,
 * não só enquanto free — mesmo quem já assinou e cancelou não "reseta" o
 * teto). Sem persistência configurada, nega por segurança: contar 0 deixaria
 * a conta corrigir de graça pra sempre se o banco cair.
 */
export async function contarCorrecoesDoUsuario(userId: string): Promise<number> {
  if (!supabaseAdmin) return LIMITE_CORRECOES_GRATUITAS;

  const { count, error } = await supabaseAdmin
    .from('redacoes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao contar redações do usuário:', error);
    return LIMITE_CORRECOES_GRATUITAS;
  }

  return count ?? 0;
}
