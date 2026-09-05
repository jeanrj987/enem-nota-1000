import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
