'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Search,
  Filter,
  Calendar,
  Award,
  BookOpen,
  ArrowUpRight,
  PenTool,
  ChevronRight,
  Layers,
  Sparkles,
  Activity,
  Terminal,
  Lock,
  Unlock,
  CheckCircle2,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GraficoEvolucao } from '@/components/GraficoEvolucao';
import {
  getRedacoesSalvas,
  calcularEstatisticas,
  gerarHistoricoGraficos,
  isPlanoPago,
  fazerUpgradePlano,
  sincronizarComSupabase,
} from '@/lib/storage';
import { Redacao, HistoricoItem, EstatisticasUsuario } from '@/types';
import confetti from 'canvas-confetti';

export default function HistoricoPage() {
  const [redacoes, setRedacoes] = useState<Redacao[]>([]);
  const [historicoGrafico, setHistoricoGrafico] = useState<HistoricoItem[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasUsuario | null>(null);
  const [planoAtivo, setPlanoAtivo] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [busca, setBusca] = useState('');
  const [filtroFaixa, setFiltroFaixa] = useState<'todas' | '900+' | '800+' | '<800'>('todas');

  const atualizarEstado = (list: Redacao[]) => {
    setRedacoes(list);
    setHistoricoGrafico(gerarHistoricoGraficos(list));
    setEstatisticas(calcularEstatisticas(list));
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
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {}
  };

  const redacoesFiltradas = redacoes.filter((red) => {
    const nota = red.correcao?.nota_geral || 0;
    const matchBusca =
      red.tema.toLowerCase().includes(busca.toLowerCase()) ||
      (red.titulo && red.titulo.toLowerCase().includes(busca.toLowerCase()));

    if (!matchBusca) return false;

    if (filtroFaixa === '900+') return nota >= 900;
    if (filtroFaixa === '800+') return nota >= 800 && nota < 900;
    if (filtroFaixa === '<800') return nota < 800;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#02040a] text-slate-100 font-sans selection:bg-cyan-400 selection:text-black relative">
      <div className="fixed inset-0 tech-grid-bg opacity-30 pointer-events-none z-0" />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full cyber-badge text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>EVOLUÇÃO E MÉTRICAS</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-white">
              Histórico & Curva de Aprendizado
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-sans">
              Monitore sua evolução contínua em cada uma das 5 competências oficiais do ENEM.
            </p>
          </div>

          <Link
            href="/nova-redacao"
            className="btn-cyber-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-heading font-black shadow-lg self-start md:self-auto"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>TREINAR NOVA REDAÇÃO</span>
          </Link>
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
                  Os gráficos de telemetria analítica e notas por competência estão protegidos. Desbloqueie por apenas <strong>R$ 19,90/mês</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowUpgradeModal(true)}
              className="btn-cyber-primary px-5 py-2.5 rounded-xl font-heading font-black text-xs flex items-center gap-2 shrink-0 shadow-lg cursor-pointer hover:scale-105 transition-transform"
            >
              <Sparkles className="w-4 h-4" />
              <span>DESBLOQUEAR GRÁFICOS (R$ 19,90)</span>
            </button>
          </div>
        )}

        {/* Gráficos de Evolução Interativos (Com Blindagem Total: dados zerados no SVG para free) */}
        {estatisticas && (
          <div className="relative">
            <div className={!planoAtivo ? 'filter blur-md select-none pointer-events-none' : ''}>
              <GraficoEvolucao
                historico={planoAtivo ? historicoGrafico : []}
                estatisticas={
                  planoAtivo
                    ? estatisticas
                    : {
                        total_redacoes: estatisticas.total_redacoes,
                        media_geral: 0,
                        maior_nota: 0,
                        ultima_nota: 0,
                        evolucao_percentual: 0,
                        competencia_forte: { numero: 1, nome: 'Bloqueado', media: 0 },
                        competencia_atencao: { numero: 5, nome: 'Bloqueado', media: 0 },
                      }
                }
              />
            </div>

            {!planoAtivo && (
              <div className="absolute inset-0 z-20 backdrop-blur-sm bg-black/60 flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-3xl">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-white">
                  Gráficos de Evolução & Radar de Competências Bloqueados
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md font-sans">
                  Acompanhe em detalhes onde você ganha e perde pontos para atingir +900 na redação do ENEM.
                </p>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="btn-cyber-primary px-6 py-3 rounded-xl font-heading font-black text-xs sm:text-sm flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>DESBLOQUEAR TODOS OS GRÁFICOS (R$ 19,90)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tabela Detalhada de Histórico */}
        <div className="tech-card p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Registros Anteriores
              </h2>
              <p className="text-xs text-slate-300 font-sans">
                Tabela de redações com notas discriminadas de C1 a C5
              </p>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por tema..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-[#030612] border border-cyan-500/20 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <select
                value={filtroFaixa}
                onChange={(e: any) => setFiltroFaixa(e.target.value)}
                className="bg-[#030612] border border-cyan-500/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="todas">Todas as notas</option>
                <option value="900+">Faixa 900+</option>
                <option value="800+">Faixa 800-890</option>
                <option value="<800">Abaixo de 800</option>
              </select>
            </div>
          </div>

          {redacoesFiltradas.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-sans">
              Nenhuma redação encontrada com os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Título & Tema</th>
                    <th className="py-3 px-3 text-center">C1</th>
                    <th className="py-3 px-3 text-center">C2</th>
                    <th className="py-3 px-3 text-center">C3</th>
                    <th className="py-3 px-3 text-center">C4</th>
                    <th className="py-3 px-3 text-center">C5</th>
                    <th className="py-3 px-4 text-center">Nota Oficial</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {redacoesFiltradas.map((red) => {
                    const c = red.correcao;
                    const nota = c?.nota_geral || 0;
                    const getComp = (num: number) => c?.competencias.find((comp) => comp.numero === num)?.nota || 0;

                    return (
                      <tr key={red.id} className="hover:bg-[#040816]/60 transition-colors">
                        <td className="py-4 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {new Date(red.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-4 px-4 max-w-xs">
                          <div className="font-bold text-white truncate">{red.titulo || 'Redação'}</div>
                          <div className="text-[11px] text-slate-400 truncate">{red.tema}</div>
                        </td>
                        <td className="py-4 px-3 text-center font-mono font-bold text-cyan-300">
                          {planoAtivo && getComp(1) > 0 ? getComp(1) : <span className="text-slate-600">•••</span>}
                        </td>
                        <td className="py-4 px-3 text-center font-mono font-bold text-cyan-300">
                          {planoAtivo && getComp(2) > 0 ? getComp(2) : <span className="text-slate-600">•••</span>}
                        </td>
                        <td className="py-4 px-3 text-center font-mono font-bold text-cyan-300">
                          {planoAtivo && getComp(3) > 0 ? getComp(3) : <span className="text-slate-600">•••</span>}
                        </td>
                        <td className="py-4 px-3 text-center font-mono font-bold text-cyan-300">
                          {planoAtivo && getComp(4) > 0 ? getComp(4) : <span className="text-slate-600">•••</span>}
                        </td>
                        <td className="py-4 px-3 text-center font-mono font-bold text-cyan-300">
                          {planoAtivo && getComp(5) > 0 ? getComp(5) : <span className="text-slate-600">•••</span>}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {planoAtivo && nota > 0 ? (
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
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
                            <button
                              onClick={() => setShowUpgradeModal(true)}
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 mx-auto hover:bg-amber-500/30 cursor-pointer"
                            >
                              <Lock className="w-3 h-3" /> Bloqueada
                            </button>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link
                            href={`/correcao/${red.id}`}
                            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold"
                          >
                            <span>Abrir</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Modal de Desbloqueio PRO */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tech-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-cyan-500/40 text-center space-y-6 shadow-2xl animate-fade-in relative">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.3)]">
              <Unlock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Desbloqueio Imediato
              </span>
              <h3 className="font-heading text-xl font-bold text-white">
                Desbloqueie todos os seus Gráficos & Notas
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                Acesse o radar de competências, gráfico de evolução temporal e todas as notas por apenas <strong>R$ 19,90/mês</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#030612] border border-cyan-500/30 space-y-2 text-left text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Notas oficiais reveladas na tabela completa</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Radar e gráficos de evolução temporal</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Versões reescritas Nota 1000 completas</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Garantia de 7 dias com reembolso de 100%</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                className="btn-cyber-primary w-full py-4 rounded-xl font-heading font-black text-sm flex items-center justify-center gap-2 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
              >
                <Sparkles className="w-4 h-4" />
                <span>DESBLOQUEAR TUDO AGORA POR R$ 19,90</span>
              </button>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Continuar no Modo Demonstração
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
