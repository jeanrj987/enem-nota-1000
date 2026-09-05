'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  AlertTriangle,
  Download,
  Clock,
  Layers,
  Info,
  PenTool,
  Lock,
} from 'lucide-react';
import { Correcao, Redacao } from '@/types';
import confetti from 'canvas-confetti';
import { exportarCorrecaoParaPDF } from '@/lib/pdf-export';
import { AbaAnalise } from './correcao/AbaAnalise';
import { AbaReescrita } from './correcao/AbaReescrita';
import { AbaPlano } from './correcao/AbaPlano';

interface CorrecaoViewProps {
  redacao: Redacao;
  correcao: Correcao;
  /** Sem assinatura ativa: a redação é corrigida normalmente, mas a nota,
   * as competências e o restante da análise ficam borradas atrás de um
   * paywall — só o layout geral fica visível, para incentivar a compra. */
  bloqueado?: boolean;
}

function getNotaClassification(nota: number) {
  if (nota >= 960) return { label: 'Nota 1000 Próxima / Excelente', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40' };
  if (nota >= 800) return { label: 'Muito Bom / Acima da Média', color: 'text-blue-400 border-blue-500/30 bg-blue-950/40' };
  if (nota >= 640) return { label: 'Bom / Competitivo', color: 'text-amber-400 border-amber-500/30 bg-amber-950/40' };
  return { label: 'Em Desenvolvimento / Atenção', color: 'text-rose-400 border-rose-500/30 bg-rose-950/40' };
}

export function CorrecaoView({ redacao, correcao, bloqueado = false }: CorrecaoViewProps) {
  const [activeTab, setActiveTab] = useState<'analise' | 'reescrita' | 'plano'>('analise');
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Confetti trigger if score >= 900 (não dispara com resultado bloqueado)
  useEffect(() => {
    if (!bloqueado && correcao.nota_geral >= 900) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [correcao.nota_geral, bloqueado]);

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
      exportarCorrecaoParaPDF(correcao, redacao);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

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

      {correcao.reconciliacao && !correcao.reconciliacao.correcaoUnica && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            Esta nota é o resultado de <strong className="text-slate-300">duas correções independentes</strong>,
            reconciliadas (mesmo protocolo usado pela banca do ENEM: dois corretores, com um terceiro em caso de
            divergência). Notas obtidas nas correções individuais:{' '}
            <span className="font-mono">{correcao.reconciliacao.notasIndividuais.join(' / ')}</span>
            {correcao.reconciliacao.terceiraCorrecaoAcionada &&
              ' — a divergência entre as duas primeiras exigiu uma terceira correção de arbitragem.'}
          </p>
        </div>
      )}

      {/* Top Banner de Resumo da Nota */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${classification.color} ${
                  bloqueado ? 'blur-sm select-none' : ''
                }`}
              >
                {bloqueado ? 'Resultado disponível' : classification.label}
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
              <div
                className={`text-4xl sm:text-5xl font-black gradient-text tracking-tight ${
                  bloqueado ? 'blur-md select-none' : ''
                }`}
              >
                {bloqueado ? '000' : correcao.nota_geral}
              </div>
              <div className="text-[11px] text-slate-400">de 1000 pontos possíveis</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              {bloqueado ? <Lock className="w-6 h-6 text-blue-400" /> : <Award className="w-7 h-7 text-blue-400" />}
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
              disabled={isExportingPDF || bloqueado}
              title={bloqueado ? 'Disponível com um plano ativo' : undefined}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
      <div className="relative">
        {bloqueado && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-3xl bg-slate-950/70 backdrop-blur-[2px] text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-bold text-white">Sua correção completa está pronta</h3>
              <p className="text-xs text-slate-300">
                Assine um plano para ver a nota por competência, os erros marcados, a versão reescrita nota 1000 e o
                plano de ação pedagógico.
              </p>
            </div>
            <Link
              href="/vendas"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
            >
              Ver Planos
            </Link>
          </div>
        )}

        <div className={bloqueado ? 'blur-md select-none pointer-events-none' : ''}>
          {activeTab === 'analise' && (
            <AbaAnalise
              correcao={correcao}
              textoOriginal={redacao.texto}
              selectedErrorId={selectedErrorId}
              onSelectError={setSelectedErrorId}
            />
          )}

          {activeTab === 'reescrita' && (
            <AbaReescrita
              versaoReescrita={correcao.versao_reescrita}
              copied={copied}
              onCopy={handleCopyReescrita}
            />
          )}

          {activeTab === 'plano' && (
            <AbaPlano
              pontosPositivos={correcao.pontos_positivos}
              proximosPassos={correcao.proximos_passos}
            />
          )}
        </div>
      </div>
    </div>
  );
}
