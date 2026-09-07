'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * Destino do redirect do OAuth (Google). O cliente supabase-js já detecta o
 * `code`/token na própria URL e troca por sessão automaticamente
 * (detectSessionInUrl, padrão do SDK) — esta página só espera a sessão
 * aparecer e redireciona, sem precisar de troca manual no servidor.
 *
 * Manda para /nova-redacao (livre para qualquer usuário logado) e não para
 * /dashboard: o dashboard exige assinatura, então quem acabou de criar conta
 * seria rebatido direto para /vendas sem nunca ver que pode escrever uma
 * redação de graça.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    if (!supabase) {
      router.replace('/auth');
      return;
    }

    let cancelado = false;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelado) return;
      if (session) router.replace('/nova-redacao');
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelado) return;
      if (data.session) router.replace('/nova-redacao');
    });

    return () => {
      cancelado = true;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-papel">
      <Loader2 className="w-8 h-8 text-vermelho animate-spin" />
    </div>
  );
}
