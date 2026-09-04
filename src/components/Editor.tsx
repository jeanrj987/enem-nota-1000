'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
  Clock,
  Send,
  Loader2,
  Lightbulb,
  X,
} from 'lucide-react';
import { TEMAS_ENEM_SUGERIDOS, salvarRedacao } from '@/lib/storage';
import { Redacao } from '@/types';

interface EditorProps {
  initialText?: string;
  initialTema?: string;
  initialTitulo?: string;
}

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

  // Conectivos rápidos do ENEM
  const conectivosSugeridos = [
    { label: 'Em primeiro plano', text: 'Em primeiro plano, ' },
    { label: 'Ademais', text: 'Ademais, ' },
    { label: 'Nesse viés', text: 'Nesse viés, ' },
    { label: 'Com efeito', text: 'Com efeito, ' },
    { label: 'Outrossim', text: 'Outrossim, ' },
    { label: 'Portanto', text: 'Portanto, cabe ao ' },
  ];

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

  const loadingTips = [
    'Analisando conformidade com a Norma Culta (Competência 1)...',
    'Avaliando adequação temática e repertório sociocultural (Competência 2)...',
    'Examinando o projeto de texto e consistência argumentativa (Competência 3)...',
    'Conferindo coesão inter e intraparágrafos (Competência 4)...',
    'Calculando os 5 elementos da Proposta de Intervenção (Competência 5)...',
    'Gerando sugestão de reescrita nota 1000 e feedback pedagógico...',
  ];

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
      setLoadingStep((prev) => (prev + 1) % loadingTips.length);
    }, 2000);

    try {
      const res = await fetch('/api/corrigir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        id: data.correcao.redacao_id || 'red_' + Math.random().toString(36).substring(2, 9),
        titulo: titulo.trim() || `Redação sobre ${temaAtual.slice(0, 30)}...`,
        tema: temaAtual,
        texto,
        palavras_count: palavras,
        linhas_count: linhasAproximadas,
        status: 'corrigida',
        created_at: new Date().toISOString(),
        correcao: data.correcao,
      };

      // Salvar no storage local para persistência imediata
      salvarRedacao(novaRedacao);

      clearInterval(interval);
      router.push(`/correcao/${novaRedacao.id}`);
    } catch (err: any) {
      clearInterval(interval);
      setIsCorrigindo(false);
      setErrorMessage(err.message || 'Falha ao processar a correção.');
    }
  };

  const temaObjeto = TEMAS_ENEM_SUGERIDOS.find((t) => t.titulo === temaSelecionado);

  return (
    <div className="space-y-8">
      {/* Seletor de Tema e Configurações */}
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
              onClick={() => setIsCustomTema(false)}
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
              onClick={() => setIsCustomTema(true)}
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

        {/* Campo de Seleção ou Input Custom */}
        {!isCustomTema ? (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Escolha uma Proposta Oficial:
            </label>
            <select
              value={temaSelecionado}
              onChange={(e) => setTemaSelecionado(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {TEMAS_ENEM_SUGERIDOS.map((t) => (
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
              onChange={(e) => setTemaCustomizado(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Título da Redação (Opcional) */}
        <div className="space-y-1.5 pt-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Título da Redação (Opcional no ENEM):
          </label>
          <input
            type="text"
            placeholder="Ex: A força da ancestralidade na construção do futuro"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Área de Redação & Upload */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Área de Produção Textual</h3>
          </div>

          {/* Botão de Upload de Arquivo */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.pdf,.docx"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all border border-slate-700/60 shadow-sm"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span>{isUploading ? 'Extraindo...' : 'Importar PDF / Word / TXT'}</span>
            </button>
          </div>
        </div>

        {uploadedFileName && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-950/40 border border-blue-800/50 text-xs text-blue-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>Arquivo importado com sucesso: <strong>{uploadedFileName}</strong></span>
            </div>
            <button
              onClick={() => setUploadedFileName(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {uploadError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Conectivos Rápidos */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
            Conectivos rápidos:
          </span>
          {conectivosSugeridos.map((con, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => inserirConectivo(con.text)}
              className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-xs text-slate-300 hover:text-blue-400 whitespace-nowrap transition-colors"
            >
              + {con.label}
            </button>
          ))}
        </div>

        {/* Textarea do Editor */}
        <div className="relative rounded-xl border border-slate-700/80 bg-slate-950/80 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite ou cole sua redação aqui. Desenvolva sua introdução com tese clara, 2 parágrafos de desenvolvimento com repertório produtivo e a proposta de intervenção completa com os 5 elementos..."
            rows={16}
            className="w-full p-4 bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-y leading-relaxed font-sans"
          />
        </div>

        {/* Barra de Status e Contadores */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-400 border-t border-slate-800/60">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-200">{palavras}</span> palavras
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-200">{caracteres}</span> caracteres
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`font-semibold ${linhasAproximadas >= 7 && linhasAproximadas <= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                ~{linhasAproximadas}
              </span> / 30 linhas ENEM
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            {palavras < 150 && (
              <span className="text-amber-400">⚠️ Mínimo recomendado: ~250 palavras</span>
            )}
            {palavras >= 150 && palavras <= 400 && (
              <span className="text-emerald-400">✓ Extensão ideal para nota 1000</span>
            )}
          </div>
        </div>
      </div>

      {/* Alerta de Erro se houver */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Não foi possível processar:</div>
            <p className="text-xs text-red-300/90 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Botão de Ação / Envio */}
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

      {/* Modal / Overlay de Carregamento Interativo */}
      {isCorrigindo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-blue-500/30 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Corrigindo com Inteligência Artificial</h3>
              <p className="text-sm text-slate-300 animate-fade-in font-medium min-h-[48px] flex items-center justify-center">
                {loadingTips[loadingStep]}
              </p>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500"
                style={{ width: `${((loadingStep + 1) / loadingTips.length) * 100}%` }}
              />
            </div>

            <p className="text-xs text-slate-400">
              Tempo médio de análise: ~5 a 15 segundos
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
