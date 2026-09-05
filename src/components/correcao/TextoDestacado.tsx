'use client';

import React from 'react';
import { ErroIdentificado } from '@/types';

interface TextoDestacadoProps {
  texto: string;
  erros: ErroIdentificado[];
  selectedErrorId: string | null;
  onSelectError: (id: string) => void;
}

const HIGHLIGHT_CLASS_POR_TIPO: Record<string, string> = {
  gramatica: 'highlight-gramatica',
  coesao: 'highlight-coesao',
  vocabulario: 'highlight-vocabulario',
  concordancia: 'highlight-concordancia',
};

/**
 * Renderiza o texto da redação com os erros marcados como <mark> clicáveis.
 * Extraído de CorrecaoView para isolar a lógica de realce de texto.
 */
export function TextoDestacado({ texto, erros, selectedErrorId, onSelectError }: TextoDestacadoProps) {
  if (!erros || erros.length === 0) {
    return (
      <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-200">
        {texto}
      </div>
    );
  }

  return (
    <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-200 space-y-4">
      {texto.split(/\n\s*\n/).map((paragrafo, pIdx) => {
        let parts: React.ReactNode[] = [paragrafo];

        erros.forEach((erro) => {
          const newParts: React.ReactNode[] = [];

          parts.forEach((part) => {
            if (typeof part === 'string' && part.includes(erro.trecho)) {
              const subParts = part.split(erro.trecho);
              subParts.forEach((sub, sIdx) => {
                newParts.push(sub);
                if (sIdx < subParts.length - 1) {
                  const isSelected = selectedErrorId === erro.id;
                  const highlightClass = HIGHLIGHT_CLASS_POR_TIPO[erro.tipo] ?? 'highlight-outro';

                  newParts.push(
                    <mark
                      key={`${erro.id}-${sIdx}`}
                      onClick={() => onSelectError(erro.id)}
                      className={`${highlightClass} ${isSelected ? 'ring-2 ring-white scale-105' : ''}`}
                      title={`Clique para ver a correção: ${erro.explicacao}`}
                    >
                      {erro.trecho}
                    </mark>
                  );
                }
              });
            } else {
              newParts.push(part);
            }
          });

          parts = newParts;
        });

        return (
          <p key={pIdx} className="leading-relaxed">
            {parts}
          </p>
        );
      })}
    </div>
  );
}
