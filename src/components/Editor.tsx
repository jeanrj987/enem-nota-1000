'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { TEMAS_ENEM_SUGERIDOS, salvarRedacao } from '@/lib/storage';
import { gerarId } from '@/lib/ids';
import { supabase } from '@/lib/supabase';
import { Redacao } from '@/types';
import { SeletorTema } from './editor/SeletorTema';
import { AreaProducaoTextual } from './editor/AreaProducaoTextual';
import { ModalCarregamento } from './editor/ModalCarregamento';

interface EditorProps {
  initialText?: string;
  initialTema?: string;
  initialTitulo?: string;
}

const CONECTIVOS_SUGERIDOS = [
  { label: 'Em primeiro plano', text: 'Em primeiro plano, ' },
  { label: 'Ademais', text: 'Ademais, ' },
  { label: 'Nesse viés', text: 'Nesse viés, ' },
  { label: 'Com efeito', text: 'Com efeito, ' },
  { label: 'Outrossim', text: 'Outrossim, ' },
  { label: 'Portanto', text: 'Portanto, cabe ao ' },
];

const LOADING_TIPS = [
  'Analisando conformidade com a Norma Culta (Competência 1)...',
  'Avaliando adequação temática e repertório sociocultural (Competência 2)...',
  'Examinando o projeto de texto e consistência argumentativa (Competência 3)...',
  'Conferindo coesão inter e intraparágrafos (Competência 4)...',
  'Calculando os 5 elementos da Proposta de Intervenção (Competência 5)...',
  'Gerando sugestão de reescrita nota 1000 e feedback pedagógico...',
];

export function Editor({
  initialText = '',
  initialTema = '',
  initialTitulo = '',
}: EditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [temaSelecionado, setTemaSelecionado] = useState(
    initialTema || TEMAS_ENEM_SUGERIDOS[0].titulo
  );
  const [temaCustomizado, setTemaCustomizado] = useState(
    initialTema && !TEMAS_ENEM_SUGERIDOS.some((t) => t.titulo === initialTema)
      ? initialTema
      : ''
  );
  const [isCustomTema, setIsCustomTema] = useState(
    initialTema ? !TEMAS_ENEM_SUGERIDOS.some((t) => t.titulo === initialTema) : false
  );
  const [titulo, setTitulo] = useState(initialTitulo);
  const [texto, setTexto] = useState(initialText);

  // Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Correction Processing States
  const [isCorrigindo, setIsCorrigindo] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stats
  const palavras = texto.trim().split(/\s+/).filter(Boolean).length;
  const caracteres = texto.length;
  const linhasAproximadas = texto.split('\n').filter((l) => l.length > 0).length || Math.ceil(palavras / 10);
  const temaAtual = isCustomTema ? temaCustomizado : temaSelecionado;

  const inserirConectivo = (con: string) => {
    setTexto((prev) => prev + (prev.endsWith(' ') || prev.endsWith('\n') || !prev ? '' : ' ') + con);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao processar arquivo.');
      }

      setTexto(data.text);
      setUploadedFileName(file.name);
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao enviar arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEnviarCorrecao = async () => {
    if (!texto.trim() || texto.trim().length < 50) {
      setErrorMessage('Por favor, escreva ou envie uma redação com pelo menos 50 caracteres para avaliação.');
      return;
    }

    if (isCustomTema && !temaCustomizado.trim()) {
      setErrorMessage('Por favor, defina o tema da sua redação.');
      return;
    }

    setIsCorrigindo(true);
    setErrorMessage(null);
    setLoadingStep(0);

    // Tip cycler
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 2000);

    try {
      const { data: sessionData } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error('Sua sessão expirou. Faça login novamente.');
      }

      const res = await fetch('/api/corrigir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          texto,
          tema: temaAtual,
          titulo: titulo || 'Sem título',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.correcao) {
        throw new Error(data.error || 'Erro na resposta do corretor de IA.');
      }

      const novaRedacao: Redacao = {
        id: data.correcao.redacao_id || gerarId('red'),
        titulo: titulo.trim() || `Redação sobre ${temaAtual.slice(0, 30)}...`,
        tema: temaAtual,
        texto,
        palavras_count: palavras,
        linhas_count: linhasAproximadas,
        status: 'corrigida',
        created_at: new Date().toISOString(),
        correcao: data.correcao,
      };

      // Salvar (Supabase quando configurado, com fallback/mirror em localStorage)
      await salvarRedacao(novaRedacao);

      clearInterval(interval);
      router.push(`/correcao/${novaRedacao.id}`);
    } catch (err: any) {
      clearInterval(interval);
      setIsCorrigindo(false);
      setErrorMessage(err.message || 'Falha ao processar a correção.');
    }
  };

  return (
    <div className="space-y-8">
      <SeletorTema
        temas={TEMAS_ENEM_SUGERIDOS}
        temaSelecionado={temaSelecionado}
        onSelecionarTema={setTemaSelecionado}
        temaCustomizado={temaCustomizado}
        onMudarTemaCustomizado={setTemaCustomizado}
        isCustomTema={isCustomTema}
        onMudarIsCustomTema={setIsCustomTema}
        titulo={titulo}
        onMudarTitulo={setTitulo}
      />

      <AreaProducaoTextual
        texto={texto}
        onMudarTexto={setTexto}
        fileInputRef={fileInputRef}
        onFileUpload={handleFileUpload}
        isUploading={isUploading}
        uploadedFileName={uploadedFileName}
        onLimparUploadedFileName={() => setUploadedFileName(null)}
        uploadError={uploadError}
        conectivosSugeridos={CONECTIVOS_SUGERIDOS}
        onInserirConectivo={inserirConectivo}
        palavras={palavras}
        caracteres={caracteres}
        linhasAproximadas={linhasAproximadas}
      />

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Não foi possível processar:</div>
            <p className="text-xs text-red-300/90 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Avaliação pelas 5 competências oficiais do INEP com sugestão de reescrita</span>
        </div>

        <button
          type="button"
          onClick={handleEnviarCorrecao}
          disabled={isCorrigindo}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isCorrigindo ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Avaliando Redação com IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Corrigir Minha Redação Agora</span>
            </>
          )}
        </button>
      </div>

      {isCorrigindo && <ModalCarregamento loadingTips={LOADING_TIPS} loadingStep={loadingStep} />}
    </div>
  );
}
