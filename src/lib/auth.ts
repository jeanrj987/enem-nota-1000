import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

function exigirSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Autenticação não está configurada.');
  }
  return supabase;
}

export async function cadastrarComEmail(
  email: string,
  senha: string,
  perfil: {
    nomeCompleto: string;
    whatsapp: string;
    cidadeEstado: string;
    dataNascimento: string;
    cursoDosSonhos: string;
  }
) {
  const client = exigirSupabase();
  return client.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome_completo: perfil.nomeCompleto,
        whatsapp: perfil.whatsapp,
        cidade_estado: perfil.cidadeEstado,
        data_nascimento: perfil.dataNascimento,
        curso_dos_sonhos: perfil.cursoDosSonhos,
      },
    },
  });
}

export async function entrarComEmail(email: string, senha: string) {
  const client = exigirSupabase();
  return client.auth.signInWithPassword({ email, password: senha });
}

export async function entrarComGoogle() {
  const client = exigirSupabase();
  const redirectTo = `${window.location.origin}/auth/callback`;
  return client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
}

export async function sair() {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.auth.signOut();
}

export async function obterSessaoAtual(): Promise<Session | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function obterUsuarioAtual(): Promise<User | null> {
  const sessao = await obterSessaoAtual();
  return sessao?.user ?? null;
}
