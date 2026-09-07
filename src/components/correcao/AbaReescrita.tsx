'use client';

import { Check, Copy, Sparkles } from 'lucide-react';

interface AbaReescritaProps {
  versaoReescrita: string;
  copied: boolean;
  onCopy: () => void;
}

export function AbaReescrita({ versaoReescrita, copied, onCopy }: AbaReescritaProps) {
  return (
    <div className="glass-panel p-6 sm:p-8 rounded-sm border border-regua space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-regua pb-4">
        <div>
          <h2 className="text-lg font-bold text-tinta flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-vermelho" />
            Versão Reescrita Sugerida (Padrão Nota 1000)
          </h2>
          <p className="text-xs text-tinta-fraca">
            Uma versão aprimorada da sua redação mantendo sua autoria, mas ajustando a norma culta, coesão e repertórios para excelência.
          </p>
        </div>

        <button
          onClick={onCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-sm bg-folha-2 hover:bg-pauta text-tinta text-xs font-semibold border border-regua transition-all self-start sm:self-auto cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-verde" /> : <Copy className="w-4 h-4 text-vermelho" />}
          <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
        </button>
      </div>

      <div className="p-6 rounded-sm bg-papel/80 border border-regua font-sans leading-relaxed text-tinta text-sm whitespace-pre-wrap space-y-4">
        {versaoReescrita}
      </div>
    </div>
  );
}
