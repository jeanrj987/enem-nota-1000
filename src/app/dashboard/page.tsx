'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PenTool,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Target,
  Clock,
  ChevronRight,
  BarChart2,
  FileText,
  Trash2,
  AlertTriangle,
  Zap,
  Cpu,
  Terminal,
  Activity,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  Flame,
  GraduationCap,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SimuladorSisu } from '@/components/SimuladorSisu';
import { CheckoutModal } from '@/components/CheckoutModal';
import {
  getRedacoesSalvas,
  calcularEstatisticas,
  limparTodasRedacoes,
  limparTudo,
  TEMAS_ENEM_SUGERIDOS,
  isPlanoPago,
  fazerUpgradePlano,
  calcularStreakEstudos,
  obterConquistasUsuario,
  Conquista,
  sincronizarComSupabase,
} from '@/lib/storage';
import { Redacao, EstatisticasUsuario } from '@/types';
import confetti from 'canvas-confetti';

export default function DashboardPage() {
  const [redacoes, setRedacoes] = useState<Redacao[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasUsuario | null>(null);
  const [conquistas, setConquistas] = useState<Conquista[]>([]);
  const [streak, setStreak] = useState(0);
  const [planoAtivo, setPlanoAtivo] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const atualizarEstado = (list: Redacao[]) => {
    setRedacoes(list);
    setEstatisticas(calcularEstatisticas(list));
    setConquistas(obterConquistasUsuario(list));
    setStreak(calcularStreakEstudos(list));
    setPlanoAtivo(isPlanoPago());
  };

  const carregarDados = () => {
    const list = getRedacoesSalvas();
    atualizarEstado(list);

    // Sincronizar em nuvem
    sincronizarComSupabase().then((remotas) => {
      atualizarEstado(remotas);
    });
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleUpgrade = () => {
    fazerUpgradePlano('pro');
    setPlanoAtivo(true);
    setShowUpgradeModal(false);
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {}
  };

  const handleLimparDados = () => {
    if (confirm('Tem certeza de que deseja zerar todas as redações salvas e reiniciar seu perfil?')) {
      limparTudo();
      carregarDados();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#02040a] text-slate-100 font-sans selection:bg-cyan-400 selection:text-black relative">
      <div className="fixed inset-0 tech-grid-bg opacity-30 pointer-events-none z-0" />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 relative z-10">
        
        {/* Header do Painel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full cyber-badge text-xs">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>PAINEL DO ESTUDANTE</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-white">
              Meu Desempenho & Evolução
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-sans">
              Acompanhe seu histórico de treinos, notas oficiais e evolução rumo aos +900 no ENEM.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}</span>
              </div>
            )}

            {redacoes.length > 0 && (
              <button
                type="button"
                onClick={handleLimparDados}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-800/40 transition-colors cursor-pointer"
                title="Zerar todas as redações salvas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ZERAR</span>
              </button>
            )}

            <Link
              href="/historico"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#040816] hover:bg-[#091228] text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>GRÁFICOS</span>
            </Link>
            
            <Link
              href="/nova-redacao"
              className="btn-cyber-primary flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-black shadow-lg"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>NOVA REDAÇÃO</span>
            </Link>
          </div>
        </div>

        {/* Banner de Upgrade para Modo Demo */}
        {!planoAtivo && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#140b03] via-[#091522] to-[#040816] border border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span>Modo Demonstração Gratuito</span>
                </span>
                <p className="text-xs text-slate-300 font-sans">
                  As notas oficiais e as métricas avançadas estão protegidas. Desbloqueie todo o painel por apenas <strong>R$ 19,90/mês</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowUpgradeModal(true)}
              className="btn-cyber-primary px-5 py-2.5 rounded-xl font-heading font-black text-xs flex items-center gap-2 shrink-0 shadow-lg cursor-pointer hover:scale-105 transition-transform"
            >
              <Sparkles className="w-4 h-4" />
              <span>LIBERAR NOTAS & MÉTRICAS (R$ 19,90)</span>
            </button>
          </div>
        )}

        {/* Métricas e Estatísticas (KPI Cards) */}
        {estatisticas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Card 1: Média Geral */}
            <div className="tech-card p-5 rounded-2xl border border-cyan-500/30 space-y-1">
              <div className="flex items-center justify-between text-xs text-cyan-300 font-bold">
                <span>MÉDIA GERAL</span>
                <Target className="w-4 h-4 text-cyan-400" />
              </div>

              {planoAtivo && estatisticas.media_geral > 0 ? (
                <div className="text-2xl sm:text-3xl font-black text-white font-mono text-glow-cyan">
                  {estatisticas.media_geral}{' '}
                  <span className="text-xs text-slate-400 font-sans font-normal">/ 1000</span>
                </div>
              ) : (
                <div className="cursor-pointer space-y-0.5" onClick={() => setShowUpgradeModal(true)}>
                  <div className="text-2xl sm:text-3xl font-black text-slate-600 font-mono tracking-widest select-none">
                    ••• <span className="text-xs text-slate-600 font-sans font-normal">/ 1000</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Bloqueado (Demo)
                  </span>
                </div>
              )}

              <div className="text-[10px] text-slate-400">
                {estatisticas.total_redacoes > 0 ? `${estatisticas.total_redacoes} textos avaliados` : 'Sem registros'}
              </div>
            </div>

            {/* Card 2: Recorde Pessoal */}
            <div className="tech-card p-5 rounded-2xl border border-emerald-500/30 space-y-1">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span>MAIOR NOTA</span>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>

              {planoAtivo && estatisticas.maior_nota > 0 ? (
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono text-glow-matrix">
                  {estatisticas.maior_nota}
                </div>
              ) : (
                <div className="cursor-pointer space-y-0.5" onClick={() => setShowUpgradeModal(true)}>
                  <div className="text-2xl sm:text-3xl font-black text-slate-600 font-mono tracking-widest select-none">
                    •••
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Bloqueado (Demo)
                  </span>
                </div>
              )}

              <div className="text-[10px] text-emerald-400/80">
                {estatisticas.total_redacoes > 0 ? 'Pontuação Máxima' : 'Aguardando 1º envio'}
              </div>
            </div>

            {/* Card 3: Total de Redações */}
            <div className="tech-card p-5 rounded-2xl border border-indigo-500/30 space-y-1">
              <div className="flex items-center justify-between text-xs text-indigo-300 font-bold">
                <span>TOTAL DE TREINOS</span>
                <BookOpen className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {estatisticas.total_redacoes}
              </div>
              <div className="text-[10px] text-slate-400">
                Redações submetidas
              </div>
            </div>

            {/* Card 4: Ponto Forte */}
            <div className="tech-card p-5 rounded-2xl border border-purple-500/30 space-y-1">
              <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
                <span>COMPETÊNCIA DESTAQUE</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-sm font-bold text-white truncate">
                {estatisticas.competencia_forte.nome.slice(0, 20)}
              </div>
              <div className="text-[10px] text-purple-300">
                {estatisticas.total_redacoes > 0 
                  ? (planoAtivo && estatisticas.competencia_forte.media > 0 ? `Média: ${estatisticas.competencia_forte.media} pts` : '🔒 Média protegida') 
                  : 'Inicie o treino'}
              </div>
            </div>

          </div>
        )}

        {/* Simulador SISU Integrado no Dashboard */}
        <SimuladorSisu
          notaRedacao={estatisticas?.media_geral || 0}
          planoAtivo={planoAtivo}
          onSolicitarUpgrade={() => setShowUpgradeModal(true)}
        />

        {/* Conquistas e Gamificação do Estudante */}
        <div className="tech-card p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              <h2 className="font-heading text-base sm:text-lg font-bold text-white">
                Suas Conquistas de Aprendizado
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {conquistas.filter((c) => c.desbloqueada).length} de {conquistas.length} desbloqueadas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {conquistas.map((conq) => (
              <div
                key={conq.id}
                className={`p-4 rounded-2xl border transition-all ${
                  conq.desbloqueada
                    ? 'bg-[#040c1e] border-cyan-500/40 text-slate-200'
                    : 'bg-[#02050e]/60 border-white/[0.05] text-slate-500 opacity-60'
                }`}
              >
                <div className="text-2xl mb-2">{conq.icone}</div>
                <h3 className="font-heading text-xs sm:text-sm font-bold text-white">
                  {conq.titulo}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  {conq.descricao}
                </p>
                <div className="mt-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    conq.desbloqueada
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {conq.desbloqueada ? '✓ Desbloqueada' : 'Bloqueada'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Redações Enviadas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Redações Salvas & Pareceres
            </h2>
            <span className="text-xs text-slate-400">
              {redacoes.length} {redacoes.length === 1 ? 'redação' : 'redações'}
            </span>
          </div>

          {redacoes.length === 0 ? (
            <div className="tech-card p-12 rounded-3xl border border-cyan-500/20 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#040816] border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-base font-bold text-white">Nenhuma redação avaliada ainda</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto font-sans">
                Você ainda não submeteu textos para avaliação. Escreva no editor ou envie um arquivo para gerar o primeiro parecer.
              </p>
              <Link
                href="/nova-redacao"
                className="btn-cyber-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>AVALIAR PRIMEIRA REDAÇÃO</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {redacoes.map((red) => {
                const nota = red.correcao?.nota_geral || 0;
                const comps = red.correcao?.competencias || [];

                return (
                  <div
                    key={red.id}
                    className="tech-card p-6 rounded-2xl border border-cyan-500/25 space-y-4 flex flex-col justify-between group hover:border-cyan-400/50 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          {new Date(red.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        
                        {planoAtivo && nota > 0 ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                              nota >= 900
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                : nota >= 800
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                                : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {nota} pts
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Nota Protegida
                          </span>
                        )}
                      </div>

                      <h3 className="font-heading text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                        {red.titulo || 'Redação Dissertativa'}
                      </h3>

                      <p className="text-xs text-slate-300 line-clamp-2 font-sans">
                        <strong className="text-cyan-400 font-medium">Tema:</strong> {red.tema}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                      <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
                        {comps.map((c) => (
                          <div key={c.numero} className="p-1 rounded bg-[#030612] border border-white/[0.05]">
                            <div className="text-slate-500">C{c.numero}</div>
                            <div className={`font-bold ${planoAtivo && c.nota > 0 ? 'text-cyan-300' : 'text-slate-600'}`}>
                              {planoAtivo && c.nota > 0 ? c.nota : '•••'}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Link
                        href={`/correcao/${red.id}`}
                        className="w-full py-2 rounded-xl bg-[#040816] hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{planoAtivo && nota > 0 ? 'VER LAUDO COMPLETO' : 'VER PARECER DEMO'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Modal de Checkout PIX Dinâmico */}
      <CheckoutModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={handleUpgrade}
      />

      <Footer />
    </div>
  );
}
