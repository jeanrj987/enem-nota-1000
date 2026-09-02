'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  UploadCloud,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Send,
  Loader2,
  PenTool,
  ShieldCheck,
  Zap,
  Maximize2,
  Minimize2,
  Info,
  ArrowRight,
  Lock,
  User,
  Mail,
  RotateCcw,
  AlignLeft,
  Grid,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import {
  TEMAS_ENEM_SUGERIDOS,
  salvarRedacao,
  obterHistoricoParaContexto,
  isUsuarioLogado,
  isUsuarioMaster,
  salvarUsuarioAtual,
  getUsuarioAtual,
  salvarRascunho,
  obterRascunho,
  limparRascunho,
  UsuarioSessao,
} from '@/lib/storage';
import { loginComGoogleSupabase } from '@/lib/supabase';
import { OnboardingLeadModal } from '@/components/OnboardingLeadModal';
import { Redacao, TemaRedacao } from '@/types';

interface EditorProps {
  initialTema?: string;
}

const STOPWORDS_PT = new Set([
  'para', 'como', 'mais', 'pelo', 'pela', 'pelos', 'pelas', 'onde', 'quando',
  'muito', 'sobre', 'entre', 'mesmo', 'ainda', 'assim', 'essa', 'esse', 'esta',
  'este', 'isso', 'isto', 'qual', 'quais', 'suas', 'seus', 'dele', 'dela', 'deles',
  'apenas', 'desde', 'tanto', 'quanto', 'cada', 'toda', 'todo', 'todas', 'todos',
]);

const DICIONARIO_SINONIMOS: Record<string, string[]> = {
  problema: ['entrave', 'impasse', 'adversidade', 'revés', 'obstáculo', 'dilema'],
  problemas: ['entraves', 'impasses', 'adversidades', 'obstáculos', 'dilemas'],
  sociedade: ['corpo social', 'coletividade', 'população', 'cidadãos', 'meio social'],
  importante: ['fundamental', 'fulcral', 'imprescindível', 'precípuo', 'crucial'],
  importantes: ['fundamentais', 'imprescindíveis', 'precípuos', 'cruciais'],
  fazer: ['executar', 'promover', 'viabilizar', 'implementar', 'efetivar'],
  governo: ['poder público', 'esfera estatal', 'instituições governamentais', 'administração pública'],
  pessoas: ['indivíduos', 'cidadãos', 'sujeitos', 'habitantes'],
  brasil: ['território nacional', 'cenário brasileiro', 'nação verde-amarela', 'país'],
  ajudar: ['auxiliar', 'mitigar', 'fomentar', 'amparar', 'corroborar'],
  mostrar: ['evidenciar', 'denotar', 'explicitar', 'demonstrar', 'ilustrar'],
};

export function Editor({ initialTema = '' }: EditorProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mounted, setMounted] = useState(false);

  const [tema, setTema] = useState(initialTema);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [selectedTemaObj, setSelectedTemaObj] = useState<TemaRedacao | null>(null);
  const [showMotivadores, setShowMotivadores] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [modoFolhaPautada, setModoFolhaPautada] = useState(false);

  // Auto-Save de Rascunho
  const [ultimoSalvamento, setUltimoSalvamento] = useState<string | null>(null);
  const [rascunhoCarregado, setRascunhoCarregado] = useState(false);

  // Modal de Cadastro Obrigatório para Testar Demo
  const [showAuthGateModal, setShowAuthGateModal] = useState(false);
  const [authNome, setAuthNome] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authSenha, setAuthSenha] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Estados de Envio & Carregamento
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Estados de Upload de Arquivo
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Contadores de Produção em tempo real
  const palavrasArray = texto.trim() ? texto.trim().split(/\s+/).filter(Boolean) : [];
  const palavrasCount = palavrasArray.length;
  const caracteresCount = texto.length;
  const linhasEstimadas = Math.max(1, Math.ceil(caracteresCount / 65));
  const tempoLeituraMin = (palavrasCount / 130).toFixed(1);

  // Análise em Tempo Real de Palavras Repetidas (Competência 4)
  const repeticoes = useMemo(() => {
    if (!texto.trim()) return [];
    const contagem: Record<string, number> = {};
    
    palavrasArray.forEach((p) => {
      const limpa = p.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúçñ]/gi, '');
      if (limpa.length >= 4 && !STOPWORDS_PT.has(limpa)) {
        contagem[limpa] = (contagem[limpa] || 0) + 1;
      }
    });

    return Object.entries(contagem)
      .filter(([_, qtd]) => qtd >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([palavra, qtd]) => ({
        palavra,
        qtd,
        sinonimos: DICIONARIO_SINONIMOS[palavra] || ['termo equivalente', 'expressão análoga'],
      }));
  }, [texto]);

  useEffect(() => {
    setMounted(true);

    // Recupera rascunho anterior se houver
    const rascunho = obterRascunho();
    if (rascunho && !initialTema && !texto) {
      setTema(rascunho.tema || '');
      setTitulo(rascunho.titulo || '');
      setTexto(rascunho.texto || '');
      setRascunhoCarregado(true);
      setUltimoSalvamento(new Date(rascunho.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
  }, []);

  // Auto-Save a cada modificação com debounce
  useEffect(() => {
    if (!texto.trim() && !titulo.trim()) return;

    const timeout = setTimeout(() => {
      const agora = new Date().toISOString();
      salvarRascunho({
        tema,
        titulo,
        texto,
        updated_at: agora,
      });
      setUltimoSalvamento(new Date(agora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 1500);

    return () => clearTimeout(timeout);
  }, [texto, titulo, tema]);

  // Inicializar com o tema padrão se não houver
  useEffect(() => {
    if (!tema && TEMAS_ENEM_SUGERIDOS.length > 0) {
      setTema(TEMAS_ENEM_SUGERIDOS[0].titulo);
      setSelectedTemaObj(TEMAS_ENEM_SUGERIDOS[0]);
    } else {
      const match = TEMAS_ENEM_SUGERIDOS.find((t) => t.titulo === tema);
      if (match) setSelectedTemaObj(match);
    }
  }, [tema]);

  // Atalho de teclado Ctrl + Enter / Cmd + Enter e ESC para sair da tela cheia
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      }
      if (e.key === 'Escape' && zenMode) {
        setZenMode(false);
      }
    };

    if (zenMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [zenMode]);

  const handleSelectTema = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTema(val);
    const match = TEMAS_ENEM_SUGERIDOS.find((t) => t.titulo === val);
    setSelectedTemaObj(match || null);
  };

  // Upload de Arquivo (.pdf, .docx, .txt, imagem)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao processar arquivo.');
      }

      if (data.text) {
        setTexto((prev) => (prev ? `${prev}\n\n${data.text}` : data.text));
      }
    } catch (err: any) {
      setUploadError(err.message || 'Não foi possível ler o arquivo. Você pode digitar ou colar diretamente.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Inserção rápida de conectivos recomendados
  const insertConectivo = (conectivo: string) => {
    setTexto((prev) => (prev ? `${prev} ${conectivo} ` : `${conectivo} `));
  };

  // Substituir palavra repetida por sinônimo
  const substituirPalavra = (antiga: string, nova: string) => {
    const regex = new RegExp(`\\b${antiga}\\b`, 'i');
    setTexto((prev) => prev.replace(regex, nova));
  };

  // Execução direta do envio para a API
  const executeSubmission = async () => {
    setErrorMessage('');
    setLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 900);

    try {
      const historicoAluno = obterHistoricoParaContexto();
      const usuarioAtual = getUsuarioAtual();
      const planoUsuario = usuarioAtual?.plano || 'gratis';

      const response = await fetch('/api/corrigir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto,
          tema,
          titulo: titulo.trim() || undefined,
          historico_aluno: historicoAluno,
          plano_usuario: planoUsuario,
        }),
      });

      const data = await response.json();
      clearInterval(stepInterval);

      if (!response.ok || !data.correcao) {
        throw new Error(data.error || 'Não foi possível concluir a avaliação.');
      }

      const novaRedacao: Redacao = {
        id: data.redacao_id || `red_${Date.now()}`,
        titulo: titulo.trim() || 'Minha Redação ENEM',
        tema,
        texto,
        palavras_count: palavrasCount,
        linhas_count: linhasEstimadas,
        status: 'corrigida',
        created_at: new Date().toISOString(),
        correcao: data.correcao,
      };

      salvarRedacao(novaRedacao);
      limparRascunho();
      router.push(`/correcao/${novaRedacao.id}`);
    } catch (err: any) {
      clearInterval(stepInterval);
      setErrorMessage(err.message || 'Erro de conexão com o servidor. Tente novamente em instantes.');
      setLoading(false);
    }
  };

  // Submissão da Redação para Correção com Verificação de Conta Obrigatória
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!texto.trim() || texto.trim().length < 80) {
      setErrorMessage('Por favor, digite ao menos 80 caracteres para que a banca possa fazer uma avaliação completa.');
      return;
    }

    if (!tema.trim()) {
      setErrorMessage('Por favor, selecione ou digite o tema da redação.');
      return;
    }

    const user = getUsuarioAtual();
    const isMaster = user && isUsuarioMaster(user.email);
    const precisaColetarDados = !user || (!isMaster && !user.whatsapp);

    if (precisaColetarDados) {
      setShowAuthGateModal(true);
      return;
    }

    executeSubmission();
  };

  // Criar Conta Rápida pelo Modal de Bloqueio
  const handleQuickRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim()) return;

    setAuthLoading(true);
    setTimeout(() => {
      const novoUsuario: UsuarioSessao = {
        id: 'usr_' + Date.now(),
        nome: authNome.trim() || 'Estudante Cadastrado',
        email: authEmail.trim(),
        plano: 'gratis',
        created_at: new Date().toISOString(),
      };

      salvarUsuarioAtual(novoUsuario);
      setAuthLoading(false);
      setShowAuthGateModal(false);
      executeSubmission();
    }, 400);
  };

  const loadingSteps = [
    { title: 'Analisando gramática, concordância e pontuação (Competência 1)...' },
    { title: 'Avaliando adequação ao tema e repertório sociocultural (Competência 2)...' },
    { title: 'Verificando a força dos argumentos e projeto de texto (Competência 3)...' },
    { title: 'Checando o uso de conectivos entre os parágrafos (Competência 4)...' },
    { title: 'Auditando os 5 elementos da proposta de intervenção (Competência 5)...' },
  ];

  const editorJSX = (
    <div className={`space-y-6 ${zenMode ? 'fixed inset-0 z-[99999] bg-[#02040a] p-4 sm:p-8 overflow-y-auto' : ''}`}>
      
      {/* Alerta de Rascunho Recuperado */}
      {rascunhoCarregado && (
        <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Seu último rascunho foi recuperado automaticamente.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              limparRascunho();
              setTexto('');
              setTitulo('');
              setRascunhoCarregado(false);
            }}
            className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
          >
            Limpar e começar do zero
          </button>
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="tech-card p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-6 shadow-2xl"
      >
        
        {/* Cabeçalho do Estúdio */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold text-white font-heading">
              Estúdio de Produção de Redação {zenMode ? '• Modo Foco Ativo' : ''}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Alternador de Folha Pautada Oficial */}
            <button
              type="button"
              onClick={() => setModoFolhaPautada(!modoFolhaPautada)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                modoFolhaPautada
                  ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                  : 'bg-[#040816] hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}
              title="Simula a folha pautada física de 30 linhas do ENEM"
            >
              {modoFolhaPautada ? <AlignLeft className="w-3.5 h-3.5" /> : <Grid className="w-3.5 h-3.5" />}
              <span>{modoFolhaPautada ? 'Folha ENEM (30 Linhas)' : 'Simular Folha ENEM'}</span>
            </button>

            {/* Botão de Tela Cheia */}
            <button
              type="button"
              onClick={() => setZenMode(!zenMode)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-lg ${
                zenMode
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.6)] hover:scale-105'
                  : 'bg-[#040816] hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {zenMode ? <Minimize2 className="w-4 h-4 text-black" /> : <Maximize2 className="w-4 h-4 text-cyan-400" />}
              <span>{zenMode ? 'Sair da Tela Cheia [ESC]' : 'Modo Foco (Tela Cheia)'}</span>
            </button>
          </div>
        </div>

        {/* 1. Escolha do Tema */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
              <span>Passo 1: Selecione o Tema da Proposta</span>
            </label>
            <span className="text-[11px] text-slate-400">Temas Oficiais do ENEM</span>
          </div>

          <div className="relative">
            <select
              value={tema}
              onChange={handleSelectTema}
              className="w-full bg-[#040816] border border-cyan-500/25 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all appearance-none cursor-pointer"
            >
              {TEMAS_ENEM_SUGERIDOS.map((t) => (
                <option key={t.id} value={t.titulo} className="bg-[#040816] text-white">
                  {t.origem} ({t.ano || 'Oficial'}): {t.titulo}
                </option>
              ))}
              <option value="custom" className="bg-[#040816] text-white">Outro tema personalizado...</option>
            </select>
            <ChevronDown className="w-4 h-4 text-cyan-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {(!TEMAS_ENEM_SUGERIDOS.some((t) => t.titulo === tema) || tema === 'custom') && (
            <input
              type="text"
              placeholder="Digite o título do tema que você deseja treinar..."
              value={tema === 'custom' ? '' : tema}
              onChange={(e) => setTema(e.target.value)}
              className="mt-2 w-full bg-[#040816] border border-cyan-500/25 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          )}

          {/* Textos Motivadores */}
          {selectedTemaObj?.textos_motivadores && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowMotivadores(!showMotivadores)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{showMotivadores ? 'Ocultar Coletânea de Textos Motivadores' : 'Ver Coletânea de Textos Motivadores (Apoio)'}</span>
                {showMotivadores ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showMotivadores && (
                <div className="mt-3 p-4 rounded-xl bg-[#030612] border border-cyan-500/20 space-y-3 text-xs text-slate-300 animate-fade-in">
                  <p className="text-cyan-300 font-bold uppercase tracking-wider text-[11px]">Coletânea Oficial de Textos Motivadores:</p>
                  {selectedTemaObj.textos_motivadores.map((tm, idx) => (
                    <div key={idx} className="p-3 bg-[#060c1c] rounded-lg border border-white/[0.04] space-y-1">
                      <strong className="block text-cyan-400 font-heading">{tm.titulo}</strong>
                      <p className="italic text-slate-300 leading-relaxed font-sans">"{tm.conteudo}"</p>
                      {tm.fonte && <span className="text-[10px] text-slate-500 block">Fonte: {tm.fonte}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Título Opcional */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Passo 2: Título da sua Redação (Opcional)
            </label>
            <span className="text-[11px] text-slate-500">Não obrigatório no ENEM</span>
          </div>
          <input
            type="text"
            placeholder="Ex: O desafio da inclusão social no Brasil contemporâneo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-[#040816] border border-cyan-500/25 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Ações Rápidas: Conectivos + Upload */}
        <div className="space-y-2 pt-2 border-t border-white/[0.08]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-cyan-300">Conectivos Rápidos para o seu Texto:</span>
            
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#040816] hover:bg-[#09122a] text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-all cursor-pointer shadow-sm">
              <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>{uploading ? 'Processando Arquivo...' : 'Enviar PDF / Word / Foto'}</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400">D1:</span>
            <button
              type="button"
              onClick={() => insertConectivo('Em primeiro plano,')}
              className="px-2.5 py-1 rounded-lg bg-[#040816] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-cyan-500/20 transition-colors cursor-pointer"
            >
              + "Em primeiro plano,"
            </button>
            
            <span className="text-[11px] text-slate-400 ml-1">D2:</span>
            <button
              type="button"
              onClick={() => insertConectivo('Ademais,')}
              className="px-2.5 py-1 rounded-lg bg-[#040816] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-cyan-500/20 transition-colors cursor-pointer"
            >
              + "Ademais,"
            </button>
            <button
              type="button"
              onClick={() => insertConectivo('Outrossim,')}
              className="px-2.5 py-1 rounded-lg bg-[#040816] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-cyan-500/20 transition-colors cursor-pointer"
            >
              + "Outrossim,"
            </button>

            <span className="text-[11px] text-emerald-400 ml-1 font-bold">Conclusão:</span>
            <button
              type="button"
              onClick={() => insertConectivo('Portanto,')}
              className="px-2.5 py-1 rounded-lg bg-[#040816] hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer font-bold"
            >
              + "Portanto,"
            </button>
          </div>
        </div>

        {/* Alerta de Palavras Repetidas em Tempo Real (C4) */}
        {repeticoes.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-[#140812] border border-amber-500/30 space-y-2 text-xs text-slate-300 animate-fade-in">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Detector de Repetições (Competência 4):</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {repeticoes.map((rep) => (
                <div
                  key={rep.palavra}
                  className="p-2 rounded-xl bg-[#040816] border border-amber-500/25 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-300 font-mono">"{rep.palavra}"</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[10px] text-amber-400 font-bold">
                      {rep.qtd}x no texto
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Trocar por:</span>
                    {rep.sinonimos.slice(0, 2).map((sin) => (
                      <button
                        key={sin}
                        type="button"
                        onClick={() => substituirPalavra(rep.palavra, sin)}
                        className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 hover:bg-cyan-800 transition-colors cursor-pointer"
                        title="Substituir a primeira ocorrência por este sinônimo"
                      >
                        +{sin}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* 3. Área Principal de Redação (Com Suporte a Folha Pautada Oficial) */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-2">
              <span>Passo 3: Digite ou Cole a sua Redação</span>
              {ultimoSalvamento && (
                <span className="text-[10px] font-normal text-emerald-400 flex items-center gap-1 lowercase">
                  <CheckCircle2 className="w-3 h-3" /> salvo às {ultimoSalvamento}
                </span>
              )}
            </label>

            {/* Contadores */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-cyan-300 font-bold">{palavrasCount} palavras</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">~{tempoLeituraMin} min leitura</span>
              <span className="text-slate-600">•</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold ${
                  linhasEstimadas > 30
                    ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60 animate-pulse'
                    : linhasEstimadas >= 20
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 bg-slate-900 border border-white/[0.08]'
                }`}
              >
                ~{linhasEstimadas} / 30 linhas {linhasEstimadas >= 20 && linhasEstimadas <= 30 ? '(IDEAL)' : linhasEstimadas > 30 ? '(ULTRAPASSOU LIMITE)' : ''}
              </span>
            </div>
          </div>

          {/* Editor com Folha Pautada ou Padrão */}
          <div className="relative">
            {modoFolhaPautada ? (
              <div className="relative rounded-2xl border border-indigo-500/30 bg-[#030510] p-4 flex">
                {/* Numeração de Linhas 1 a 30 */}
                <div className="w-8 border-r border-indigo-500/20 pr-2 select-none text-right font-mono text-xs text-indigo-400/60 leading-7 shrink-0 space-y-0">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="h-7 flex items-center justify-end">
                      {i + 1}
                    </div>
                  ))}
                </div>

                <textarea
                  required
                  rows={30}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Escreva sua redação simulando a folha pautada oficial do ENEM de 30 linhas..."
                  style={{ lineHeight: '1.75rem' }}
                  className="w-full bg-transparent pl-4 pr-2 text-sm sm:text-base text-white leading-7 font-sans placeholder-slate-600 focus:outline-none resize-none"
                />
              </div>
            ) : (
              <textarea
                required
                rows={zenMode ? 22 : 15}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Digite sua redação aqui... Dica de ouro: estruture seu texto em 4 parágrafos (Introdução com tese clara, dois parágrafos de Desenvolvimento e Conclusão com proposta de intervenção completa contendo Agente, Ação, Meio, Efeito e Detalhamento)."
                className="w-full bg-[#030612] border border-cyan-500/25 rounded-2xl p-5 text-sm sm:text-base text-white leading-relaxed font-sans placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner transition-all"
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Dica: Mantenha entre 20 e 30 linhas para garantir nota máxima no desenvolvimento dos argumentos.</span>
            <span className="text-slate-500 hidden sm:inline">Atalho: [Ctrl + Enter] para enviar</span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Botão de Envio de Alta Conversão */}
        <button
          type="submit"
          disabled={loading || uploading}
          className="btn-cyber-primary w-full py-4 rounded-2xl font-heading font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>AVALIANDO PELA MATRIZ OFICIAL DO ENEM...</span>
            </div>
          ) : (
            <>
              <PenTool className="w-5 h-5" />
              <span>AVALIAR MINHA REDAÇÃO AGORA</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Modal de Questionário e Captura de Leads */}
      <OnboardingLeadModal
        isOpen={showAuthGateModal}
        onClose={() => setShowAuthGateModal(false)}
        onSuccess={() => {
          setShowAuthGateModal(false);
          executeSubmission();
        }}
      />

      {/* Modal de Carregamento Amigável */}
      {loading && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tech-card max-w-md w-full p-8 rounded-3xl border border-cyan-500/40 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#061022] border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.3)]">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Correção em Andamento
              </span>
              <h3 className="font-heading text-lg font-bold text-white">
                Avaliando sua redação nos critérios oficiais
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                Em poucos segundos seu relatório detalhado estará pronto na tela.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#030612] border border-cyan-500/30 text-xs text-cyan-300 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{loadingSteps[loadingStep]?.title}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (zenMode && mounted && typeof document !== 'undefined') {
    return createPortal(editorJSX, document.body);
  }

  return editorJSX;
}
