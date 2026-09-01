'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
} from 'recharts';
import { HistoricoItem, EstatisticasUsuario } from '@/types';
import { TrendingUp, Award, Target, Layers, Zap, Activity } from 'lucide-react';

interface GraficoEvolucaoProps {
  historico: HistoricoItem[];
  estatisticas: EstatisticasUsuario;
}

export function GraficoEvolucao({ historico, estatisticas }: GraficoEvolucaoProps) {
  const [activeCompetencias, setActiveCompetencias] = useState<{ [key: string]: boolean }>({
    nota_geral: true,
    c1: false,
    c2: false,
    c3: false,
    c4: false,
    c5: false,
  });

  const toggleLine = (key: string) => {
    setActiveCompetencias((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Radar Data calculation
  const radarData = [
    {
      competencia: 'C1 - Norma Culta',
      media: historico.length > 0 ? Math.round(historico.reduce((acc, h) => acc + h.c1, 0) / historico.length) : 0,
      max: 200,
    },
    {
      competencia: 'C2 - Tema & Repertório',
      media: historico.length > 0 ? Math.round(historico.reduce((acc, h) => acc + h.c2, 0) / historico.length) : 0,
      max: 200,
    },
    {
      competencia: 'C3 - Argumentação',
      media: historico.length > 0 ? Math.round(historico.reduce((acc, h) => acc + h.c3, 0) / historico.length) : 0,
      max: 200,
    },
    {
      competencia: 'C4 - Coesão',
      media: historico.length > 0 ? Math.round(historico.reduce((acc, h) => acc + h.c4, 0) / historico.length) : 0,
      max: 200,
    },
    {
      competencia: 'C5 - Intervenção',
      media: historico.length > 0 ? Math.round(historico.reduce((acc, h) => acc + h.c5, 0) / historico.length) : 0,
      max: 200,
    },
  ];

  if (historico.length === 0) {
    return (
      <div className="tech-card p-10 rounded-3xl border border-cyan-500/25 text-center space-y-4 hud-corner">
        <div className="w-12 h-12 rounded-2xl bg-[#040816] border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white font-heading">Nenhuma redação avaliada ainda</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
          Envie sua primeira redação para começar a acompanhar a telemetria evolutiva por competência.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="tech-card p-5 rounded-2xl border border-cyan-500/30 space-y-1 hud-corner">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
            <span>[ MÉDIA GERAL ]</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono text-glow-cyan">
            {estatisticas.media_geral} <span className="text-xs text-slate-400 font-normal">/1000</span>
          </div>
          <div className="text-[10px] font-mono text-cyan-400/80">BASE CONSOLIDADA</div>
        </div>

        <div className="tech-card p-5 rounded-2xl border border-emerald-500/30 space-y-1 hud-corner">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
            <span>[ RECORDE ]</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono text-glow-matrix">
            {estatisticas.maior_nota}
          </div>
          <div className="text-[10px] font-mono text-emerald-400/80">RECORDE PESSOAL</div>
        </div>

        <div className="tech-card p-5 rounded-2xl border border-indigo-500/30 space-y-1 hud-corner">
          <div className="flex items-center justify-between text-xs font-mono text-indigo-400">
            <span>[ ENSAIOS ]</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {estatisticas.total_redacoes}
          </div>
          <div className="text-[10px] font-mono text-slate-400">ENVIOS REGISTRADOS</div>
        </div>

        <div className="tech-card p-5 rounded-2xl border border-purple-500/30 space-y-1 hud-corner">
          <div className="flex items-center justify-between text-xs font-mono text-purple-400">
            <span>[ PONTO FORTE ]</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white truncate font-mono">
            {estatisticas.competencia_forte.nome.slice(0, 18)}
          </div>
          <div className="text-[10px] font-mono text-purple-400">
            MÉDIA: {estatisticas.competencia_forte.media} PTS
          </div>
        </div>
      </div>

      {/* Gráfico de Linha de Evolução */}
      <div className="tech-card p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-6 shadow-2xl hud-corner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-heading">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Telemetria Temporal da Pontuação
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Curva de desempenho por ensaio ao longo do tempo
            </p>
          </div>

          {/* Filtros de Linhas */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <button
              onClick={() => toggleLine('nota_geral')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeCompetencias.nota_geral
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'bg-[#030612] text-slate-400 border border-cyan-500/20'
              }`}
            >
              NOTA GERAL
            </button>
            <button
              onClick={() => toggleLine('c1')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeCompetencias.c1 ? 'bg-rose-500 text-white' : 'bg-[#030612] text-slate-400 border border-white/[0.06]'
              }`}
            >
              C1
            </button>
            <button
              onClick={() => toggleLine('c2')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeCompetencias.c2 ? 'bg-amber-500 text-black' : 'bg-[#030612] text-slate-400 border border-white/[0.06]'
              }`}
            >
              C2
            </button>
            <button
              onClick={() => toggleLine('c3')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeCompetencias.c3 ? 'bg-emerald-500 text-black' : 'bg-[#030612] text-slate-400 border border-white/[0.06]'
              }`}
            >
              C3
            </button>
            <button
              onClick={() => toggleLine('c4')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeCompetencias.c4 ? 'bg-purple-500 text-white' : 'bg-[#030612] text-slate-400 border border-white/[0.06]'
              }`}
            >
              C4
            </button>
            <button
              onClick={() => toggleLine('c5')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeCompetencias.c5 ? 'bg-pink-500 text-white' : 'bg-[#030612] text-slate-400 border border-white/[0.06]'
              }`}
            >
              C5
            </button>
          </div>
        </div>

        <div className="h-[320px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0b1736" />
              <XAxis dataKey="data" stroke="#475569" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis domain={[0, 1000]} stroke="#475569" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#030714',
                  borderColor: '#00f0ff',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  boxShadow: '0 0 20px rgba(0,240,255,0.2)',
                }}
              />
              {activeCompetencias.nota_geral && (
                <Line
                  type="monotone"
                  dataKey="nota_geral"
                  name="Nota Geral"
                  stroke="#00f0ff"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#00f0ff' }}
                  activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
                />
              )}
              {activeCompetencias.c1 && (
                <Line type="monotone" dataKey="c1" name="C1 (Norma)" stroke="#f43f5e" strokeWidth={2} />
              )}
              {activeCompetencias.c2 && (
                <Line type="monotone" dataKey="c2" name="C2 (Tema)" stroke="#f59e0b" strokeWidth={2} />
              )}
              {activeCompetencias.c3 && (
                <Line type="monotone" dataKey="c3" name="C3 (Argumentação)" stroke="#00ff88" strokeWidth={2} />
              )}
              {activeCompetencias.c4 && (
                <Line type="monotone" dataKey="c4" name="C4 (Coesão)" stroke="#a855f7" strokeWidth={2} />
              )}
              {activeCompetencias.c5 && (
                <Line type="monotone" dataKey="c5" name="C5 (Intervenção)" stroke="#ec4899" strokeWidth={2} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico Radar e Barras de Médias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="tech-card p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-4 shadow-2xl hud-corner">
          <h3 className="text-base font-bold text-white flex items-center gap-2 font-heading">
            <Target className="w-5 h-5 text-cyan-400" />
            Radar de Domínio das 5 Competências
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Equilíbrio da sua média entre as 5 áreas exigidas pelo ENEM
          </p>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="#0e1a38" />
                <PolarAngleAxis dataKey="competencia" stroke="#94a3b8" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <PolarRadiusAxis angle={30} domain={[0, 200]} stroke="#334155" />
                <Radar
                  name="Média Obtida"
                  dataKey="media"
                  stroke="#00f0ff"
                  fill="#00f0ff"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="tech-card p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-4 shadow-2xl hud-corner">
          <h3 className="text-base font-bold text-white flex items-center gap-2 font-heading">
            <Award className="w-5 h-5 text-indigo-400" />
            Pontuação Média por Eixo
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Comparativo direto do desempenho médio em cada competência (/200)
          </p>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0b1736" />
                <XAxis dataKey="competencia" stroke="#475569" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis domain={[0, 200]} stroke="#475569" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#030714',
                    borderColor: '#00f0ff',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="media" name="Média (pts)" fill="#00f0ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
