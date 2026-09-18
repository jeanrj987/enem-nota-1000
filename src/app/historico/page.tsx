'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Search,
  BookOpen,
  PenTool,
  ChevronRight,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { RequerAssinatura } from '@/components/RequerAssinatura';
import { GraficoEvolucao } from '@/components/GraficoEvolucao';
import { getRedacoesSalvas, calcularEstatisticas, gerarHistoricoGraficos } from '@/lib/storage';
import { Redacao, HistoricoItem, EstatisticasUsuario } from '@/types';

export default function HistoricoPage() {
  const [redacoes, setRedacoes] = useState<Redacao[]>([]);
  const [historicoGrafico, setHistoricoGrafico] = useState<HistoricoItem[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasUsuario | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroFaixa, setFiltroFaixa] = useState<'todas' | '900+' | '800+' | '<800'>('todas');

  useEffect(() => {
    getRedacoesSalvas().then((list) => {
      setRedacoes(list);
      setHistoricoGrafico(gerarHistoricoGraficos(list));
      setEstatisticas(calcularEstatisticas(list));
    });
  }, []);

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
    <div className="min-h-screen flex flex-col bg-papel text-tinta">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        <RequerAssinatura>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-regua/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-azul uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Análise de Desempenho & Métricas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-tinta">
              Histórico & Evolução Pedagógica
            </h1>
            <p className="text-xs sm:text-sm text-tinta-fraca">
              Visualize seu progresso contínuo em cada uma das 5 competências do ENEM.
            </p>
          </div>

          <Link
            href="/nova-redacao"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-azul hover:brightness-110 text-folha text-xs font-bold shadow-lg shadow-tinta/10 transition-all self-start md:self-auto"
          >
            <PenTool className="w-4 h-4" />
            <span>Treinar Nova Redação</span>
          </Link>
        </div>

        {/* Gráficos de Evolução Interativos */}
        {estatisticas && (
          <GraficoEvolucao historico={historicoGrafico} estatisticas={estatisticas} />
        )}

        {/* Tabela Detalhada de Histórico */}
        <div className="glass-panel p-6 sm:p-8 rounded-xl border border-regua space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-tinta flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-azul" />
                Registros de Ensaios Anteriores
              </h2>
              <p className="text-xs text-tinta-fraca">
                Histórico detalhado com abertura de notas por competência
              </p>
            </div>

            {/* Filtros e Busca */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-tinta-fraca absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por tema..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="bg-folha/90 border border-regua rounded-xl pl-8 pr-3 py-1.5 text-xs text-tinta placeholder-tinta-fraca focus:outline-none focus:border-azul"
                />
              </div>

              <select
                value={filtroFaixa}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFiltroFaixa(e.target.value as 'todas' | '900+' | '800+' | '<800')
                }
                className="bg-folha/90 border border-regua rounded-xl px-3 py-1.5 text-xs text-tinta-suave focus:outline-none focus:border-azul"
              >
                <option value="todas">Todas as notas</option>
                <option value="900+">Excelentes (900+)</option>
                <option value="800+">Boas (800 a 880)</option>
                <option value="<800">Menores que 800</option>
              </select>
            </div>
          </div>

          {redacoesFiltradas.length === 0 ? (
            <div className="text-center py-10 text-xs text-tinta-fraca">
              Nenhuma redação corresponde aos filtros de busca aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-regua/80 text-tinta-fraca uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Tema da Redação</th>
                    <th className="py-3 px-2 text-center" title="Competência 1: Norma Culta">C1</th>
                    <th className="py-3 px-2 text-center" title="Competência 2: Tema e Repertório">C2</th>
                    <th className="py-3 px-2 text-center" title="Competência 3: Argumentação">C3</th>
                    <th className="py-3 px-2 text-center" title="Competência 4: Coesão">C4</th>
                    <th className="py-3 px-2 text-center" title="Competência 5: Proposta">C5</th>
                    <th className="py-3 px-4 text-center">Nota Final</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-regua/50">
                  {redacoesFiltradas.map((red) => {
                    const c = red.correcao;
                    const getC = (num: number) => c?.competencias.find((comp) => comp.numero === num)?.nota || 0;
                    const nota = c?.nota_geral || 0;

                    return (
                      <tr key={red.id} className="hover:bg-folha/40 transition-colors">
                        <td className="py-3.5 px-4 text-tinta-fraca whitespace-nowrap">
                          {new Date(red.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-tinta line-clamp-1">
                            {red.titulo || 'Redação ENEM'}
                          </div>
                          <div className="text-[11px] text-tinta-fraca line-clamp-1">{red.tema}</div>
                        </td>
                        <td className="py-3.5 px-2 text-center font-medium text-tinta-suave">{getC(1)}</td>
                        <td className="py-3.5 px-2 text-center font-medium text-tinta-suave">{getC(2)}</td>
                        <td className="py-3.5 px-2 text-center font-medium text-tinta-suave">{getC(3)}</td>
                        <td className="py-3.5 px-2 text-center font-medium text-tinta-suave">{getC(4)}</td>
                        <td className="py-3.5 px-2 text-center font-medium text-tinta-suave">{getC(5)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                              nota >= 900
                                ? 'bg-verde-claro text-verde border border-verde/30'
                                : nota >= 800
                                ? 'bg-vermelho-claro text-vermelho border border-vermelho/30'
                                : 'bg-ambar-claro text-ambar border border-ambar/30'
                            }`}
                          >
                            {nota}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/correcao/${red.id}`}
                            className="inline-flex items-center gap-1 text-xs text-azul hover:text-azul font-semibold transition-colors"
                          >
                            <span>Ver Detalhes</span>
                            <ChevronRight className="w-3.5 h-3.5" />
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
        </RequerAssinatura>
      </main>

      <Footer />
    </div>
  );
}
