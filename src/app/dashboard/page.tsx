'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PenTool,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Target,
  Clock,
  ChevronRight,
  BarChart2,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getRedacoesSalvas, calcularEstatisticas } from '@/lib/storage';
import { Redacao, EstatisticasUsuario } from '@/types';

export default function DashboardPage() {
  const [redacoes, setRedacoes] = useState<Redacao[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasUsuario | null>(null);

  useEffect(() => {
    getRedacoesSalvas().then((list) => {
      setRedacoes(list);
      setEstatisticas(calcularEstatisticas(list));
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Header de Boas-Vindas */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Painel do Estudante
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Gerencie suas produções textuais e acompanhe seu progresso para o ENEM.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/historico"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Ver Gráficos</span>
            </Link>
            <Link
              href="/nova-redacao"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <PenTool className="w-4 h-4" />
              <span>Escrever Nova Redação</span>
            </Link>
          </div>
        </div>

        {/* Métricas e Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Média das Redações</span>
                <Target className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {estatisticas.media_geral}{' '}
                <span className="text-xs text-slate-400 font-normal">/ 1000</span>
              </div>
              <div className="text-[11px] text-blue-400 font-medium">
                Desempenho consolidado
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Recorde Pessoal</span>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                {estatisticas.maior_nota}
              </div>
              <div className="text-[11px] text-emerald-500 font-medium">
                Maior nota alcançada
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total de Ensaios</span>
                <BookOpen className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {estatisticas.total_redacoes}
              </div>
              <div className="text-[11px] text-slate-400">Redações avaliadas</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Competência Forte</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-sm font-bold text-white truncate">
                {estatisticas.competencia_forte.nome}
              </div>
              <div className="text-[11px] text-purple-400 font-medium">
                Média: {estatisticas.competencia_forte.media} pts
              </div>
            </div>
          </div>
        )}

        {/* Banner de Ação Rápida */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Treino Diário Recomendado
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Pratique agora com temas inéditos para 2025
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Escreva no editor ou submeta seu rascunho em PDF/DOCX. Nossa IA devolve a nota e a versão reescrita instantaneamente.
            </p>
          </div>

          <Link
            href="/nova-redacao"
            className="shrink-0 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <PenTool className="w-4 h-4" />
            <span>Iniciar Redação</span>
          </Link>
        </div>

        {/* Lista de Redações Recentes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Minhas Redações Enviadas
            </h2>
            <span className="text-xs text-slate-400">
              {redacoes.length} {redacoes.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {redacoes.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Nenhuma redação encontrada</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Você ainda não enviou redações para correção. Clique no botão abaixo para escrever ou enviar sua primeira proposta.
              </p>
              <Link
                href="/nova-redacao"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md"
              >
                <PenTool className="w-4 h-4" />
                <span>Escrever Minha Primeira Redação</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {redacoes.map((red) => {
                const nota = red.correcao?.nota_geral || 0;
                return (
                  <div
                    key={red.id}
                    className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(red.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950/60 text-blue-400 border border-blue-800/40">
                          {nota} / 1000
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {red.titulo || 'Redação ENEM'}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2">
                        <strong>Tema:</strong> {red.tema}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <span>{red.palavras_count} palavras</span>
                        <span>•</span>
                        <span>~{red.linhas_count} linhas</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <Link
                        href={`/correcao/${red.id}`}
                        className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors text-center flex items-center justify-center gap-1.5"
                      >
                        <span>Ver Correção</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>

                      <Link
                        href={`/nova-redacao?tema=${encodeURIComponent(red.tema)}`}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-blue-400 border border-slate-800 transition-colors"
                        title="Reescrever este tema"
                      >
                        <PenTool className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
