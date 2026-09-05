'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PenTool,
  Sparkles,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Award,
  Layers,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Editor } from '@/components/Editor';
import { RequerAssinatura } from '@/components/RequerAssinatura';

function NovaRedacaoContent() {
  const searchParams = useSearchParams();
  const temaParam = searchParams.get('tema') || '';

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="space-y-2 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
          <PenTool className="w-4 h-4" />
          <span>Laboratório de Produção Textual</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Escrever ou Importar Redação
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Digite seu texto no editor abaixo ou importe seu documento (.txt, .pdf, .docx) para receber a avaliação imediata.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna Principal: Editor (8 colunas) */}
        <div className="lg:col-span-8">
          <Editor initialTema={temaParam} />
        </div>

        {/* Coluna Lateral: Dicas da Banca Nota 1000 (4 colunas) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Checklist da Redação Nota 1000</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Estrutura canônica:</strong> 1 parágrafo de Introdução, 2 de Desenvolvimento e 1 de Conclusão.
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Repertório legitimado:</strong> Utilize dados, filósofos, sociólogos ou alusões históricas pertinentes no D1 e D2.
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Conectivos interparágrafos:</strong> Comece o D1, D2 e Conclusão com operadores argumentativos variados.
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>5 Elementos na C5:</strong> Quem fará (Agente), o que fará (Ação), como fará (Modo), para que fará (Efeito) e detalhe 1 deles.
                </span>
              </li>
            </ul>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 to-slate-900 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Lightbulb className="w-4 h-4" />
              <span>Dica de Tempo</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              No dia oficial do ENEM, dedique aproximadamente <strong>60 a 70 minutos</strong> para planejar, rascunhar e passar a limpo sua redação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NovaRedacaoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <RequerAssinatura>
          <Suspense fallback={<div className="text-center text-sm text-slate-400 py-12">Carregando editor...</div>}>
            <NovaRedacaoContent />
          </Suspense>
        </RequerAssinatura>
      </main>

      <Footer />
    </div>
  );
}
