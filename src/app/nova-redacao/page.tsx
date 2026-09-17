'use client';

import React, { Suspense, useEffect, useState } from 'react';
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
import { RequerLogin } from '@/components/RequerLogin';
import { temAcessoAtivo } from '@/lib/assinatura';

function NovaRedacaoContent() {
  const searchParams = useSearchParams();
  const temaParam = searchParams.get('tema') || '';

  // `null` enquanto a consulta não voltou: o aviso não aparece nesse intervalo.
  // Assumir "não tem plano" por padrão faria o assinante ver, por um instante,
  // uma cobrança que ele já pagou — pior do que não ver aviso nenhum.
  const [assinante, setAssinante] = useState<boolean | null>(null);

  useEffect(() => {
    let ativo = true;
    temAcessoAtivo().then((tem) => {
      if (ativo) setAssinante(tem);
    });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="space-y-2 border-b border-regua/80 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-azul uppercase tracking-wider">
          <PenTool className="w-4 h-4" />
          <span>Laboratório de Produção Textual</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-tinta">
          Escrever ou Importar Redação
        </h1>
        <p className="text-xs sm:text-sm text-tinta-fraca">
          Digite seu texto no editor abaixo ou importe seu documento (.txt, .pdf, .docx) para receber a avaliação imediata.
        </p>
        {assinante === false && (
          <p className="text-[11px] text-ambar bg-ambar-claro border border-ambar/30 rounded-xl px-3 py-2 inline-block">
            Sem um plano ativo, sua redação é corrigida normalmente, mas a nota e a
            análise completa ficam bloqueadas até a assinatura.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna Principal: Editor (8 colunas) */}
        <div className="lg:col-span-8">
          <Editor initialTema={temaParam} />
        </div>

        {/* Coluna Lateral: Dicas da Banca Nota 1000 (4 colunas) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-xl border border-regua space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-tinta">
              <Award className="w-4 h-4 text-ambar" />
              <span>Checklist da Redação Nota 1000</span>
            </div>

            <ul className="space-y-3 text-xs text-tinta-suave">
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-folha/60 border border-regua">
                <CheckCircle2 className="w-4 h-4 text-verde shrink-0 mt-0.5" />
                <span>
                  <strong>Estrutura canônica:</strong> 1 parágrafo de Introdução, 2 de Desenvolvimento e 1 de Conclusão.
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-folha/60 border border-regua">
                <CheckCircle2 className="w-4 h-4 text-verde shrink-0 mt-0.5" />
                <span>
                  <strong>Repertório legitimado:</strong> Utilize dados, filósofos, sociólogos ou alusões históricas pertinentes no D1 e D2.
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-folha/60 border border-regua">
                <CheckCircle2 className="w-4 h-4 text-verde shrink-0 mt-0.5" />
                <span>
                  <strong>Conectivos interparágrafos:</strong> Comece o D1, D2 e Conclusão com operadores argumentativos variados.
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-folha/60 border border-regua">
                <CheckCircle2 className="w-4 h-4 text-verde shrink-0 mt-0.5" />
                <span>
                  <strong>5 Elementos na C5:</strong> Quem fará (Agente), o que fará (Ação), como fará (Modo), para que fará (Efeito) e detalhe 1 deles.
                </span>
              </li>
            </ul>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-azul bg-azul hover:brightness-110 to-folha space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-azul uppercase tracking-wider">
              <Lightbulb className="w-4 h-4" />
              <span>Dica de Tempo</span>
            </div>
            <p className="text-xs text-tinta-suave leading-relaxed">
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
    <div className="min-h-screen flex flex-col bg-papel text-tinta">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <RequerLogin>
          <Suspense fallback={<div className="text-center text-sm text-tinta-fraca py-12">Carregando editor...</div>}>
            <NovaRedacaoContent />
          </Suspense>
        </RequerLogin>
      </main>

      <Footer />
    </div>
  );
}
