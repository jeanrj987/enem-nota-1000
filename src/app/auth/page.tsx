'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Phone,
  MapPin,
  Calendar,
  Award,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { cadastrarComEmail, entrarComEmail, entrarComGoogle } from '@/lib/auth';
import { rastrearCadastro } from '@/lib/analytics/eventos-cliente';
import { isSupabaseConfigured } from '@/lib/supabase';
import { destinoSeguro, guardarDestino } from '@/lib/redirecionamento';
import { formatarWhatsapp, normalizarWhatsapp, validarWhatsapp } from '@/lib/whatsapp';

function AuthPageConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // De onde a pessoa veio. Quem chega pela navbar não traz nada e cai no
  // padrão; quem clicou em "Assinar" na home volta para lá depois de
  // entrar, em vez de ser despejado no editor e perder a compra.
  const destino = destinoSeguro(searchParams.get('redirect'));
  const { usuario, carregando } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [erroWhatsapp, setErroWhatsapp] = useState<string | null>(null);
  const [cidadeEstado, setCidadeEstado] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cursoDosSonhos, setCursoDosSonhos] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!carregando && usuario) {
      router.replace(destino);
    }
  }, [carregando, usuario, router, destino]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await entrarComEmail(email, senha);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Login efetuado com sucesso! Redirecionando...' });
        setTimeout(() => router.push(destino), 800);
        return;
      }

      // A máscara formata, mas não recusa: quem colar um número torto chega
      // até aqui. Este é o último ponto antes de o lead entrar na lista.
      const problemaWhatsapp = validarWhatsapp(whatsapp);
      if (problemaWhatsapp) {
        setErroWhatsapp(problemaWhatsapp);
        setMessage({ type: 'error', text: problemaWhatsapp });
        return;
      }

      const { data, error } = await cadastrarComEmail(email, senha, {
        nomeCompleto,
        whatsapp: normalizarWhatsapp(whatsapp),
        cidadeEstado,
        dataNascimento,
        cursoDosSonhos,
      });
      if (error) throw error;

      // O cadastro só devolve sessão quando a confirmação de e-mail está
      // desligada no Supabase — que é a configuração pretendida: o e-mail é
      // campo obrigatório, não etapa de verificação. Ainda assim a tela
      // verifica em vez de redirecionar às cegas: se a confirmação for
      // religada algum dia, a pessoa fica aqui lendo a instrução em vez de
      // ser jogada deslogada na página seguinte e ricocheteada de volta.
      if (data.session) {
        // Conta criada é o "lead" real deste funil — é a etapa entre visitar
        // a landing e comprar. Sem ela medida, não dá para saber se o anúncio
        // traz gente errada ou se o cadastro é que está travando.
        rastrearCadastro('email');
        setMessage({ type: 'success', text: 'Conta criada! Redirecionando...' });
        setTimeout(() => router.push(destino), 800);
        return;
      }

      setMessage({
        type: 'success',
        text: 'Conta criada! Confirme o cadastro pelo link enviado ao seu e-mail e depois entre por aqui.',
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Não foi possível concluir a operação.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setMessage(null);
    setLoadingGoogle(true);
    try {
      // O Google leva o navegador para fora e traz de volta em /auth/callback,
      // sem a query string. Guardar antes de sair é o que faz o destino
      // sobreviver à viagem.
      guardarDestino(destino);
      const { error } = await entrarComGoogle();
      if (error) throw error;
      // navegador é redirecionado para o Google — não há mais o que fazer aqui
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Não foi possível iniciar o login com Google.' });
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-papel text-tinta">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12 relative">

        <div className="w-full max-w-md relative space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-azul hover:brightness-110 flex items-center justify-center mx-auto shadow-lg shadow-tinta/10">
              <GraduationCap className="w-7 h-7 text-folha" />
            </div>
            <h1 className="text-2xl font-extrabold text-tinta">
              {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta de estudante'}
            </h1>
            <p className="text-xs text-tinta-fraca">
              {isLogin
                ? 'Acesse seu histórico de redações e métricas de evolução'
                : 'Comece a treinar suas redações com a banca especialista do ENEM'}
            </p>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-xl border border-regua shadow-2xl space-y-6">
            {!isSupabaseConfigured && (
              <div className="p-3 rounded-xl text-xs flex items-center gap-2 bg-ambar-claro border border-ambar/30 text-ambar">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Login temporariamente indisponível (autenticação não configurada).</span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex p-1 bg-folha/80 rounded-xl border border-regua">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                  isLogin ? 'bg-azul text-folha shadow-sm' : 'text-tinta-fraca hover:text-tinta'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                  !isLogin ? 'bg-azul text-folha shadow-sm' : 'text-tinta-fraca hover:text-tinta'
                }`}
              >
                Criar Conta
              </button>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-verde-claro border border-verde/30 text-verde'
                    : 'bg-vermelho-claro border border-vermelho/30 text-vermelho'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-verde shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-vermelho shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loadingGoogle || !isSupabaseConfigured}
              className="w-full py-2.5 rounded-xl bg-white hover:brightness-95 text-[#1c1917] text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loadingGoogle ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.3 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z" />
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.6 5.6C41.9 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
                  </svg>
                  <span>Continuar com Google</span>
                </>
              )}
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-regua w-full" />
              <span className="bg-papel px-3 text-[11px] text-tinta-fraca uppercase tracking-wider shrink-0">
                Ou com e-mail
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-tinta-suave">Nome Completo</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Ana Clara Santos"
                        value={nomeCompleto}
                        onChange={(e) => setNomeCompleto(e.target.value)}
                        className="w-full bg-folha/90 border border-regua/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-tinta placeholder-tinta-fraca focus:outline-none focus:border-azul"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-tinta-suave">WhatsApp</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        inputMode="numeric"
                        required
                        placeholder="(11) 91234-5678"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(formatarWhatsapp(e.target.value))}
                        onBlur={() => setErroWhatsapp(validarWhatsapp(whatsapp))}
                        aria-invalid={erroWhatsapp ? true : undefined}
                        className={`w-full bg-folha/90 border rounded-xl pl-10 pr-4 py-2.5 text-xs text-tinta placeholder-tinta-fraca focus:outline-none focus:border-azul ${
                          erroWhatsapp ? 'border-azul' : 'border-regua/80'
                        }`}
                      />
                    </div>
                    {erroWhatsapp && (
                      <p className="text-[11px] text-azul">{erroWhatsapp}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-tinta-suave">Cidade e Estado</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Fortaleza - CE"
                        value={cidadeEstado}
                        onChange={(e) => setCidadeEstado(e.target.value)}
                        className="w-full bg-folha/90 border border-regua/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-tinta placeholder-tinta-fraca focus:outline-none focus:border-azul"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-tinta-suave">Data de Nascimento</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        required
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                        className="w-full bg-folha/90 border border-regua/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-tinta placeholder-tinta-fraca focus:outline-none focus:border-azul"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-tinta-suave">Curso dos Sonhos</label>
                    <div className="relative">
                      <Award className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Medicina, Direito, Engenharia"
                        value={cursoDosSonhos}
                        onChange={(e) => setCursoDosSonhos(e.target.value)}
                        className="w-full bg-folha/90 border border-regua/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-tinta placeholder-tinta-fraca focus:outline-none focus:border-azul"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-tinta-suave">E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="estudante@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-folha/90 border border-regua/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-tinta placeholder-tinta-fraca focus:outline-none focus:border-azul"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-tinta-suave">Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full bg-folha/90 border border-regua/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-tinta placeholder-tinta-fraca focus:outline-none focus:border-azul"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isSupabaseConfigured}
                className="w-full py-3 rounded-xl bg-azul hover:brightness-110 text-folha text-xs font-bold shadow-lg shadow-tinta/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{isLogin ? 'Entrar na Plataforma' : 'Concluir Cadastro'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/**
 * `useSearchParams` obriga a um limite de Suspense: a rota é pré-renderizada
 * estaticamente e a query string só existe no cliente. Sem isso o build falha.
 */
export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-papel">
          <Loader2 className="w-8 h-8 text-azul animate-spin" />
        </div>
      }
    >
      <AuthPageConteudo />
    </Suspense>
  );
}
