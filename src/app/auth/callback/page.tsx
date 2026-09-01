'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase, obterUsuarioSupabase } from '@/lib/supabase';
import { salvarUsuarioAtual, UsuarioSessao } from '@/lib/storage';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/nova-redacao';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function processAuth() {
      // 1. Checar se o Supabase redirecionou com erro na URL
      const queryError = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');

      if (queryError || errorDesc) {
        setStatus('error');
        setErrorMessage(
          errorDesc || queryError || 'Falha ao autenticar com o Google no servidor.'
        );
        return;
      }

      if (!supabase) {
        setStatus('error');
        setErrorMessage('Serviço de autenticação não configurado.');
        return;
      }

      try {
        // 2. Se houver código de autorização PKCE na URL, trocar pela sessão
        const code = searchParams.get('code');
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Erro ao trocar código por sessão:', error);
            setStatus('error');
            setErrorMessage(error.message);
            return;
          }
          if (data?.user) {
            await handleUserLogin(data.user);
            return;
          }
        }

        // 3. Obter a sessão atual do Supabase
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setStatus('error');
          setErrorMessage(error.message);
          return;
        }

        if (data?.session?.user) {
          await handleUserLogin(data.session.user);
          return;
        }

        // 4. Escutar mudança de estado de autenticação (OAuth hash token)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            await handleUserLogin(session.user);
          }
        });

        // Timeout de segurança se nada responder em 4 segundos
        const timer = setTimeout(() => {
          setStatus((prev) => {
            if (prev === 'loading') {
              setErrorMessage('Tempo limite atingido ao validar login. Tente novamente.');
              return 'error';
            }
            return prev;
          });
        }, 4000);

        return () => {
          clearTimeout(timer);
          authListener.subscription.unsubscribe();
        };
      } catch (err: any) {
        console.error('Erro no callback de autenticação:', err);
        setStatus('error');
        setErrorMessage(err?.message || 'Erro inesperado ao processar login.');
      }
    }

    async function handleUserLogin(user: any) {
      try {
        const userDb = await obterUsuarioSupabase(user.id);

        const usuarioSessao: UsuarioSessao = {
          id: user.id,
          nome:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'Estudante Google',
          email: user.email || '',
          plano: userDb?.plano || 'gratis',
          created_at: user.created_at || new Date().toISOString(),
        };

        salvarUsuarioAtual(usuarioSessao);
        setStatus('success');

        setTimeout(() => {
          router.push(redirectTarget);
        }, 500);
      } catch (err) {
        console.error('Erro ao registrar sessão:', err);
        setStatus('error');
        setErrorMessage('Erro ao sincronizar perfil do estudante.');
      }
    }

    processAuth();
  }, [redirectTarget, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#02040a] text-slate-100 p-4 font-sans relative">
      <div className="fixed inset-0 tech-grid-bg opacity-30 pointer-events-none" />
      <div className="tech-card max-w-sm w-full p-8 rounded-3xl border border-cyan-500/30 text-center space-y-4 shadow-2xl relative z-10">
        {status === 'loading' && (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <h2 className="font-heading text-lg font-bold text-white">Conectando sua Conta Google</h2>
            <p className="text-xs text-slate-400 font-sans">
              Autenticando credenciais e preparando seu ambiente de estudos...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
            <h2 className="font-heading text-lg font-bold text-white">Login Concluído!</h2>
            <p className="text-xs text-slate-300 font-sans">Redirecionando para o estúdio...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <h2 className="font-heading text-lg font-bold text-white">Falha na Conexão</h2>
            <p className="text-xs text-rose-300 font-sans leading-relaxed">{errorMessage}</p>
            <button
              type="button"
              onClick={() => router.push('/auth')}
              className="btn-cyber-primary w-full py-2.5 rounded-xl text-xs font-bold mt-2 cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#02040a] flex items-center justify-center text-cyan-400 text-xs">Carregando...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
