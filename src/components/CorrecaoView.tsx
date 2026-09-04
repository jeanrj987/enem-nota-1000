'use client';

import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { Correcao, Redacao, ErroIdentificado } from '@/types';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

interface CorrecaoViewProps {
  redacao: Redacao;
  correcao: Correcao;
}

export function CorrecaoView({ redacao, correcao }: CorrecaoViewProps) {
  const [activeTab, setActiveTab] = useState<'analise' | 'reescrita' | 'plano'>('analise');
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Confetti trigger if score >= 900
  useEffect(() => {
    if (correcao.nota_geral >= 900) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [correcao.nota_geral]);

  const getNotaClassification = (nota: number) => {
    if (nota >= 960) return { label: 'Nota 1000 Próxima / Excelente', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40' };
    if (nota >= 800) return { label: 'Muito Bom / Acima da Média', color: 'text-blue-400 border-blue-500/30 bg-blue-950/40' };
    if (nota >= 640) return { label: 'Bom / Competitivo', color: 'text-amber-400 border-amber-500/30 bg-amber-950/40' };
    return { label: 'Em Desenvolvimento / Atenção', color: 'text-rose-400 border-rose-500/30 bg-rose-950/40' };
  };

  const classification = getNotaClassification(correcao.nota_geral);

  const handleCopyReescrita = () => {
    if (correcao.versao_reescrita) {
      navigator.clipboard.writeText(correcao.versao_reescrita);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportPDF = () => {
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF();
      let y = 20;

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text('Relatório Oficial de Correção ENEM - Nota 1000 AI', 14, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Data: ${new Date(correcao.created_at).toLocaleDateString('pt-BR')} | Tema: ${redacao.tema}`, 14, y);
      y += 12;

      // Nota Geral
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, y, 182, 22, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(37, 99, 235);
      doc.text(`NOTA FINAL: ${correcao.nota_geral} / 1000 PONTOS`, 20, y + 14);
      y += 30;

      // Competências
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Desempenho por Competência:', 14, y);
      y += 8;

      correcao.competencias.forEach((comp) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(`${comp.nome}: ${comp.nota} / 200 pts`, 14, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const splitComment = doc.splitTextToSize(comp.comentario, 180);
        doc.text(splitComment, 14, y);
        y += splitComment.length * 4.5 + 4;
      });

      // Feedback Pedagógico
      if (y > 230) {
        doc.addPage();
        y = 20;
      }

      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Feedback Pedagógico e Próximos Passos:', 14, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const splitFeedback = doc.splitTextToSize(correcao.feedback_pedagogico, 180);
      doc.text(splitFeedback, 14, y);

      doc.save(`correcao-enem-${redacao.id}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Renderizar o texto com destaques interativos para os erros
  const renderHighlightedText = () => {
    let rawText = redacao.texto;
    if (!correcao.erros || correcao.erros.length === 0) {
      return (
        <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-200">
          {rawText}
        </div>
      );
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-200 space-y-4">
        {rawText.split(/\n\s*\n/).map((paragrafo, pIdx) => {
          let parts: React.ReactNode[] = [paragrafo];

          correcao.erros.forEach((erro) => {
            const newParts: React.ReactNode[] = [];

            parts.forEach((part) => {
              if (typeof part === 'string' && part.includes(erro.trecho)) {
                const subParts = part.split(erro.trecho);
                subParts.forEach((sub, sIdx) => {
                  newParts.push(sub);
                  if (sIdx < subParts.length - 1) {
                    const isSelected = selectedErrorId === erro.id;
                    const highlightClass =
                      erro.tipo === 'gramatica'
                        ? 'highlight-gramatica'
                        : erro.tipo === 'coesao'
                        ? 'highlight-coesao'
                        : erro.tipo === 'vocabulario'
                        ? 'highlight-vocabulario'
                        : erro.tipo === 'concordancia'
                        ? 'highlight-concordancia'
                        : 'highlight-outro';

                    newParts.push(
                      <mark
                        key={`${erro.id}-${sIdx}`}
                        onClick={() => setSelectedErrorId(erro.id)}
                        className={`${highlightClass} ${isSelected ? 'ring-2 ring-white scale-105' : ''}`}
                        title={`Clique para ver a correção: ${erro.explicacao}`}
                      >
                        {erro.trecho}
                      </mark>
                    );
                  }
                });
              } else {
                newParts.push(part);
              }
            });

            parts = newParts;
          });

          return (
            <p key={pIdx} className="leading-relaxed">
              {parts}
            </p>
          );
        })}
      </div>
    );
  };

  const selectedError = correcao.erros.find((e) => e.id === selectedErrorId);

  return (
    <div className="space-y-8">
      {correcao.anulada && (
        <div className="p-5 sm:p-6 rounded-2xl border-2 border-red-600/60 bg-red-950/40 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-red-300">Redação Anulada — Nota 0</h2>
            <p className="text-sm text-red-200/90 leading-relaxed">
              {correcao.motivo_anulacao ||
                'Sua redação se enquadra em uma situação que anula a nota por completo, segundo os critérios oficiais do INEP.'}
            </p>
            <p className="text-xs text-red-300/70">
              Mesmo que partes do texto estejam bem escritas, situações como fuga total ao tema, fuga ao tipo
              dissertativo-argumentativo, texto muito curto ou cópia dos textos motivadores zeram a redação inteira
              — não apenas o critério diretamente relacionado.
            </p>
          </div>
        </div>
      )}

      {/* Top Banner de Resumo da Nota */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${classification.color}`}>
                {classification.label}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(correcao.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {redacao.titulo || 'Redação ENEM'}
            </h1>
            <p className="text-sm text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Tema: <strong>{redacao.tema}</strong></span>
            </p>
          </div>

          {/* Placar de Pontuação */}
          <div className="flex items-center gap-4 bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl">
            <div className="text-center sm:text-right">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Nota Geral ENEM
              </div>
              <div className="text-4xl sm:text-5xl font-black gradient-text tracking-tight">
                {correcao.nota_geral}
              </div>
              <div className="text-[11px] text-slate-400">de 1000 pontos possíveis</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Award className="w-7 h-7 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Botões de Ação Topo */}
        <div className="relative mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('analise')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'analise'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Análise & Competências
            </button>
            <button
              onClick={() => setActiveTab('reescrita')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'reescrita'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Versão Reescrita (Nota 1000)
            </button>
            <button
              onClick={() => setActiveTab('plano')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'plano'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Plano de Ação Pedagógico
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>{isExportingPDF ? 'Gerando...' : 'Exportar PDF'}</span>
            </button>
            <Link
              href="/nova-redacao"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold hover:brightness-110 shadow-md shadow-blue-600/20 transition-all"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Nova Redação</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Conteúdo das Abas */}

      {/* ABA 1: ANÁLISE DETALHADA */}
      {activeTab === 'analise' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Coluna Esquerda: Texto com Erros Destacados (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Texto Original da Redação</h3>
                </div>
                <span className="text-xs text-slate-400">
                  {correcao.erros?.length || 0} oportunidades de melhoria
                </span>
              </div>

              {/* Legenda de cores */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pb-2">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Gramática
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Coesão
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Vocabulário
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Concordância
                </span>
              </div>

              {/* Conteúdo com realces */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-900 max-h-[600px] overflow-y-auto font-sans">
                {renderHighlightedText()}
              </div>

              {/* Detalhe do Erro Selecionado */}
              {selectedError && (
                <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      Oportunidade de Ajuste ({selectedError.tipo})
                    </span>
                    <button
                      onClick={() => setSelectedErrorId(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Fechar
                    </button>
                  </div>
                  <div className="text-xs text-slate-200">
                    <strong>Trecho original:</strong> <span className="line-through text-red-300">"{selectedError.trecho}"</span>
                  </div>
                  <div className="text-xs text-emerald-300">
                    <strong>Sugestão:</strong> "{selectedError.correcao}"
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {selectedError.explicacao}
                  </p>
                </div>
              )}
            </div>

            {/* Feedback Pedagógico Rápido */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Parecer Geral da Banca Especialista</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {correcao.feedback_pedagogico}
              </p>
            </div>
          </div>

          {/* Coluna Direita: As 5 Competências do ENEM (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-400" />
              Detalhamento por Competência
            </h3>

            {correcao.competencias.map((comp) => {
              const porcentagem = (comp.nota / 200) * 100;
              return (
                <div
                  key={comp.numero}
                  className="glass-panel p-5 rounded-2xl border border-slate-800/90 space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        {comp.nome}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {comp.descricao_curta}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold text-white">{comp.nota}</span>
                      <span className="text-xs text-slate-400">/200</span>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        comp.nota === 200
                          ? 'bg-emerald-500'
                          : comp.nota >= 160
                          ? 'bg-blue-500'
                          : comp.nota >= 120
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>

                  {/* Comentário da Banca */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {comp.comentario}
                  </p>

                  {/* Pontos Fortes e Melhoria */}
                  {comp.pontos_fortes && comp.pontos_fortes.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {comp.pontos_fortes.map((p, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-[10px] text-emerald-300"
                        >
                          ✓ {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: VERSÃO REESCRITA (PADRÃO 1000) */}
      {activeTab === 'reescrita' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Versão Reescrita Sugerida (Padrão Nota 1000)
              </h2>
              <p className="text-xs text-slate-400">
                Uma versão aprimorada da sua redação mantendo sua autoria, mas ajustando a norma culta, coesão e repertórios para excelência.
              </p>
            </div>

            <button
              onClick={handleCopyReescrita}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all self-start sm:self-auto cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-900 font-sans leading-relaxed text-slate-200 text-sm whitespace-pre-wrap space-y-4">
            {correcao.versao_reescrita}
          </div>
        </div>
      )}

      {/* ABA 3: PLANO DE AÇÃO PEDAGÓGICO */}
      {activeTab === 'plano' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Pontos Positivos & Acertos do Texto
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              {correcao.pontos_positivos?.map((ponto, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{ponto}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-blue-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Próximos Passos para o 960+
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              {correcao.proximos_passos?.map((passo, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{passo}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
