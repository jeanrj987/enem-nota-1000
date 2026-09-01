'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PenTool,
  CheckCircle2,
  Award,
  Lightbulb,
  ShieldCheck,
  Clock,
  Sparkles,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Quote,
  Terminal,
  Cpu,
  Activity,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Editor } from '@/components/Editor';

function CronometroTreino() {
  const [segundos, setSegundos] = useState(60 * 60); // 60 minutos
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (ativo && segundos > 0) {
      interval = setInterval(() => {
        setSegundos((prev) => prev - 1);
      }, 1000);
    } else if (segundos === 0) {
      setAtivo(false);
    }
    return () => clearInterval(interval);
  }, [ativo, segundos]);

  const minutos = Math.floor(segundos / 60);
  const segRestantes = segundos % 60;
  const tempoFormatado = `${String(minutos).padStart(2, '0')}:${String(segRestantes).padStart(2, '0')}`;

  const resetTimer = () => {
    setAtivo(false);
    setSegundos(60 * 60);
  };

  return (
    <div className="tech-card p-5 rounded-2xl border border-cyan-500/30 space-y-3 hud-corner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>SIMULADOR DE TEMPO</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
          META: 60 MIN
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 bg-[#030612] p-3 rounded-xl border border-cyan-500/20">
        <div className="text-3xl font-black font-mono text-white tracking-widest text-glow-cyan">
          {tempoFormatado}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAtivo(!ativo)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
              ativo
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'btn-cyber-primary text-black'
            }`}
          >
            {ativo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{ativo ? 'PAUSAR' : 'INICIAR'}</span>
          </button>

          <button
            type="button"
            onClick={resetTimer}
            className="p-2 rounded-lg bg-[#070e20] text-slate-400 hover:text-white border border-cyan-500/20 transition-colors cursor-pointer"
            title="Resetar tempo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
        No dia da prova oficial do ENEM, o tempo ideal para planejamento, rascunho e versão definitiva é de 60 minutos.
      </p>
    </div>
  );
}

function NovaRedacaoContent() {
  const searchParams = useSearchParams();
  const temaParam = searchParams.get('tema') || '';

  return (
    <div className="space-y-8">
      {/* Top Header do Studio */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full cyber-badge text-xs">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>ESTÚDIO DE PRODUÇÃO TEXTUAL • BANCA INEP 2026</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-white">
            Laboratório de Escrita & Auditoria
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            Escreva diretamente no editor ou importe seu rascunho (PDF, Word, TXT ou foto) para receber o diagnóstico imediato.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna Principal: Editor Studio (8 colunas) */}
        <div className="lg:col-span-8">
          <Editor initialTema={temaParam} />
        </div>

        {/* Coluna Lateral: Guia Pedagógico da Banca (4 colunas) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Cronômetro Oficial */}
          <CronometroTreino />

          {/* Card: Checklist Nota 1000 */}
          <div className="tech-card p-6 rounded-2xl border border-cyan-500/30 space-y-4 hud-corner">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>CHECKLIST DE EXCELÊNCIA</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-300 font-sans">
              <li className="flex items-start gap-2.5 p-3 rounded-xl bg-[#030612] border border-cyan-500/20">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white font-mono">Estrutura Canônica:</strong> 1 Introdução (tese explícita), 2 Desenvolvimentos e 1 Conclusão.
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-3 rounded-xl bg-[#030612] border border-cyan-500/20">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white font-mono">Repertório Legitimado:</strong> Citações filosóficas, históricas ou constitucionais articuladas.
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-3 rounded-xl bg-[#030612] border border-cyan-500/20">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white font-mono">Conectivos Interparágrafos:</strong> Operadores argumentativos no início de D1, D2 e Conclusão.
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-3 rounded-xl bg-[#030612] border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-emerald-300 font-mono">5 Elementos na C5:</strong> Agente, Ação, Meio/Modo, Efeito e Detalhamento.
                </span>
              </li>
            </ul>
          </div>

          {/* Card: Repertórios Universais Rápidos */}
          <div className="tech-card p-6 rounded-2xl border border-cyan-500/30 space-y-3 hud-corner">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              <Quote className="w-4 h-4 text-cyan-400" />
              <span>BANCO DE REPERTÓRIOS CORINGA</span>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-[#030612] border border-cyan-500/20">
                <strong className="text-cyan-300 block font-mono">Constituição Federal de 1988:</strong>
                <span className="text-slate-400 text-[11px] font-sans">Art. 6º (Direitos Sociais) e Art. 227 (Prioridade Absoluta).</span>
              </div>
              <div className="p-3 rounded-lg bg-[#030612] border border-cyan-500/20">
                <strong className="text-cyan-300 block font-mono">Zygmunt Bauman (Modernidade Líquida):</strong>
                <span className="text-slate-400 text-[11px] font-sans">Fragilidade das relações e individualismo nas sociedades contemporâneas.</span>
              </div>
              <div className="p-3 rounded-lg bg-[#030612] border border-cyan-500/20">
                <strong className="text-cyan-300 block font-mono">Gilberto Dimenstein (Cidadão de Papel):</strong>
                <span className="text-slate-400 text-[11px] font-sans">Direitos garantidos formalmente na legislação, mas ineficazes na prática.</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function NovaRedacaoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#02040a] text-slate-100 font-sans selection:bg-cyan-400 selection:text-black relative">
      <div className="fixed inset-0 tech-grid-bg opacity-30 pointer-events-none z-0" />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <Suspense fallback={<div className="text-cyan-400 font-mono text-xs">CARREGANDO ESTÚDIO DE REDAÇÃO...</div>}>
          <NovaRedacaoContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
