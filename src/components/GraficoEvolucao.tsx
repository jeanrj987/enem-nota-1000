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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
} from 'recharts';
import { HistoricoItem, EstatisticasUsuario } from '@/types';
import { TrendingUp, Award, Target, Layers, Zap } from 'lucide-react';

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
      media: historico.length > 0 ? Math.round(historico.reduce((acc, h) => acc + h.c1, 0) / historico.length) : 160,
      max: 200,
    },
    {
      competencia: 'C2 - Tema e Repertório',
      media: historico.length > 0 ? Math.round(historico.reduce((acc, h) => acc + h.c2, 0) / historico.length) : 180,
      max: 200,
    },
    {
      competencia: 'C3 - Argumentação',
      media: historico.length > 0 ? Math.round(historico.reduce((acc, h) => acc + h.c3, 0) / historico.length) : 160,
      max: 200,
    },
    {
      competencia: 'C4 - Coesão',
      media: historico.length > 0 ? Math.round(historico.reduce((acc, h) => acc + h.c4, 0) / historico.length) : 180,
      max: 200,
    },
    {
      competencia: 'C5 - Intervenção',
      media: historico.length > 0 ? Math.round(historico.reduce((acc, h) => acc + h.c5, 0) / historico.length) : 160,
      max: 200,
    },
  ];

  if (historico.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-xl border border-regua text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-azul-claro border border-azul flex items-center justify-center mx-auto">
          <TrendingUp className="w-6 h-6 text-azul" />
        </div>
        <h3 className="text-base font-bold text-tinta">Nenhuma redação avaliada ainda</h3>
        <p className="text-xs text-tinta-fraca max-w-sm mx-auto">
          Envie sua primeira redação para começar a acompanhar seu gráfico de evolução por competência.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-xl border border-regua space-y-1">
          <div className="flex items-center justify-between text-xs text-tinta-fraca">
            <span>Média Geral</span>
            <Target className="w-4 h-4 text-azul" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-tinta">
            {estatisticas.media_geral} <span className="text-xs text-tinta-fraca font-normal">/1000</span>
          </div>
          <div className="text-[11px] text-azul font-medium">Todas as redações</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-regua space-y-1">
          <div className="flex items-center justify-between text-xs text-tinta-fraca">
            <span>Maior Nota</span>
            <Award className="w-4 h-4 text-verde" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-verde">
            {estatisticas.maior_nota}
          </div>
          <div className="text-[11px] text-verde font-medium">Recorde pessoal</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-regua space-y-1">
          <div className="flex items-center justify-between text-xs text-tinta-fraca">
            <span>Redações Escritas</span>
            <Layers className="w-4 h-4 text-azul" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-tinta">
            {estatisticas.total_redacoes}
          </div>
          <div className="text-[11px] text-tinta-fraca">Ensaios avaliados</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-regua space-y-1">
          <div className="flex items-center justify-between text-xs text-tinta-fraca">
            <span>Ponto Forte</span>
            <Zap className="w-4 h-4 text-azul" />
          </div>
          <div className="text-sm font-bold text-tinta truncate">
            {estatisticas.competencia_forte.nome.slice(0, 16)}...
          </div>
          <div className="text-[11px] text-azul font-medium">
            Média: {estatisticas.competencia_forte.media} pts
          </div>
        </div>
      </div>

      {/* Gráfico de Linha de Evolução */}
      <div className="glass-panel p-6 sm:p-8 rounded-xl border border-regua space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-tinta flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-azul" />
              Evolução Temporal da Pontuação
            </h3>
            <p className="text-xs text-tinta-fraca">
              Acompanhe sua trajetória de notas ao longo do tempo
            </p>
          </div>

          {/* Filtros de Linhas */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => toggleLine('nota_geral')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeCompetencias.nota_geral
                  ? 'bg-azul text-folha shadow-sm'
                  : 'bg-folha text-tinta-fraca border border-regua'
              }`}
            >
              Nota Geral
            </button>
            <button
              onClick={() => toggleLine('c1')}
              className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
                activeCompetencias.c1
                  ? 'bg-azul text-folha'
                  : 'bg-folha text-tinta-fraca border border-regua'
              }`}
            >
              C1
            </button>
            <button
              onClick={() => toggleLine('c2')}
              className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
                activeCompetencias.c2
                  ? 'bg-ambar text-tinta'
                  : 'bg-folha text-tinta-fraca border border-regua'
              }`}
            >
              C2
            </button>
            <button
              onClick={() => toggleLine('c3')}
              className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
                activeCompetencias.c3
                  ? 'bg-verde text-tinta'
                  : 'bg-folha text-tinta-fraca border border-regua'
              }`}
            >
              C3
            </button>
            <button
              onClick={() => toggleLine('c4')}
              className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
                activeCompetencias.c4
                  ? 'bg-azul text-folha'
                  : 'bg-folha text-tinta-fraca border border-regua'
              }`}
            >
              C4
            </button>
            <button
              onClick={() => toggleLine('c5')}
              className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
                activeCompetencias.c5
                  ? 'bg-azul text-folha'
                  : 'bg-folha text-tinta-fraca border border-regua'
              }`}
            >
              C5
            </button>
          </div>
        </div>

        <div className="h-[320px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="data" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 1000]} stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              {activeCompetencias.nota_geral && (
                <Line
                  type="monotone"
                  dataKey="nota_geral"
                  name="Nota Geral (0-1000)"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#3b82f6' }}
                  activeDot={{ r: 7 }}
                />
              )}
              {activeCompetencias.c1 && (
                <Line type="monotone" dataKey="c1" name="C1 (Norma Culta)" stroke="#ef4444" strokeWidth={2} />
              )}
              {activeCompetencias.c2 && (
                <Line type="monotone" dataKey="c2" name="C2 (Tema e Repertório)" stroke="#f59e0b" strokeWidth={2} />
              )}
              {activeCompetencias.c3 && (
                <Line type="monotone" dataKey="c3" name="C3 (Argumentação)" stroke="#10b981" strokeWidth={2} />
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

      {/* Gráfico Radar de Competências */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 sm:p-8 rounded-xl border border-regua space-y-4">
          <h3 className="text-base font-bold text-tinta flex items-center gap-2">
            <Target className="w-5 h-5 text-azul" />
            Radar de Domínio das 5 Competências
          </h3>
          <p className="text-xs text-tinta-fraca">
            Equilíbrio da sua média entre as 5 áreas exigidas pelo ENEM
          </p>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="competencia" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 200]} stroke="#475569" />
                <Radar
                  name="Média Obtida"
                  dataKey="media"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Barras de Média por Competência */}
        <div className="glass-panel p-6 sm:p-8 rounded-xl border border-regua space-y-4">
          <h3 className="text-base font-bold text-tinta flex items-center gap-2">
            <Award className="w-5 h-5 text-azul" />
            Pontuação Média por Eixo
          </h3>
          <p className="text-xs text-tinta-fraca">
            Comparativo direto do desempenho médio em cada competência (/200)
          </p>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="competencia" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 200]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="media" name="Média (pts)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
