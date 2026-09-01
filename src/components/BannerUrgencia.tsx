'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Clock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export function BannerUrgencia() {
  const [timeLeft, setTimeLeft] = useState({
    dias: 68,
    horas: 14,
    minutos: 32,
    segundos: 45,
  });

  useEffect(() => {
    // Alvo: Primeiro domingo de Novembro de 2026
    const dataEnem = new Date('2026-11-08T13:00:00-03:00').getTime();

    const timer = setInterval(() => {
      const agora = new Date().getTime();
      const distancia = dataEnem - agora;

      if (distancia > 0) {
        setTimeLeft({
          dias: Math.floor(distancia / (1000 * 60 * 60 * 24)),
          horas: Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutos: Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60)),
          segundos: Math.floor((distancia % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-gradient-to-r from-[#140b03] via-[#091522] to-[#040816] border-b border-amber-500/30 px-4 py-2 text-xs text-slate-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> ENEM 2026 se aproximando:
          </span>
          <span className="text-slate-300 hidden md:inline">
            Cada redação corrigida agora vale até <strong>+160 pontos de vantagem no SISU</strong>.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-mono text-[11px] bg-[#02040a] px-2.5 py-1 rounded-lg border border-amber-500/30 text-amber-300">
            <span className="font-bold">{timeLeft.dias}d</span> :
            <span className="font-bold">{String(timeLeft.horas).padStart(2, '0')}h</span> :
            <span className="font-bold">{String(timeLeft.minutos).padStart(2, '0')}m</span> :
            <span className="font-bold text-amber-400">{String(timeLeft.segundos).padStart(2, '0')}s</span>
          </div>

          <Link
            href="/nova-redacao"
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors group"
          >
            <span>Treinar Agora</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
