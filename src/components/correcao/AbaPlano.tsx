'use client';

import { CheckCircle2, Sparkles } from 'lucide-react';

interface AbaPlanoProps {
  pontosPositivos: string[];
  proximosPassos: string[];
}

export function AbaPlano({ pontosPositivos, proximosPassos }: AbaPlanoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="glass-panel p-6 sm:p-8 rounded-sm border border-regua space-y-4">
        <h3 className="text-base font-bold text-verde flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Pontos Positivos & Acertos do Texto
        </h3>
        <ul className="space-y-3 text-xs sm:text-sm text-tinta-suave">
          {pontosPositivos?.map((ponto, idx) => (
            <li key={idx} className="flex items-start gap-2.5 p-3 rounded-sm bg-folha/60 border border-regua">
              <span className="w-5 h-5 rounded-full bg-verde-claro text-verde flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                {idx + 1}
              </span>
              <span>{ponto}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-sm border border-regua space-y-4">
        <h3 className="text-base font-bold text-vermelho flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Próximos Passos para o 960+
        </h3>
        <ul className="space-y-3 text-xs sm:text-sm text-tinta-suave">
          {proximosPassos?.map((passo, idx) => (
            <li key={idx} className="flex items-start gap-2.5 p-3 rounded-sm bg-folha/60 border border-regua">
              <span className="w-5 h-5 rounded-full bg-vermelho-claro text-vermelho flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
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
