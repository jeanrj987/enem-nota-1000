import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Leitura e escrita da atribuição de anúncio guardada por usuário.
 * Ver `supabase/schema-atribuicao.sql` para o motivo de ela precisar existir.
 */

export interface AtribuicaoGuardada {
  fbc: string | null;
  fbp: string | null;
  userAgent: string | null;
}

export async function salvarAtribuicao(
  userId: string,
  dados: AtribuicaoGuardada
): Promise<{ sucesso: boolean }> {
  if (!supabaseAdmin) return { sucesso: false };

  // Nada a guardar: sem `fbc` nem `fbp`, a linha não ajudaria a atribuir nada
  // e só sobrescreveria uma atribuição anterior possivelmente boa — o caso de
  // quem clicou no anúncio ontem, voltou direto hoje e comprou.
  if (!dados.fbc && !dados.fbp) return { sucesso: true };

  const { error } = await supabaseAdmin.from('atribuicao_anuncio').upsert({
    user_id: userId,
    fbc: dados.fbc,
    fbp: dados.fbp,
    user_agent: dados.userAgent,
    atualizado_em: new Date().toISOString(),
  });

  if (error) {
    console.error('Erro ao salvar atribuição de anúncio:', { user_id: userId, erro: error.message });
    return { sucesso: false };
  }
  return { sucesso: true };
}

export async function buscarAtribuicao(userId: string): Promise<AtribuicaoGuardada | null> {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from('atribuicao_anuncio')
    .select('fbc, fbp, user_agent')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar atribuição de anúncio:', { user_id: userId, erro: error.message });
    return null;
  }
  if (!data) return null;

  return { fbc: data.fbc, fbp: data.fbp, userAgent: data.user_agent };
}
