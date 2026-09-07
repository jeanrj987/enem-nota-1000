'use client';

import { Competencia } from '@/types';

interface CompetenciaCardProps {
  comp: Competencia;
}

/** Card de uma competência (nota, barra de progresso, comentário e pontos fortes). */
export function CompetenciaCard({ comp }: CompetenciaCardProps) {
  const porcentagem = (comp.nota / 200) * 100;

  return (
    <div className="glass-panel p-5 rounded-sm border border-regua/90 space-y-3 hover:border-regua transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-bold text-vermelho uppercase tracking-wider">
            {comp.nome}
          </div>
          <div className="text-xs text-tinta-fraca mt-0.5">
            {comp.descricao_curta}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-base font-extrabold text-tinta">{comp.nota}</span>
          <span className="text-xs text-tinta-fraca">/200</span>
        </div>
      </div>

      <div className="w-full bg-folha rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            comp.nota === 200
              ? 'bg-verde'
              : comp.nota >= 160
              ? 'bg-vermelho'
              : comp.nota >= 120
              ? 'bg-ambar'
              : 'bg-vermelho'
          }`}
          style={{ width: `${porcentagem}%` }}
        />
      </div>

      <p className="text-xs text-tinta-suave leading-relaxed">
        {comp.comentario}
      </p>

      {comp.pontos_fortes && comp.pontos_fortes.length > 0 && (
        <div className="pt-1 flex flex-wrap gap-1">
          {comp.pontos_fortes.map((p, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-verde-claro border border-verde/30 text-[10px] text-verde"
            >
              ✓ {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
