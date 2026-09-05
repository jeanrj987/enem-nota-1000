'use client';

import { Check, Copy, Sparkles } from 'lucide-react';

interface AbaReescritaProps {
  versaoReescrita: string;
  copied: boolean;
  onCopy: () => void;
}

export function AbaReescrita({ versaoReescrita, copied, onCopy }: AbaReescritaProps) {
  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Versão Reescrita Sugerida (Padrão Nota 1000)
          </h2>
          <p className="text-xs text-slate-400">
            Uma versão aprimorada da sua redação mantendo sua autoria, mas ajustando a norma culta, coesão e repertórios para excelência.
          </p>
        </div>

        <button
          onClick={onCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all self-start sm:self-auto cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
          <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-900 font-sans leading-relaxed text-slate-200 text-sm whitespace-pre-wrap space-y-4">
        {versaoReescrita}
      </div>
    </div>
  );
}
