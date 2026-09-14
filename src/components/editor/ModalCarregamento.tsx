'use client';

import { Sparkles } from 'lucide-react';

interface ModalCarregamentoProps {
  loadingTips: string[];
  loadingStep: number;
}

/** Overlay de carregamento exibido enquanto a IA corrige a redação. */
export function ModalCarregamento({ loadingTips, loadingStep }: ModalCarregamentoProps) {
  return (
    <div className="fixed inset-0 z-50 bg-papel/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel p-8 rounded-sm border border-vermelho text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-sm bg-vermelho-claro border border-vermelho flex items-center justify-center mx-auto shadow-inner">
          <Sparkles className="w-8 h-8 text-vermelho animate-pulse" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-tinta">Corrigindo sua redação</h3>
          <p className="text-sm text-tinta-suave animate-fade-in font-medium min-h-[48px] flex items-center justify-center">
            {loadingTips[loadingStep]}
          </p>
        </div>

        <div className="w-full bg-folha-2 rounded-full h-2 overflow-hidden">
          <div
            className="bg-vermelho hover:bg-vermelho-escuro h-full transition-all duration-500"
            style={{ width: `${((loadingStep + 1) / loadingTips.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
