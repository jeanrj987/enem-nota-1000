import { LIMITE_CORRECOES_GRATUITAS } from '@/lib/limites';
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
 * Reexportado de `limites.ts`, onde o valor de fato mora.
 *
 * Mudou de lugar porque a landing precisa do mesmo número e não pode
 * importar deste arquivo: aqui dentro vem `supabase-admin`, com a service
 * role key, que não pode ir para o bundle do navegador. O reexport mantém
 * funcionando quem já importava daqui.
 */
export { LIMITE_CORRECOES_GRATUITAS };

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
