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
        <div className="glass-panel p-6 rounded-sm border border-regua space-y-4">
          <div className="flex items-center justify-between border-b border-regua/80 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-vermelho" />
              <h3 className="text-sm font-bold text-tinta">Texto Original da Redação</h3>
            </div>
            <span className="text-xs text-tinta-fraca">
              {correcao.erros?.length || 0} oportunidades de melhoria
            </span>
          </div>

          {/* Legenda de cores */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-tinta-fraca pb-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-vermelho" /> Gramática
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-ambar" /> Coesão
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-vermelho" /> Vocabulário
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-vermelho" /> Concordância
            </span>
          </div>

          {/* Conteúdo com realces */}
          <div className="p-4 rounded-sm bg-papel/70 border border-regua max-h-[600px] overflow-y-auto font-sans">
            <TextoDestacado
              texto={textoOriginal}
              erros={correcao.erros}
              selectedErrorId={selectedErrorId}
              onSelectError={onSelectError}
            />
          </div>

          {/* Detalhe do Erro Selecionado */}
          {selectedError && (
            <div className="p-4 rounded-sm bg-vermelho-claro border border-vermelho/30 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-vermelho uppercase tracking-wider">
                  Oportunidade de Ajuste ({selectedError.tipo})
                </span>
                <button
                  onClick={() => onSelectError(null)}
                  className="text-xs text-tinta-fraca hover:text-tinta"
                >
                  Fechar
                </button>
              </div>
              <div className="text-xs text-tinta">
                <strong>Trecho original:</strong> <span className="line-through text-vermelho">"{selectedError.trecho}"</span>
              </div>
              <div className="text-xs text-verde">
                <strong>Sugestão:</strong> "{selectedError.correcao}"
              </div>
              <p className="text-xs text-tinta-suave leading-relaxed pt-1">
                {selectedError.explicacao}
              </p>
            </div>
          )}
        </div>

        {/* Feedback Pedagógico Rápido */}
        <div className="glass-panel p-6 rounded-sm border border-regua space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-tinta">
            <Sparkles className="w-4 h-4 text-vermelho" />
            <span>Parecer Geral da Banca Especialista</span>
          </div>
          <p className="text-xs sm:text-sm text-tinta-suave leading-relaxed">
            {correcao.feedback_pedagogico}
          </p>
        </div>
      </div>

      {/* Coluna Direita: As 5 Competências do ENEM (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <h3 className="text-sm font-bold text-tinta uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-vermelho" />
          Detalhamento por Competência
        </h3>

        {correcao.competencias.map((comp) => (
          <CompetenciaCard key={comp.numero} comp={comp} />
        ))}
      </div>
    </div>
  );
}
