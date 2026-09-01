'use client';

import React, { useState } from 'react';
import { Award, Target, CheckCircle2, AlertTriangle, Sparkles, Lock, ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { LISTA_CURSOS_SISU, CursoSisu } from '@/lib/storage';

interface SimuladorSisuProps {
  notaRedacao: number;
  planoAtivo: boolean;
  onSolicitarUpgrade: () => void;
}

export function SimuladorSisu({ notaRedacao, planoAtivo, onSolicitarUpgrade }: SimuladorSisuProps) {
  const [cursoSelecionado, setCursoSelecionado] = useState<CursoSisu>(LISTA_CURSOS_SISU[0]);

  const notaEfetiva = planoAtivo && notaRedacao > 0 ? notaRedacao : 840;
  const diferenca = notaEfetiva - cursoSelecionado.corte_redacao_recomendado;
  const porcentagemCompetitividade = Math.min(100, Math.round((notaEfetiva / cursoSelecionado.corte_redacao_recomendado) * 100));

  return (
    <div className="tech-card p-6 sm:p-8 rounded-3xl border border-indigo-500/40 space-y-6 shadow-2xl relative overflow-hidden bg-gradient-to-b from-[#060a1c] to-[#02040a]">
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header do Simulador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wide">
            <GraduationCap className="w-4 h-4" />
            <span>Simulador Oficial de Aprovação SISU / Faculdades Públicas</span>
          </div>
          <p className="text-xs text-slate-300 font-sans">
            Selecione a universidade e o curso dos seus sonhos para calcular sua margem de aprovação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={cursoSelecionado.id}
            onChange={(e) => {
              const match = LISTA_CURSOS_SISU.find((c) => c.id === e.target.value);
              if (match) setCursoSelecionado(match);
            }}
            className="bg-[#030612] border border-indigo-500/30 rounded-xl px-3.5 py-2 text-xs text-white font-medium focus:outline-none focus:border-indigo-400 cursor-pointer"
          >
            {LISTA_CURSOS_SISU.map((curso) => (
              <option key={curso.id} value={curso.id} className="bg-[#030612] text-white">
                {curso.nome} • {curso.universidade} ({curso.dificuldade})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Card de Diagnóstico do Curso */}
      <div className="relative z-10">
        {planoAtivo && notaRedacao > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Bloco 1: Curso e Corte */}
            <div className="p-5 rounded-2xl bg-[#030612] border border-indigo-500/25 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Curso Alvo
              </span>
              <div className="font-heading text-lg font-bold text-white">
                {cursoSelecionado.nome}
              </div>
              <div className="text-xs text-indigo-300">
                {cursoSelecionado.universidade} • {cursoSelecionado.campus}
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-white/[0.05]">
                Corte Geral SISU: <strong>{cursoSelecionado.corte_geral} pts</strong>
              </div>
            </div>

            {/* Bloco 2: Exigência de Redação */}
            <div className="p-5 rounded-2xl bg-[#030612] border border-indigo-500/25 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Meta de Redação (SISU)
              </span>
              <div className="font-mono text-2xl font-black text-indigo-400">
                {cursoSelecionado.corte_redacao_recomendado} <span className="text-xs text-slate-400 font-sans font-normal">pts</span>
              </div>
              <div className="text-xs text-slate-300 font-sans">
                Peso da redação no cálculo: <strong>Peso {cursoSelecionado.peso_redacao}</strong>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-white/[0.05]">
                Competitividade: <span className="text-emerald-400 font-bold">{porcentagemCompetitividade}% da meta</span>
              </div>
            </div>

            {/* Bloco 3: Veredito */}
            <div className={`p-5 rounded-2xl border space-y-2 ${
              diferenca >= 0
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                {diferenca >= 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {diferenca >= 0 ? 'Faixa de Aprovação' : 'Ajuste de Pontos'}
              </span>
              <div className="font-mono text-2xl font-black">
                {diferenca >= 0 ? `+${diferenca} pts` : `${diferenca} pts`}
              </div>
              <p className="text-xs text-slate-200 font-sans leading-snug">
                {diferenca >= 0
                  ? `Sua nota (${notaEfetiva} pts) atinge a margem de segurança para ${cursoSelecionado.nome} no SISU!`
                  : `Faltam ${Math.abs(diferenca)} pontos na redação para alcançar a nota de corte recomendada.`}
              </p>
            </div>

          </div>
        ) : (
          /* Preview Protegido para Contas Gratuitas */
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 filter blur-md select-none pointer-events-none">
              <div className="p-5 rounded-2xl bg-[#030612] border border-indigo-500/25 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Curso Alvo</span>
                <div className="font-heading text-lg font-bold text-white">{cursoSelecionado.nome}</div>
                <div className="text-xs text-indigo-300">{cursoSelecionado.universidade}</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#030612] border border-indigo-500/25 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Meta de Redação</span>
                <div className="font-mono text-2xl font-black text-indigo-400">960 pts</div>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                <span className="text-[11px] font-bold uppercase block">Margem de Aprovação</span>
                <div className="font-mono text-2xl font-black">+40 pts</div>
              </div>
            </div>

            <div className="absolute inset-0 z-20 backdrop-blur-sm bg-black/60 flex flex-col items-center justify-center p-6 text-center space-y-3 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-heading text-base sm:text-lg font-bold text-white">
                Simulador SISU {cursoSelecionado.nome} Bloqueado
              </h4>
              <p className="text-xs text-slate-300 max-w-md font-sans">
                Descubra sua margem exata de aprovação em <strong>{cursoSelecionado.nome} ({cursoSelecionado.universidade})</strong> desbloqueando o laudo oficial.
              </p>
              <button
                type="button"
                onClick={onSolicitarUpgrade}
                className="btn-cyber-primary px-5 py-2.5 rounded-xl font-heading font-black text-xs flex items-center gap-2 shadow-xl hover:scale-105 transition-transform cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>LIBERAR SIMULADOR SISU (R$ 19,90)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
