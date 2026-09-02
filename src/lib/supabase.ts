import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Redacao, Correcao, UsuarioSessao, RascunhoRedacao } from '@/types';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jzsudeviiosbhgkeljaf.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_Id8BqloLwBkESdoO-C6ZNw_uhAunIoI';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key'
);

// Singleton global para evitar múltiplas instâncias no Fast Refresh do Next.js
const globalForSupabase = globalThis as unknown as {
  supabaseInstance?: SupabaseClient | null;
};

export const supabase = isSupabaseConfigured
  ? (globalForSupabase.supabaseInstance ??= createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
        detectSessionInUrl: typeof window !== 'undefined',
      },
    }))
  : null;

// ==============================================================================
// SERVIÇOS DE REDAÇÕES & CORREÇÕES (ONLINE DATABASE)
// ==============================================================================

/**
 * Salva ou atualiza uma redação e sua respectiva correção no Supabase.
 */
export async function salvarRedacaoSupabase(
  redacao: Redacao,
  usuarioId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase não configurado' };

  try {
    const targetUserId = usuarioId || redacao.user_id || null;

    // Se houver um ID de usuário, garantir que o usuário exista na tabela 'usuarios'
    if (targetUserId) {
      try {
        await supabase.from('usuarios').upsert(
          {
            id: targetUserId,
            nome: 'Estudante ENEM',
            plano: 'gratis',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      } catch (userErr) {
        console.warn('[Supabase] Aviso ao registrar usuário automático:', userErr);
      }
    }

    // 1. Salvar ou atualizar a redação
    let { error: redacaoError } = await supabase
      .from('redacoes')
      .upsert({
        id: redacao.id,
        usuario_id: targetUserId,
        titulo: redacao.titulo || 'Sem Título',
        tema: redacao.tema,
        texto: redacao.texto,
        palavras_count: redacao.palavras_count || 0,
        linhas_count: redacao.linhas_count || 0,
        status: redacao.status,
        created_at: redacao.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    // Fallback de segurança: se falhar por chave estrangeira de usuário, salva sem vinculo de usuário
    if (redacaoError && redacaoError.code === '23503') {
      const retryResult = await supabase.from('redacoes').upsert({
        id: redacao.id,
        usuario_id: null,
        titulo: redacao.titulo || 'Sem Título',
        tema: redacao.tema,
        texto: redacao.texto,
        palavras_count: redacao.palavras_count || 0,
        linhas_count: redacao.linhas_count || 0,
        status: redacao.status,
        created_at: redacao.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      redacaoError = retryResult.error;
    }

    if (redacaoError) {
      console.error('[Supabase] Erro ao salvar redação:', redacaoError);
      return { success: false, error: redacaoError.message };
    }

    // 2. Se houver correção associada, salvar na tabela 'correcoes'
    if (redacao.correcao) {
      const c = redacao.correcao;
      const { error: correcaoError } = await supabase
        .from('correcoes')
        .upsert(
          {
            id: c.id || `cor_${redacao.id}`,
            redacao_id: redacao.id,
            nota_geral: c.nota_geral,
            c1: c.competencias?.[0]?.nota ?? 0,
            c2: c.competencias?.[1]?.nota ?? 0,
            c3: c.competencias?.[2]?.nota ?? 0,
            c4: c.competencias?.[3]?.nota ?? 0,
            c5: c.competencias?.[4]?.nota ?? 0,
            competencias: c.competencias || [],
            erros: c.erros || c.erros_identificados || [],
            versao_reescrita: c.versao_reescrita || '',
            feedback_pedagogico: c.feedback_pedagogico || '',
            pontos_positivos: c.pontos_positivos || c.pontos_fortes || [],
            proximos_passos: c.proximos_passos || c.pontos_melhoria || [],
            elementos_proposta_c5: c.elementos_proposta_c5 || null,
            analise_evolucao: c.analise_evolucao || null,
            tempo_analise_ms: c.tempo_analise_ms || 0,
            is_bloqueado: Boolean(c.is_bloqueado || c.nota_oculta),
            created_at: c.created_at || new Date().toISOString(),
          },
          { onConflict: 'redacao_id' }
        );

      if (correcaoError) {
        console.error('[Supabase] Erro ao salvar correção:', correcaoError);
        return { success: false, error: correcaoError.message };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Exceção ao salvar redação:', err);
    return { success: false, error: err?.message || 'Erro desconhecido' };
  }
}

/**
 * Busca todas as redações (e carrega suas correções) do Supabase.
 */
export async function buscarRedacoesSupabase(usuarioId?: string): Promise<Redacao[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('redacoes')
      .select('*, correcoes(*)')
      .order('created_at', { ascending: false });

    if (usuarioId) {
      query = query.eq('usuario_id', usuarioId);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('[Supabase] Erro ao buscar redações:', error);
      return [];
    }

    return data.map((item: any) => {
      const cor = Array.isArray(item.correcoes) ? item.correcoes[0] : item.correcoes;
      let correcaoObj: Correcao | undefined = undefined;

      if (cor) {
        correcaoObj = {
          id: cor.id,
          redacao_id: cor.redacao_id,
          nota_geral: cor.nota_geral,
          competencias: cor.competencias || [],
          erros: cor.erros || [],
          versao_reescrita: cor.versao_reescrita || '',
          feedback_pedagogico: cor.feedback_pedagogico || '',
          pontos_positivos: cor.pontos_positivos || [],
          proximos_passos: cor.proximos_passos || [],
          elementos_proposta_c5: cor.elementos_proposta_c5,
          analise_evolucao: cor.analise_evolucao,
          tempo_analise_ms: cor.tempo_analise_ms,
          is_bloqueado: cor.is_bloqueado,
          created_at: cor.created_at,
        };
      }

      return {
        id: item.id,
        user_id: item.usuario_id,
        titulo: item.titulo,
        tema: item.tema,
        texto: item.texto,
        palavras_count: item.palavras_count,
        linhas_count: item.linhas_count,
        status: item.status,
        created_at: item.created_at,
        correcao: correcaoObj,
      };
    });
  } catch (err) {
    console.error('[Supabase] Exceção ao buscar redações:', err);
    return [];
  }
}

/**
 * Busca uma redação específica por ID com sua correção no Supabase.
 */
export async function buscarRedacaoPorIdSupabase(id: string): Promise<Redacao | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('redacoes')
      .select('*, correcoes(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const cor = Array.isArray(data.correcoes) ? data.correcoes[0] : data.correcoes;
    let correcaoObj: Correcao | undefined = undefined;

    if (cor) {
      correcaoObj = {
        id: cor.id,
        redacao_id: cor.redacao_id,
        nota_geral: cor.nota_geral,
        competencias: cor.competencias || [],
        erros: cor.erros || [],
        versao_reescrita: cor.versao_reescrita || '',
        feedback_pedagogico: cor.feedback_pedagogico || '',
        pontos_positivos: cor.pontos_positivos || [],
        proximos_passos: cor.proximos_passos || [],
        elementos_proposta_c5: cor.elementos_proposta_c5,
        analise_evolucao: cor.analise_evolucao,
        tempo_analise_ms: cor.tempo_analise_ms,
        is_bloqueado: cor.is_bloqueado,
        created_at: cor.created_at,
      };
    }

    return {
      id: data.id,
      user_id: data.usuario_id,
      titulo: data.titulo,
      tema: data.tema,
      texto: data.texto,
      palavras_count: data.palavras_count,
      linhas_count: data.linhas_count,
      status: data.status,
      created_at: data.created_at,
      correcao: correcaoObj,
    };
  } catch {
    return null;
  }
}

/**
 * Exclui uma redação (e sua correção em cascata) do Supabase.
 */
export async function excluirRedacaoSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('redacoes').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// SERVIÇOS DE USUÁRIO & SESSÃO (ONLINE DATABASE)
// ==============================================================================

/**
 * Salva ou atualiza perfil de usuário no Supabase.
 */
export async function salvarUsuarioSupabase(usuario: UsuarioSessao): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('usuarios').upsert({
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      whatsapp: usuario.whatsapp || null,
      cidade: usuario.cidade || null,
      estado: usuario.estado || null,
      data_nascimento: usuario.data_nascimento || null,
      curso_sonho: usuario.curso_sonho || null,
      plano: usuario.plano,
      updated_at: new Date().toISOString(),
    });

    return !error;
  } catch {
    return false;
  }
}

/**
 * Busca dados de usuário por ID no Supabase.
 */
export async function obterUsuarioSupabase(id: string): Promise<UsuarioSessao | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      nome: data.nome,
      whatsapp: data.whatsapp || undefined,
      cidade: data.cidade || undefined,
      estado: data.estado || undefined,
      data_nascimento: data.data_nascimento || undefined,
      curso_sonho: data.curso_sonho || undefined,
      plano: data.plano,
      created_at: data.created_at,
    };
  } catch {
    return null;
  }
}

/**
 * Busca todos os leads capturados para o painel de vendas no X1.
 */
export async function obterTodosLeadsSupabase(): Promise<UsuarioSessao[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((u: any) => ({
      id: u.id,
      email: u.email,
      nome: u.nome,
      whatsapp: u.whatsapp || undefined,
      cidade: u.cidade || undefined,
      estado: u.estado || undefined,
      data_nascimento: u.data_nascimento || undefined,
      curso_sonho: u.curso_sonho || undefined,
      plano: u.plano,
      created_at: u.created_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Inicia o fluxo de autenticação com o Google via Supabase OAuth.
 */
export async function loginComGoogleSupabase(redirectTo?: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Serviço de autenticação não configurado.' };

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const callbackUrl = `${origin}/auth/callback${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  } catch (err: any) {
    return { error: err?.message || 'Erro ao iniciar login com Google.' };
  }
}

/**
 * Encerra a sessão do Supabase Auth.
 */
export async function logoutSupabase(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {}
}

// ==============================================================================
// SERVIÇOS DE RASCUNHO (AUTO-SAVE ONLINE)
// ==============================================================================

export async function salvarRascunhoSupabase(
  rascunho: RascunhoRedacao,
  usuarioId?: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const rascunhoId = usuarioId ? `draft_${usuarioId}` : 'draft_anonymous';
    const { error } = await supabase.from('rascunhos').upsert({
      id: rascunhoId,
      usuario_id: usuarioId || null,
      tema: rascunho.tema,
      titulo: rascunho.titulo,
      texto: rascunho.texto,
      updated_at: new Date().toISOString(),
    });

    return !error;
  } catch {
    return false;
  }
}

export async function obterRascunhoSupabase(usuarioId?: string): Promise<RascunhoRedacao | null> {
  if (!supabase) return null;

  try {
    const rascunhoId = usuarioId ? `draft_${usuarioId}` : 'draft_anonymous';
    const { data, error } = await supabase
      .from('rascunhos')
      .select('*')
      .eq('id', rascunhoId)
      .single();

    if (error || !data) return null;

    return {
      tema: data.tema || '',
      titulo: data.titulo || '',
      texto: data.texto || '',
      updated_at: data.updated_at || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
