'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Download,
  Share2,
  ArrowRight,
  PenTool,
  TrendingUp,
  Clock,
  Layers,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  FileText,
  Activity,
  Zap,
  Filter,
  Lock,
  Unlock,
  ShieldAlert,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { Correcao, Redacao, ErroIdentificado } from '@/types';
import { isPlanoPago, fazerUpgradePlano, salvarRedacao, getUsuarioAtual } from '@/lib/storage';
import { SimuladorSisu } from '@/components/SimuladorSisu';
import { CheckoutModal } from '@/components/CheckoutModal';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

interface CorrecaoViewProps {
  redacao: Redacao;
  correcao: Correcao;
}

export function CorrecaoView({ redacao, correcao }: CorrecaoViewProps) {
  const [activeTab, setActiveTab] = useState<'analise' | 'reescrita' | 'plano' | 'sisu'>('analise');
  const [selectedCompFilter, setSelectedCompFilter] = useState<number | 'all'>('all');
  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Controle de Estado da Correção e Segurança Server-Side
  const [correcaoAtual, setCorrecaoAtual] = useState<Correcao>(correcao);
  const [planoAtivo, setPlanoAtivo] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    const isPago = isPlanoPago();
    setPlanoAtivo(isPago);
    setCorrecaoAtual(correcao);
  }, [correcao]);

  const listaErros: ErroIdentificado[] = correcaoAtual.erros || correcaoAtual.erros_identificados || [];

  // Filtragem de erros por competência
  const errosFiltrados = selectedCompFilter === 'all'
    ? listaErros
    : listaErros.filter((e) => (e.competencia_relacionada || 1) === selectedCompFilter);

  // Desbloqueio e Recuperação da Versão Completa no Servidor
  const handleUpgrade = async () => {
    fazerUpgradePlano('pro');
    setPlanoAtivo(true);
    setShowUpgradeModal(false);

    // Se os dados foram higienizados no servidor no modo grátis, busca a versão real e completa
    if (correcaoAtual.is_bloqueado || correcaoAtual.nota_oculta || correcaoAtual.nota_geral === 0) {
      setIsUnlocking(true);
      try {
        const res = await fetch('/api/desbloquear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texto: redacao.texto,
            tema: redacao.tema,
            titulo: redacao.titulo,
          }),
        });

        const data = await res.json();
        if (data.correcao) {
          setCorrecaoAtual(data.correcao);
          salvarRedacao({
            ...redacao,
            correcao: data.correcao,
          });
        }
      } catch (e) {
        console.error('Erro ao desbloquear laudo:', e);
      } finally {
        setIsUnlocking(false);
      }
    }

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {}
  };

  const getNotaClassification = (nota: number) => {
    if (!planoAtivo) {
      return {
        label: '🔒 Modo Demonstração • Nota Oficial Bloqueada',
        color: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
      };
    }
    if (nota >= 960) return { label: 'Nota Excelente • Faixa de Aprovação em Medicina (SISU)', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' };
    if (nota >= 800) return { label: 'Alto Desempenho • Faixa Competitiva para Faculdades Públicas', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40' };
    if (nota >= 640) return { label: 'Desempenho Mediano • Pequenos ajustes para alcançar +800', color: 'text-amber-400 border-amber-500/40 bg-amber-950/40' };
    return { label: 'Atenção Necessária • Siga o plano de estudos abaixo para subir rápido', color: 'text-rose-400 border-rose-500/40 bg-rose-950/40' };
  };

  const classification = getNotaClassification(correcaoAtual.nota_geral);

  const handleCopyReescrita = () => {
    if (!planoAtivo) {
      setShowUpgradeModal(true);
      return;
    }
    if (correcaoAtual.versao_reescrita) {
      navigator.clipboard.writeText(correcaoAtual.versao_reescrita);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleExportPDF = () => {
    if (!planoAtivo) {
      setShowUpgradeModal(true);
      return;
    }

    setIsExportingPDF(true);
    try {
      const doc = new jsPDF();
      let y = 20;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('Relatório Oficial de Correção ENEM - Nota 1000 PRO', 14, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Data: ${new Date(correcaoAtual.created_at).toLocaleDateString('pt-BR')} | Tema: ${redacao.tema}`, 14, y);
      y += 12;

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, y, 182, 22, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(2, 6, 23);
      doc.text(`Sua Nota Final: ${correcaoAtual.nota_geral} / 1000 pontos`, 20, y + 14);
      y += 30;

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Avaliação detalhada pelas 5 Competências do ENEM:', 14, y);
      y += 8;

      correcaoAtual.competencias.forEach((comp) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`Competência ${comp.numero}: ${comp.nome} - [ ${comp.nota} / 200 pts ]`, 14, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const lines = doc.splitTextToSize(comp.comentario, 182);
        doc.text(lines, 14, y);
        y += lines.length * 4.5 + 4;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

      if (correcaoAtual.versao_reescrita) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        y += 6;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Versão Reescrita Modelo Nota 1000:', 14, y);
        y += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const reescritaLines = doc.splitTextToSize(correcaoAtual.versao_reescrita, 182);
        doc.text(reescritaLines, 14, y);
      }

      doc.save(`Resultado_Redacao_ENEM_${redacao.id || 'nota1000'}.pdf`);
    } catch (e) {
      console.error('Erro ao exportar PDF', e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
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
                Sua nota oficial e o modelo Nota 1000 estão protegidos no servidor. Desbloqueie o relatório 100% completo por apenas <strong>R$ 19,90/mês</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowUpgradeModal(true)}
            className="btn-cyber-primary px-5 py-2.5 rounded-xl font-heading font-black text-xs flex items-center gap-2 shrink-0 shadow-lg cursor-pointer hover:scale-105 transition-transform"
          >
            <Sparkles className="w-4 h-4" />
            <span>DESBLOQUEAR NOTA OFICIAL COM PIX</span>
          </button>
        </div>
      )}

      {/* Painel Superior: Nota Geral & Resumo */}
      <div className="tech-card p-6 sm:p-10 rounded-3xl border border-cyan-500/40 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${classification.color}`}>
                {classification.label}
              </span>
            </div>
            
            <h1 className="font-heading text-2xl sm:text-3xl font-black text-white tracking-tight">
              {redacao.titulo || 'Redação Dissertativa-Argumentativa'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-2">
              <span className="text-cyan-400 font-bold">Tema Oficial:</span>
              <span>{redacao.tema}</span>
            </p>
          </div>

          {/* Placar Digital da Nota */}
          <div className="flex items-center gap-4 bg-[#030612] p-5 rounded-2xl border border-cyan-500/30 shrink-0">
            <div className="text-right flex flex-col items-end justify-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Sua Nota Final
              </span>

              {planoAtivo && correcaoAtual.nota_geral > 0 ? (
                <div className="text-4xl sm:text-5xl font-black text-white font-mono text-glow-cyan">
                  {correcaoAtual.nota_geral} <span className="text-xs text-slate-400 font-normal font-sans">/ 1000</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="group flex flex-col items-end gap-1.5 cursor-pointer text-right transition-all hover:scale-105"
                  title="Clique para desbloquear sua nota oficial"
                >
                  <div className="text-3xl sm:text-4xl font-black text-slate-600 font-mono tracking-widest select-none">
                    •••• <span className="text-xs text-slate-600 font-sans font-normal">/ 1000</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 group-hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono transition-colors">
                    <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>NOTA BLOQUEADA</span>
                  </span>
                </button>
              )}
            </div>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-cyan-500/30 shrink-0">
              <div className="w-full h-full bg-[#02040a] rounded-[14px] flex flex-col items-center justify-center text-cyan-300">
                {planoAtivo && correcaoAtual.nota_geral > 0 ? (
                  <>
                    <Award className="w-6 h-6 text-cyan-400" />
                    <span className="text-xs font-bold mt-0.5">{Math.round((correcaoAtual.nota_geral / 1000) * 100)}%</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-6 h-6 text-amber-400" />
                    <span className="text-[10px] font-bold mt-0.5 text-amber-300">PRO</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informações e Botões de Ação */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Avaliado em {new Date(correcaoAtual.created_at).toLocaleDateString('pt-BR')}</span>
            </span>
            <span>•</span>
            <span>{redacao.palavras_count || 0} palavras</span>
            <span>•</span>
            <span>~{redacao.linhas_count || 0} linhas</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#040816] hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{planoAtivo ? (isExportingPDF ? 'Gerando...' : 'Baixar PDF') : '🔒 Baixar PDF (PRO)'}</span>
            </button>

            <Link
              href="/nova-redacao"
              className="btn-cyber-primary px-4 py-2 rounded-xl text-xs font-heading font-black flex items-center gap-1.5 cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>ENVIAR OUTRA REDAÇÃO</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Memória Pedagógica */}
      {correcaoAtual.analise_evolucao && (
        <div className="tech-card p-6 rounded-3xl border border-indigo-500/40 bg-gradient-to-r from-[#070b1e] via-[#040816] to-[#070e22] space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="font-heading text-sm font-bold text-white">
                Memória Pedagógica: Comparativo com seus Treinos Anteriores
              </h3>
            </div>
            {planoAtivo && typeof correcaoAtual.analise_evolucao.diferenca_nota === 'number' && (
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold font-mono border self-start sm:self-auto ${
                  correcaoAtual.analise_evolucao.diferenca_nota > 0
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : correcaoAtual.analise_evolucao.diferenca_nota === 0
                    ? 'bg-slate-900 text-slate-300 border-slate-700'
                    : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                }`}
              >
                {correcaoAtual.analise_evolucao.diferenca_nota > 0 ? `+${correcaoAtual.analise_evolucao.diferenca_nota} pts` : `${correcaoAtual.analise_evolucao.diferenca_nota} pts`} em relação ao treino anterior
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            {planoAtivo
              ? correcaoAtual.analise_evolucao.comparativo_anterior
              : 'Mapeamos seus avanços estruturais e os pontos de atenção em relação aos seus treinos anteriores. O comparativo oficial com pontuação detalhada está disponível no Plano PRO.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
            {correcaoAtual.analise_evolucao.evoluiu_em && correcaoAtual.analise_evolucao.evoluiu_em.length > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> O que você melhorou neste texto:
                </span>
                <ul className="space-y-1 text-slate-300">
                  {correcaoAtual.analise_evolucao.evoluiu_em.map((ev, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {correcaoAtual.analise_evolucao.reincidiu_em && correcaoAtual.analise_evolucao.reincidiu_em.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1.5">
                <span className="font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Erros repetidos de treinos anteriores:
                </span>
                <ul className="space-y-1 text-slate-300">
                  {correcaoAtual.analise_evolucao.reincidiu_em.map((re, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">!</span>
                      <span>{re}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Abas de Navegação */}
      <div className="flex flex-wrap items-center gap-2 bg-[#050914] p-1.5 rounded-2xl border border-cyan-500/25">
        <button
          onClick={() => setActiveTab('analise')}
          className={`flex-1 min-w-[120px] py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'analise'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>1. As 5 Competências</span>
        </button>

        <button
          onClick={() => setActiveTab('reescrita')}
          className={`flex-1 min-w-[120px] py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'reescrita'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>2. Reescrita Nota 1000 {!planoAtivo && '🔒'}</span>
        </button>

        <button
          onClick={() => setActiveTab('sisu')}
          className={`flex-1 min-w-[120px] py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'sisu'
              ? 'bg-indigo-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-indigo-400" />
          <span>3. Simulador SISU</span>
        </button>

        <button
          onClick={() => setActiveTab('plano')}
          className={`flex-1 min-w-[120px] py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'plano'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>4. Próximos Passos</span>
        </button>
      </div>

      {/* TAB 1: AUDITORIA DAS 5 COMPETÊNCIAS */}
      {activeTab === 'analise' && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="tech-card p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="font-heading text-base font-bold text-white">
                  Seu Texto com Apontamentos de Melhoria
                </h3>
              </div>
              <span className="text-xs text-cyan-300 font-medium">
                Veja onde você acertou e o que pode ajustar
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#030612] border border-cyan-500/20 text-sm sm:text-base text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
              {redacao.texto}
            </div>

            {listaErros.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide block">
                    Apontamentos Gramaticais e Coesivos Encontrados:
                  </span>
                  
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-400 mr-1 flex items-center gap-1">
                      <Filter className="w-3 h-3" /> Filtrar:
                    </span>
                    <button
                      onClick={() => setSelectedCompFilter('all')}
                      className={`px-2.5 py-1 rounded-lg ${selectedCompFilter === 'all' ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-900 text-slate-400'}`}
                    >
                      Todos ({listaErros.length})
                    </button>
                    <button
                      onClick={() => setSelectedCompFilter(1)}
                      className={`px-2.5 py-1 rounded-lg ${selectedCompFilter === 1 ? 'bg-rose-500 text-white font-bold' : 'bg-slate-900 text-slate-400'}`}
                    >
                      Gramática (C1)
                    </button>
                    <button
                      onClick={() => setSelectedCompFilter(4)}
                      className={`px-2.5 py-1 rounded-lg ${selectedCompFilter === 4 ? 'bg-amber-500 text-black font-bold' : 'bg-slate-900 text-slate-400'}`}
                    >
                      Conectivos (C4)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {errosFiltrados.map((err: ErroIdentificado, idx: number) => (
                    <div
                      key={err.id || idx}
                      className="p-4 rounded-xl bg-[#040816] border border-rose-500/30 space-y-1.5 text-xs font-sans"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-rose-400 font-bold uppercase text-[11px]">
                          Competência {err.competencia_relacionada || 1}
                        </span>
                        <span className="text-slate-400 text-[11px]">{err.tipo || 'Desvio'}</span>
                      </div>
                      <div className="text-slate-200">
                        Como estava: <span className="line-through text-rose-400">"{err.trecho}"</span> ➔ Sugestão: <strong className="text-emerald-400">"{err.correcao}"</strong>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {err.explicacao}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Parecer Oficial pelas 5 Competências do ENEM
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {correcaoAtual.competencias.map((comp) => (
                <div
                  key={comp.numero}
                  className="tech-card p-6 rounded-2xl border border-cyan-500/25 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                      <span className="text-xs font-bold text-cyan-400">
                        Competência {comp.numero}
                      </span>
                      
                      {planoAtivo && comp.nota > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold text-xs font-mono">
                          {comp.nota} / 200 pontos
                        </span>
                      ) : (
                        <button
                          onClick={() => setShowUpgradeModal(true)}
                          className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono flex items-center gap-1 hover:bg-amber-500/30 cursor-pointer"
                        >
                          <Lock className="w-3 h-3" /> Nota Bloqueada
                        </button>
                      )}
                    </div>

                    <h4 className="font-heading text-sm font-bold text-white">
                      {comp.nome}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {comp.comentario}
                    </p>
                  </div>

                  <div className="pt-2">
                    <div className="w-full bg-[#030612] rounded-full h-2 overflow-hidden border border-white/[0.06]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          !planoAtivo || comp.nota === 0
                            ? 'bg-amber-500/40 filter blur-[1px]'
                            : comp.nota >= 160
                            ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]'
                            : comp.nota >= 120
                            ? 'bg-indigo-400'
                            : 'bg-amber-400'
                        }`}
                        style={{ width: planoAtivo && comp.nota > 0 ? `${(comp.nota / 200) * 100}%` : '65%' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {correcaoAtual.elementos_proposta_c5 && (
            <div className="tech-card p-6 sm:p-8 rounded-3xl border border-emerald-500/40 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Checklist da Proposta de Intervenção (Competência 5)</span>
                </div>
                <span className="text-xs text-emerald-300 font-bold">
                  {Object.values(correcaoAtual.elementos_proposta_c5).filter(Boolean).length} de 5 Elementos Presentes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                {Object.entries(correcaoAtual.elementos_proposta_c5).map(([elem, val]) => (
                  <div
                    key={elem}
                    className={`p-3 rounded-xl border ${
                      val
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <div className="font-bold uppercase text-[11px]">
                      {val ? '✓' : '✕'} {elem}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 font-sans">
                      {typeof val === 'string' ? val : val ? 'Identificado no texto' : 'Elemento ausente'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: REESCRITA NOTA 1000 */}
      {activeTab === 'reescrita' && (
        <div className="space-y-6 animate-fade-in">
          <div className="tech-card p-6 sm:p-8 rounded-3xl border border-cyan-500/40 space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wide">
                  <Sparkles className="w-4 h-4" />
                  <span>Versão Reescrita Modelo Nota 1000</span>
                </div>
                <p className="text-xs text-slate-300 font-sans">
                  Reconstruímos os seus argumentos exatamente no formato exigido pela banca examinadora.
                </p>
              </div>

              <button
                onClick={handleCopyReescrita}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#040816] hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto Reescrito'}</span>
              </button>
            </div>

            <div className="relative" onContextMenu={(e) => !planoAtivo && e.preventDefault()}>
              <div className={`p-6 rounded-2xl bg-[#030612] border border-cyan-500/25 text-sm sm:text-base text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-none ${!planoAtivo ? 'filter blur-md' : ''}`}>
                {planoAtivo && !correcaoAtual.is_bloqueado
                  ? correcaoAtual.versao_reescrita
                  : 'Em sua obra O Cidadão de Papel, Gilberto Dimenstein discute a distância entre os direitos garantidos na legislação e a realidade concreta da população brasileira. Nesse contexto, a problemática tratada demanda políticas públicas eficazes e conscientização social permanente para que a cidadania plena seja assegurada a todos os indivíduos.\n\nEm primeiro plano, cabe destacar a omissão estatal como fator propulsor da vulnerabilidade social. Consoante o pensamento de John Locke, cabe às instituições governamentais a garantia do bem-estar social coletivo.\n\nPortanto, medidas urgentes são necessárias para mitigar esse cenário adverso.'}
              </div>

              {!planoAtivo && (
                <div className="absolute inset-0 z-20 backdrop-blur-sm bg-black/60 flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="font-heading text-lg sm:text-xl font-bold text-white">
                    Versão Reescrita Nota 1000 Bloqueada
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md font-sans leading-relaxed">
                    Aprenda na prática como transformar seus argumentos na redação nota máxima exigida pelo INEP por apenas <strong>R$ 19,90/mês</strong>.
                  </p>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="btn-cyber-primary px-6 py-3 rounded-xl font-heading font-black text-xs sm:text-sm flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>DESBLOQUEAR VERSÃO COMPLETA (R$ 19,90)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SIMULADOR SISU */}
      {activeTab === 'sisu' && (
        <div className="space-y-6 animate-fade-in">
          <SimuladorSisu
            notaRedacao={correcaoAtual.nota_geral}
            planoAtivo={planoAtivo}
            onSolicitarUpgrade={() => setShowUpgradeModal(true)}
          />
        </div>
      )}

      {/* TAB 4: PLANO DE ESTUDOS / EVOLUÇÃO */}
      {activeTab === 'plano' && (
        <div className="space-y-6 animate-fade-in">
          <div className="tech-card p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-6">
            <div className="space-y-1 border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wide">
                <TrendingUp className="w-4 h-4" />
                <span>O que você deve focar no próximo treino</span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                Passo a passo estratégico para você aumentar sua nota na próxima redação.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-[#041410] border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>O que você já faz bem (Mantenha!):</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 font-sans">
                  {(correcaoAtual.pontos_fortes || correcaoAtual.pontos_positivos || []).map((pf: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{pf}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-[#140810] border border-rose-500/30 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Pontos de Atenção Prioritária:</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 font-sans">
                  {(correcaoAtual.pontos_melhoria || correcaoAtual.proximos_passos || []).map((pm: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">!</span>
                      <span>{pm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#030612] border border-cyan-500/25 space-y-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide block">
                Recomendações dos Especialistas:
              </span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {correcaoAtual.recomendacoes_finais || correcaoAtual.feedback_pedagogico || 'Continue praticando com a matriz oficial do INEP para consolidar seu repertório.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Checkout PIX Dinâmico */}
      <CheckoutModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={handleUpgrade}
      />

    </div>
  );
}
