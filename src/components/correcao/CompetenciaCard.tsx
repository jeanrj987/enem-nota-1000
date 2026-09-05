'use client';

import { Competencia } from '@/types';

interface CompetenciaCardProps {
  comp: Competencia;
}

/** Card de uma competência (nota, barra de progresso, comentário e pontos fortes). */
export function CompetenciaCard({ comp }: CompetenciaCardProps) {
  const porcentagem = (comp.nota / 200) * 100;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 space-y-3 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            {comp.nome}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {comp.descricao_curta}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-base font-extrabold text-white">{comp.nota}</span>
          <span className="text-xs text-slate-400">/200</span>
        </div>
      </div>

      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            comp.nota === 200
              ? 'bg-emerald-500'
              : comp.nota >= 160
              ? 'bg-blue-500'
              : comp.nota >= 120
              ? 'bg-amber-500'
              : 'bg-rose-500'
          }`}
          style={{ width: `${porcentagem}%` }}
        />
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        {comp.comentario}
      </p>

      {comp.pontos_fortes && comp.pontos_fortes.length > 0 && (
        <div className="pt-1 flex flex-wrap gap-1">
          {comp.pontos_fortes.map((p, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-[10px] text-emerald-300"
            >
              ✓ {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
