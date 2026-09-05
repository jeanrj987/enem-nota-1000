'use client';

import { Layers, Lightbulb } from 'lucide-react';
import { TemaRedacao } from '@/types';

interface SeletorTemaProps {
  temas: TemaRedacao[];
  temaSelecionado: string;
  onSelecionarTema: (titulo: string) => void;
  temaCustomizado: string;
  onMudarTemaCustomizado: (valor: string) => void;
  isCustomTema: boolean;
  onMudarIsCustomTema: (valor: boolean) => void;
  titulo: string;
  onMudarTitulo: (valor: string) => void;
}

/** Bloco de seleção de tema (oficial ou personalizado) e título da redação. */
export function SeletorTema({
  temas,
  temaSelecionado,
  onSelecionarTema,
  temaCustomizado,
  onMudarTemaCustomizado,
  isCustomTema,
  onMudarIsCustomTema,
  titulo,
  onMudarTitulo,
}: SeletorTemaProps) {
  const temaObjeto = temas.find((t) => t.titulo === temaSelecionado);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Tema da Proposta
          </h2>
          <p className="text-xs text-slate-400">
            Selecione um tema oficial do ENEM ou insira uma proposta personalizada
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMudarIsCustomTema(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !isCustomTema
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Temas Oficiais
          </button>
          <button
            type="button"
            onClick={() => onMudarIsCustomTema(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isCustomTema
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Tema Livre / Inédito
          </button>
        </div>
      </div>

      {!isCustomTema ? (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Escolha uma Proposta Oficial:
          </label>
          <select
            value={temaSelecionado}
            onChange={(e) => onSelecionarTema(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {temas.map((t) => (
              <option key={t.id} value={t.titulo}>
                {t.origem} {t.ano ? `(${t.ano})` : ''} - {t.titulo}
              </option>
            ))}
          </select>

          {temaObjeto?.textos_motivadores && temaObjeto.textos_motivadores.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                <Lightbulb className="w-4 h-4" />
                Textos Motivadores da Proposta
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {temaObjeto.textos_motivadores.map((tm, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                    <div className="font-semibold text-slate-200 mb-1">{tm.titulo}</div>
                    <p className="text-slate-400 leading-relaxed italic">{tm.conteudo}</p>
                    {tm.fonte && <p className="text-[10px] text-slate-400 mt-1">Fonte: {tm.fonte}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Digite o Tema Personalizado:
          </label>
          <input
            type="text"
            placeholder="Ex: Os desafios da preservação hídrica no Brasil contemporâneo"
            value={temaCustomizado}
            onChange={(e) => onMudarTemaCustomizado(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="space-y-1.5 pt-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Título da Redação (Opcional no ENEM):
        </label>
        <input
          type="text"
          placeholder="Ex: A força da ancestralidade na construção do futuro"
          value={titulo}
          onChange={(e) => onMudarTitulo(e.target.value)}
          className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}
