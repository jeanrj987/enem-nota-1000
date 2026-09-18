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
}

function getNotaClassification(nota: number) {
  if (nota >= 960) return { label: 'Nota 1000 Próxima / Excelente', color: 'text-verde border-verde bg-verde-claro' };
  if (nota >= 800) return { label: 'Muito Bom / Acima da Média', color: 'text-vermelho border-vermelho bg-vermelho-claro' };
  if (nota >= 640) return { label: 'Bom / Competitivo', color: 'text-ambar border-ambar bg-ambar-claro' };
  return { label: 'Em Desenvolvimento / Atenção', color: 'text-vermelho border-vermelho bg-vermelho-claro' };
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
        <div className="p-5 sm:p-6 rounded-xl border-2 border-vermelho bg-vermelho-claro flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-vermelho-claro border border-vermelho flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-vermelho" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-vermelho">Redação Anulada — Nota 0</h2>
            <p className="text-sm text-vermelho leading-relaxed">
              {correcao.motivo_anulacao ||
                'Sua redação se enquadra em uma situação que anula a nota por completo, segundo os critérios oficiais do INEP.'}
            </p>
            <p className="text-xs text-vermelho">
              Mesmo que partes do texto estejam bem escritas, situações como fuga total ao tema, fuga ao tipo
              dissertativo-argumentativo, texto muito curto ou cópia dos textos motivadores zeram a redação inteira
              — não apenas o critério diretamente relacionado.
            </p>
          </div>
        </div>
      )}

      {correcao.reconciliacao && !correcao.reconciliacao.correcaoUnica && (
        <div className="p-4 rounded-xl border border-regua bg-folha/60 flex items-start gap-3">
          <Info className="w-4 h-4 text-azul shrink-0 mt-0.5" />
          <p className="text-xs text-tinta-fraca leading-relaxed">
            Esta nota é o resultado de <strong className="text-tinta-suave">duas correções independentes</strong>,
            reconciliadas (mesmo protocolo usado pela banca do ENEM: dois corretores, com um terceiro em caso de
            divergência). Notas obtidas nas correções individuais:{' '}
            <span className="font-mono">{correcao.reconciliacao.notasIndividuais.join(' / ')}</span>
            {correcao.reconciliacao.terceiraCorrecaoAcionada &&
              ' — a divergência entre as duas primeiras exigiu uma terceira correção de arbitragem.'}
          </p>
        </div>
      )}

      {/* Top Banner de Resumo da Nota */}
      <div className="glass-panel p-6 sm:p-8 rounded-xl border border-regua relative overflow-hidden">

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${classification.color}`}
              >
                {classification.label}
              </span>
              <span className="text-xs text-tinta-fraca flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(correcao.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-tinta">
              {redacao.titulo || 'Redação ENEM'}
            </h1>
            <p className="text-sm text-tinta-suave flex items-center gap-2">
              <Layers className="w-4 h-4 text-azul shrink-0" />
              <span>Tema: <strong>{redacao.tema}</strong></span>
            </p>
          </div>

          {/* Placar de Pontuação */}
          <div className="flex items-center gap-4 bg-folha/90 p-4 sm:p-5 rounded-xl border border-regua shadow-xl">
            <div className="text-center sm:text-right">
              <div className="text-xs text-tinta-fraca uppercase tracking-wider font-semibold">
                Nota Geral ENEM
              </div>
              <div className="text-4xl sm:text-5xl font-black gradient-text tracking-tight">
                {correcao.nota_geral}
              </div>
              <div className="text-[11px] text-tinta-fraca">de 1000 pontos possíveis</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-azul-claro border border-azul flex items-center justify-center">
              <Award className="w-7 h-7 text-azul" />
            </div>
          </div>
        </div>

        {/* Botões de Ação Topo */}
        <div className="relative mt-6 pt-6 border-t border-regua/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('analise')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'analise'
                  ? 'bg-azul text-folha shadow-md shadow-tinta/10'
                  : 'bg-folha text-tinta-fraca hover:text-tinta border border-regua'
              }`}
            >
              Análise & Competências
            </button>
            <button
              onClick={() => setActiveTab('reescrita')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'reescrita'
                  ? 'bg-azul text-folha shadow-md shadow-tinta/10'
                  : 'bg-folha text-tinta-fraca hover:text-tinta border border-regua'
              }`}
            >
              Versão Reescrita (Nota 1000)
            </button>
            <button
              onClick={() => setActiveTab('plano')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'plano'
                  ? 'bg-azul text-folha shadow-md shadow-tinta/10'
                  : 'bg-folha text-tinta-fraca hover:text-tinta border border-regua'
              }`}
            >
              Plano de Ação Pedagógico
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-folha-2 hover:bg-pauta text-tinta text-xs font-semibold border border-regua transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 text-azul" />
              <span>{isExportingPDF ? 'Gerando...' : 'Exportar PDF'}</span>
            </button>
            <Link
              href="/nova-redacao"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-azul hover:brightness-110 text-folha text-xs font-semibold hover:brightness-110 shadow-md shadow-tinta/10 transition-all"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Nova Redação</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Conteúdo das Abas */}
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
  );
}
