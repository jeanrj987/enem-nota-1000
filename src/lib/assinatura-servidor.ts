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
