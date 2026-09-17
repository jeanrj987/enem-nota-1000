import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export interface Perfil {
  nome_completo: string | null;
  whatsapp: string | null;
  cidade_estado: string | null;
  data_nascimento: string | null;
  curso_dos_sonhos: string | null;
}

export interface DadosCadastroPerfil {
  nomeCompleto: string;
  whatsapp: string;
  cidadeEstado: string;
  dataNascimento: string;
  cursoDosSonhos: string;
}

/** Nenhum campo do perfil é opcional — usado tanto no cadastro quanto para
 * decidir se um login via Google precisa completar o cadastro antes de
 * acessar o corretor. */
export function perfilCompleto(perfil: Perfil | null): boolean {
  if (!perfil) return false;
  return Boolean(
    perfil.nome_completo?.trim() &&
      perfil.whatsapp?.trim() &&
      perfil.cidade_estado?.trim() &&
      perfil.data_nascimento?.trim() &&
      perfil.curso_dos_sonhos?.trim()
  );
}

export async function buscarPerfil(userId: string): Promise<Perfil | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from('perfis').select('*').eq('user_id', userId).maybeSingle();
  if (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }
  return data;
}

/**
 * Busca o user_id a partir do e-mail — usada pelo webhook da Kiwify, que só
 * nos dá o e-mail de quem comprou, não o user_id. Roda com service role (sem
 * sessão de usuário no contexto de um webhook). `email` fica gravado em
 * `perfis` desde o cadastro (trigger `handle_new_user`); ver
 * `schema-perfis-email.sql` para quem já tinha conta antes dessa coluna
 * existir.
 */
export async function buscarUserIdPorEmail(email: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from('perfis')
    .select('user_id')
    .ilike('email', email.trim())
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar usuário por e-mail:', error);
    return null;
  }
  return data?.user_id ?? null;
}

export async function salvarPerfil(userId: string, dados: DadosCadastroPerfil): Promise<{ sucesso: boolean; erro?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { sucesso: false, erro: 'Persistência não configurada.' };
  }
  const { error } = await supabase.from('perfis').upsert({
    user_id: userId,
    nome_completo: dados.nomeCompleto,
    whatsapp: dados.whatsapp,
    cidade_estado: dados.cidadeEstado,
    data_nascimento: dados.dataNascimento,
    curso_dos_sonhos: dados.cursoDosSonhos,
  });
  if (error) {
    console.error('Erro ao salvar perfil:', error);
    return { sucesso: false, erro: 'Não foi possível salvar seu perfil.' };
  }
  return { sucesso: true };
}
