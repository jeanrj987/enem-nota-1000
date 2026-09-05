'use client';

import { Sparkles } from 'lucide-react';

interface ModalCarregamentoProps {
  loadingTips: string[];
  loadingStep: number;
}

/** Overlay de carregamento exibido enquanto a IA corrige a redação. */
export function ModalCarregamento({ loadingTips, loadingStep }: ModalCarregamentoProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-blue-500/30 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mx-auto shadow-inner">
          <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Corrigindo com Inteligência Artificial</h3>
          <p className="text-sm text-slate-300 animate-fade-in font-medium min-h-[48px] flex items-center justify-center">
            {loadingTips[loadingStep]}
          </p>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500"
            style={{ width: `${((loadingStep + 1) / loadingTips.length) * 100}%` }}
          />
        </div>

        <p className="text-xs text-slate-400">
          Tempo médio de análise: ~5 a 15 segundos
        </p>
      </div>
    </div>
  );
}
