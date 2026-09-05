import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Verifica se o usuário autenticado atual tem uma assinatura ativa e não
 * expirada. Sem Supabase configurado ou sem usuário logado, nega acesso por
 * padrão — nunca liberamos acesso "no escuro".
 */
export async function temAcessoAtivo(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return false;

  const { data, error } = await supabase
    .from('assinaturas')
    .select('expira_em')
    .eq('user_id', userId)
    .eq('status', 'ativa')
    .gt('expira_em', new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erro ao verificar assinatura:', error);
    return false;
  }

  return !!data;
}
