'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextValue {
  usuario: User | null;
  carregando: boolean;
}

const AuthContext = createContext<AuthContextValue>({ usuario: null, carregando: true });

/**
 * Fonte única da sessão do usuário no app inteiro. Lê a sessão persistida
 * pelo supabase-js (localStorage) na montagem e escuta mudanças (login,
 * logout, refresh de token) via onAuthStateChange.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setCarregando(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUsuario(data.session?.user ?? null);
      setCarregando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ usuario, carregando }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
