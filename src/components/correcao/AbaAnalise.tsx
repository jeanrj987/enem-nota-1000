'use client';

import { Award, BookOpen, Sparkles } from 'lucide-react';
import { Correcao } from '@/types';
import { TextoDestacado } from './TextoDestacado';
import { CompetenciaCard } from './CompetenciaCard';

interface AbaAnaliseProps {
  correcao: Correcao;
  textoOriginal: string;
  selectedErrorId: string | null;
  onSelectError: (id: string | null) => void;
}

export function AbaAnalise({ correcao, textoOriginal, selectedErrorId, onSelectError }: AbaAnaliseProps) {
  const selectedError = correcao.erros.find((e) => e.id === selectedErrorId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Coluna Esquerda: Texto com Erros Destacados (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Texto Original da Redação</h3>
            </div>
            <span className="text-xs text-slate-400">
              {correcao.erros?.length || 0} oportunidades de melhoria
            </span>
          </div>

          {/* Legenda de cores */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pb-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Gramática
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Coesão
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Vocabulário
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Concordância
            </span>
          </div>

          {/* Conteúdo com realces */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-900 max-h-[600px] overflow-y-auto font-sans">
            <TextoDestacado
              texto={textoOriginal}
              erros={correcao.erros}
              selectedErrorId={selectedErrorId}
              onSelectError={onSelectError}
            />
          </div>

          {/* Detalhe do Erro Selecionado */}
          {selectedError && (
            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Oportunidade de Ajuste ({selectedError.tipo})
                </span>
                <button
                  onClick={() => onSelectError(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Fechar
                </button>
              </div>
              <div className="text-xs text-slate-200">
                <strong>Trecho original:</strong> <span className="line-through text-red-300">"{selectedError.trecho}"</span>
              </div>
              <div className="text-xs text-emerald-300">
                <strong>Sugestão:</strong> "{selectedError.correcao}"
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {selectedError.explicacao}
              </p>
            </div>
          )}
        </div>

        {/* Feedback Pedagógico Rápido */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Parecer Geral da Banca Especialista</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {correcao.feedback_pedagogico}
          </p>
        </div>
      </div>

      {/* Coluna Direita: As 5 Competências do ENEM (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-400" />
          Detalhamento por Competência
        </h3>

        {correcao.competencias.map((comp) => (
          <CompetenciaCard key={comp.numero} comp={comp} />
        ))}
      </div>
    </div>
  );
}
