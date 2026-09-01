'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Award, CheckCircle2, X } from 'lucide-react';

interface NotificacaoSocial {
  id: number;
  aluno: string;
  cidade: string;
  acao: string;
  tempo: string;
  icone: 'upgrade' | 'envio' | 'nota';
}

const NOTIFICACOES: NotificacaoSocial[] = [
  {
    id: 1,
    aluno: 'Lucas M.',
    cidade: 'São Paulo - SP',
    acao: 'acabou de desbloquear o Laudo Oficial Nota 1000',
    tempo: 'há 2 minutos',
    icone: 'upgrade',
  },
  {
    id: 2,
    aluno: 'Beatriz R.',
    cidade: 'Belo Horizonte - MG',
    acao: 'atingiu nota 960 no treino para Medicina',
    tempo: 'há 5 minutos',
    icone: 'nota',
  },
  {
    id: 3,
    aluno: 'Gabriel C.',
    cidade: 'Rio de Janeiro - RJ',
    acao: 'submeteu uma redação com 30 linhas oficiais',
    tempo: 'há 8 minutos',
    icone: 'envio',
  },
  {
    id: 4,
    aluno: 'Mariana S.',
    cidade: 'Curitiba - PR',
    acao: 'desbloqueou o comparativo SISU para Direito',
    tempo: 'há 11 minutos',
    icone: 'upgrade',
  },
];

export function ProvaSocialToast() {
  const [visivel, setVisivel] = useState(false);
  const [index, setIndex] = useState(0);
  const [fechadoManualmente, setFechadoManualmente] = useState(false);

  useEffect(() => {
    if (fechadoManualmente) return;

    // Mostra o primeiro após 4 segundos
    const initialTimeout = setTimeout(() => {
      setVisivel(true);
    }, 4000);

    const interval = setInterval(() => {
      setVisivel(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % NOTIFICACOES.length);
        setVisivel(true);
      }, 800);
    }, 14000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [fechadoManualmente]);

  if (fechadoManualmente || !visivel) return null;

  const notif = NOTIFICACOES[index];

  return (
    <div className="fixed bottom-5 left-5 z-40 max-w-sm w-full animate-fade-in pointer-events-auto">
      <div className="p-3.5 rounded-2xl bg-[#040816]/95 backdrop-blur-xl border border-cyan-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-black shrink-0 font-bold shadow-md shadow-cyan-500/20">
            {notif.icone === 'upgrade' ? <Sparkles className="w-4 h-4 text-black" /> : notif.icone === 'nota' ? <Award className="w-4 h-4 text-black" /> : <CheckCircle2 className="w-4 h-4 text-black" />}
          </div>

          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-1.5 text-slate-300">
              <strong className="text-white font-medium">{notif.aluno}</strong>
              <span className="text-[10px] text-slate-500">({notif.cidade})</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight font-sans">
              {notif.acao}
            </p>
            <span className="text-[10px] text-cyan-400 font-mono block">
              {notif.tempo}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFechadoManualmente(true)}
          className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
