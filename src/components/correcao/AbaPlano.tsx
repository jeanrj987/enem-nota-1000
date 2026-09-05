'use client';

import { CheckCircle2, Sparkles } from 'lucide-react';

interface AbaPlanoProps {
  pontosPositivos: string[];
  proximosPassos: string[];
}

export function AbaPlano({ pontosPositivos, proximosPassos }: AbaPlanoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Pontos Positivos & Acertos do Texto
        </h3>
        <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
          {pontosPositivos?.map((ponto, idx) => (
            <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                {idx + 1}
              </span>
              <span>{ponto}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-blue-400 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Próximos Passos para o 960+
        </h3>
        <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
          {proximosPassos?.map((passo, idx) => (
            <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                {idx + 1}
              </span>
              <span>{passo}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
