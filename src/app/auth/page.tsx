'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cpu,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { salvarUsuarioAtual, isUsuarioMaster, UsuarioSessao } from '@/lib/storage';
import { loginComGoogleSupabase } from '@/lib/supabase';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/nova-redacao';

  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setMessage(null);

    const res = await loginComGoogleSupabase(redirectTarget);
    if (res.error) {
      setGoogleLoading(false);
      setMessage({
        type: 'error',
        text: res.error,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    setTimeout(() => {
      setLoading(false);
      const userEmail = email.trim().toLowerCase();
      const isMaster = isUsuarioMaster(userEmail);

      const novoUsuario: UsuarioSessao = {
        id: isMaster
          ? (userEmail.includes('admin') ? 'usr_admin_master' : 'usr_master_enem')
          : 'usr_' + Date.now(),
        nome: isMaster
          ? (userEmail.includes('admin') ? 'Administrador Master' : 'Coordenação Master')
          : (nome.trim() || (isLogin ? 'Estudante' : 'Novo Estudante')),
        email: userEmail || 'estudante@enem.pro',
        plano: isMaster ? 'pro' : 'gratis', // Master sempre tem plano PRO
        created_at: new Date().toISOString(),
      };

      salvarUsuarioAtual(novoUsuario);

      setMessage({
        type: 'success',
        text: isMaster
          ? 'Login Master Autenticado (Acesso 100% Liberado)! Redirecionando...'
          : isLogin
          ? 'Login efetuado com sucesso! Redirecionando...'
          : 'Conta criada com sucesso! Redirecionando...',
      });

      setTimeout(() => {
        router.push(redirectTarget);
      }, 500);
    }, 400);
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 p-0.5 mx-auto shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#030612] rounded-[14px] flex items-center justify-center">
              <Cpu className="w-6 h-6 text-cyan-400" />
            </div>
          </div>

          <h1 className="font-heading text-2xl font-extrabold text-white">
            {isLogin ? 'Entrar na sua Conta' : 'Criar Conta de Estudante'}
          </h1>
          <p className="text-xs text-slate-300 font-sans">
            {isLogin
              ? 'Acesse seu histórico de redações e suas métricas'
              : 'Cadastre-se para liberar o estúdio oficial do ENEM'}
          </p>
        </div>

        <div className="tech-card p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-5">
          
          {/* Botão Oficial Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 rounded-2xl bg-white text-slate-900 font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-slate-100 transition-all shadow-xl hover:shadow-cyan-500/10 cursor-pointer disabled:opacity-50 border border-slate-200 group active:scale-[0.98]"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                <span>Conectando ao Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLogin ? 'Entrar com o Google' : 'Cadastrar com o Google'}</span>
              </>
            )}
          </button>

          {/* Divisor */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/[0.08] w-full" />
            <span className="bg-[#030612] px-3 text-[10px] uppercase font-mono text-slate-400 shrink-0">
              ou continue com e-mail
            </span>
            <div className="border-t border-white/[0.08] w-full" />
          </div>

          {/* Tabs Login vs Cadastro */}
          <div className="flex p-1 bg-[#030612] rounded-xl border border-cyan-500/25">
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isLogin
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              NOVA CONTA
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isLogin
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              JÁ TENHO CONTA
            </button>
          </div>

          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-cyan-300 uppercase tracking-wide">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ana Clara Medeiros"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-[#030612] border border-cyan-500/25 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-cyan-300 uppercase tracking-wide">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="estudante@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#030612] border border-cyan-500/25 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-cyan-300 uppercase tracking-wide">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-[#030612] border border-cyan-500/25 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cyber-primary w-full py-3.5 rounded-xl font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'ENTRAR COM E-MAIL' : 'CRIAR CONTA COM E-MAIL'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#02040a] text-slate-100 font-sans selection:bg-cyan-400 selection:text-black relative">
      <div className="fixed inset-0 tech-grid-bg opacity-30 pointer-events-none z-0" />
      <Navbar />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-cyan-400">Carregando...</div>}>
        <AuthContent />
      </Suspense>
      <Footer />
    </div>
  );
}
