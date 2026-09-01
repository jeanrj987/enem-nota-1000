'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  FileCheck,
  Zap,
  ShieldCheck,
  PenTool,
  Sparkles,
  BookOpen,
  Eye,
  Scan,
  Download,
  Terminal,
  Activity,
  ChevronRight,
  Layers,
  Flame,
  Clock,
  Check,
  AlertTriangle,
  Calculator,
  GraduationCap,
  Sliders,
  Award,
  Star,
  Lock,
  HelpCircle,
  Users,
  ChevronDown,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { fazerUpgradePlano } from '@/lib/storage';

export default function LandingPage() {
  const [activeThemeId, setActiveThemeId] = useState<'afro' | 'registro' | 'trabalho'>('afro');
  const [selectedError, setSelectedError] = useState<number | null>(1);
  const [notaSimulada, setNotaSimulada] = useState<number>(920);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Projeção SISU
  const mediaObjetivasBase = 680;
  const pesoRedacao = 3;
  const mediaFinalSisu = Math.round((mediaObjetivasBase * 4 + notaSimulada * pesoRedacao) / (4 + pesoRedacao));
  
  const getProjecaoCurso = (nota: number) => {
    if (nota >= 960) return { curso: 'Medicina (USP / UFRJ / UFMG)', chance: '98% de Aprovação', cor: 'text-emerald-400', percentil: 'Top 0.5% Nacional' };
    if (nota >= 900) return { curso: 'Direito / Ciência da Computação / Odontologia', chance: '94% de Aprovação', cor: 'text-cyan-400', percentil: 'Top 2.5% Nacional' };
    if (nota >= 800) return { curso: 'Engenharia / Psicologia / Arquitetura', chance: '87% de Aprovação', cor: 'text-indigo-300', percentil: 'Top 8.0% Nacional' };
    return { curso: 'Cursos de Alta Concorrência', chance: 'Faixa de Risco', cor: 'text-amber-400', percentil: 'Abaixo da Linha de Corte' };
  };

  const projecao = getProjecaoCurso(notaSimulada);

  const temasDemo = {
    afro: {
      titulo: 'Desafios para a valorização da herança africana no Brasil',
      nota: 960,
      c1: 160, c2: 200, c3: 200, c4: 200, c5: 200,
      trecho1: 'Em sua obra "O Povo Brasileiro", o antropólogo Darcy Ribeiro destaca a matriz africana como pilar fundamental da identidade nacional. Contudo, na contemporaneidade, persistem barreiras estruturais...',
      erroTrecho: 'o poder público devem assegurar',
      correcaoTrecho: 'o poder público deve assegurar',
      regra: 'Concordância verbal: o núcleo do sujeito ("poder") é singular e exige verbo flexionado no singular.',
      c5Elementos: {
        agente: 'Ministério da Igualdade Racial e MEC',
        acao: 'Implementar formação continuada de professores',
        modo: 'Por meio de oficinas pedagógicas e acervos afrocentrados',
        efeito: 'A fim de combater preconceitos e valorizar a memória ancestral',
        detalhe: 'Com fiscalização ativa da Lei 10.639 nas redes estaduais',
      },
    },
    registro: {
      titulo: 'Invisibilidade e registro civil: garantia de acesso à cidadania',
      nota: 980,
      c1: 180, c2: 200, c3: 200, c4: 200, c5: 200,
      trecho1: 'A Constituição Federal de 1988 assegura a dignidade da pessoa humana como fundamento da República. Todavia, a carência de certidão de nascimento na primeira infância marginaliza milhões...',
      erroTrecho: 'onde milhares de indivíduos sofrem',
      correcaoTrecho: 'no qual milhares de indivíduos sofrem',
      regra: 'Pronome relativo: "onde" deve ser empregado unicamente para indicação de espaço físico concreto.',
      c5Elementos: {
        agente: 'Defensoria Pública da União e Cartórios',
        acao: 'Promover mutirões itinerantes de emissão gratuita de certidões',
        modo: 'Por meio de unidades móveis em periferias e zonas rurais',
        efeito: 'Para garantir o pleno acesso aos direitos sociais e matrícula escolar',
        detalhe: 'Com prioridade de atendimento a famílias em vulnerabilidade extrema',
      },
    },
    trabalho: {
      titulo: 'Impactos da automação e tecnologia no mercado de trabalho brasileiro',
      nota: 960,
      c1: 160, c2: 200, c3: 200, c4: 200, c5: 200,
      trecho1: 'A Quarta Revolução Industrial, impulsionada pelo avanço acelerado da automação digital, transforma as relações produtivas globais, exigindo requalificação técnica contínua...',
      erroTrecho: 'as novas tecnologias causam impactos',
      correcaoTrecho: 'a nova tecnologia causa impactos',
      regra: 'Concordância verbal: o sujeito singular "a nova tecnologia" concorda com o verbo "causa".',
      c5Elementos: {
        agente: 'Ministério do Trabalho e Emprego em parceria com o Sistema S',
        acao: 'Criar programas nacionais de requalificação profissional digital',
        modo: 'Mediante cursos técnicos em automação, robótica e programação',
        efeito: 'Com o objetivo de preparar os trabalhadores para novas demandas do mercado',
        detalhe: 'Com subsídio governamental para trabalhadores de setores mais vulneráveis',
      },
    },
  };

  const currentDemo = temasDemo[activeThemeId];

  const faqs = [
    {
      p: 'Como funciona a correção da minha redação?',
      r: 'Você digita ou cola sua redação no nosso estúdio (ou importa um arquivo/foto). Em menos de 5 segundos, o sistema analisa seu texto de acordo com as 5 Competências Oficiais do ENEM, apontando erros linha a linha com as regras gramaticais e gerando uma versão reescrita modelo Nota 1000 baseada na sua tese.',
    },
    {
      p: 'A correção segue os mesmos critérios dos corretores do ENEM (INEP)?',
      r: 'Sim! Toda a nossa grade de avaliação foi calibrada rigorosamente nos manuais e critérios oficiais de correção divulgados pelo INEP para os corretores do ENEM 2026.',
    },
    {
      p: 'Posso testar gratuitamente antes de assinar?',
      r: 'Com certeza! Você pode enviar sua primeira redação agora mesmo de forma 100% gratuita, sem necessidade de cadastrar cartão de crédito.',
    },
    {
      p: 'O que é a versão reescrita Nota 1000?',
      r: 'É uma ferramenta exclusiva que reconstrói os seus próprios argumentos no padrão de excelência de uma redação nota 1000, ensinando na prática como articular conectivos, repertórios sociológicos e a proposta de intervenção completa.',
    },
    {
      p: 'Como funciona a garantia de 7 dias?',
      r: 'Se por qualquer motivo você achar que a plataforma não está te ajudando a evoluir sua nota, basta nos enviar um e-mail em até 7 dias e devolvemos 100% do seu investimento sem perguntas.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#02040a] text-slate-100 font-sans antialiased relative overflow-x-hidden">
      
      {/* Background Atmosphere */}
      <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none z-0" />
      <div className="fixed inset-0 cyber-glow-mesh pointer-events-none z-0" />
      <div className="fixed inset-0 bg-radial-vignette pointer-events-none z-0" />

      <Navbar />

      <main className="flex-1 relative z-10">
        
        {/* =========================================================================
            1. HERO SECTION: VALOR CLARO, PERSUASIVO E DIRETO AO PONTO
           ========================================================================= */}
        <section className="pt-10 pb-16 md:pt-16 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center space-y-8">
          
          {/* Badge de Destaque */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs shadow-lg font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Matriz de Avaliação Oficial do ENEM 2026</span>
          </div>

          {/* Headline Monumental e Clara */}
          <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.08] max-w-4xl mx-auto">
            Tire mais de 900 na Redação do ENEM e{' '}
            <span className="text-gradient-cyber">garanta sua vaga na faculdade</span>
          </h1>

          {/* Subtítulo Simples e Persuasivo */}
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Correção detalhada <strong>linha por linha em menos de 5 segundos</strong>. Descubra exatamente onde você está perdendo pontos e receba a versão <strong>Nota 1000</strong> do seu próprio texto.
          </p>

          {/* CTA Principal de Alta Conversão */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              href="/nova-redacao"
              className="btn-cyber-primary w-full py-4 px-8 rounded-2xl text-sm font-heading font-black flex items-center justify-center gap-3 shadow-2xl group cursor-pointer"
            >
              <PenTool className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>AVALIAR MINHA REDAÇÃO GRÁTIS</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Benefícios Rápidos em Destaque */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Resultado em menos de 5s</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Critérios Oficiais do INEP</span>
            </span>
            <span className="flex items-center gap-1.5 text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>100% Grátis para Testar</span>
            </span>
          </div>

          {/* Prova Social Rápida */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-400">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-cyan-600 border-2 border-[#02040a] flex items-center justify-center font-bold text-white text-[10px]">LM</div>
              <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-[#02040a] flex items-center justify-center font-bold text-white text-[10px]">BS</div>
              <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-[#02040a] flex items-center justify-center font-bold text-white text-[10px]">GA</div>
              <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-[#02040a] flex items-center justify-center font-bold text-white text-[10px]">+2k</div>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
              </div>
              <span className="font-semibold text-white ml-1">4.9/5</span>
              <span>• Mais de 12.000 redações corrigidas</span>
            </div>
          </div>

        </section>

        {/* =========================================================================
            2. COMO FUNCIONA: 3 PASSOS ULTRA SIMPLES
           ========================================================================= */}
        <section id="como-funciona" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase">Passo a Passo Simples</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
              Como funciona a sua preparação
            </h2>
            <p className="text-sm text-slate-300">
              Você não precisa esperar dias pelo retorno de um professor. Evolua sua escrita a qualquer hora.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Passo 1 */}
            <div className="tech-card p-6 sm:p-8 rounded-2xl border border-cyan-500/20 space-y-4 relative">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-lg font-mono">
                01
              </div>
              <h3 className="font-heading text-lg font-bold text-white">
                Escreva ou Envie seu Texto
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Digite diretamente no estúdio com contagem de palavras e linhas, ou importe um arquivo em PDF, DOCX ou foto da sua folha de redação.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="tech-card p-6 sm:p-8 rounded-2xl border border-cyan-500/20 space-y-4 relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-lg font-mono">
                02
              </div>
              <h3 className="font-heading text-lg font-bold text-white">
                Diagnóstico Oficial em 5s
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Veja sua pontuação nas 5 Competências do ENEM e clique em cada erro marcado no texto para entender a regra gramatical e como corrigir.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="tech-card p-6 sm:p-8 rounded-2xl border border-emerald-500/30 space-y-4 relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg font-mono">
                03
              </div>
              <h3 className="font-heading text-lg font-bold text-white">
                Reescrita Nota 1000
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Receba uma versão modelo 1000 feita exclusivamente com a sua tese, aprendendo como os melhores alunos estruturam repertórios e conectivos.
              </p>
            </div>

          </div>
        </section>

        {/* =========================================================================
            3. SIMULADOR INTERATIVO AO VIVO (DEMONSTRAÇÃO REAL)
           ========================================================================= */}
        <section id="simulador" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase">Teste Interativo</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
              Veja a correção acontecendo na prática
            </h2>
            <p className="text-sm text-slate-300">
              Selecione um tema abaixo e clique nas marcações coloridas do texto para ver o parecer da banca examinadora:
            </p>
          </div>

          <div className="tech-card border border-cyan-500/30 p-5 sm:p-8 rounded-3xl space-y-6 shadow-2xl overflow-hidden">
            
            {/* Seletor de Temas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Scan className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Exemplo de Redação Corrigida
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Tema: {currentDemo.titulo}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-[#030612] p-1 rounded-xl border border-cyan-500/20">
                <button
                  onClick={() => setActiveThemeId('afro')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeThemeId === 'afro'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Herança Africana
                </button>
                <button
                  onClick={() => setActiveThemeId('registro')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeThemeId === 'registro'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Registro Civil
                </button>
                <button
                  onClick={() => setActiveThemeId('trabalho')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeThemeId === 'trabalho'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Trabalho & Tecnologia
                </button>
              </div>
            </div>

            {/* Grid do Relatório */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Texto com Marcações */}
              <div className="lg:col-span-7 bg-[#040815] border border-cyan-500/20 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between space-y-4">
                
                <div className="laser-bar" />

                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/[0.06] pb-2 font-medium">
                    <span>Trecho da Redação do Aluno:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correção Concluída
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
                    <p>{currentDemo.trecho1}</p>
                    <p>
                      "Em primeiro plano, convém notar que{' '}
                      <mark
                        onClick={() => setSelectedError(selectedError === 1 ? null : 1)}
                        className="annot-gramatica font-semibold cursor-pointer relative text-xs text-rose-300"
                        title="Clique para ver a regra explicada"
                      >
                        {currentDemo.erroTrecho}
                      </mark>{' '}
                      a preservação desses direitos de forma perene..."
                    </p>
                  </div>
                </div>

                {/* Popover Explicativo */}
                <div className="p-3.5 rounded-xl bg-[#081024] border border-cyan-500/40 space-y-1.5 text-xs relative z-10 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Como corrigir este trecho [Competência 1]:
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">CLIQUE PARA FECHAR</span>
                  </div>
                  <div className="text-slate-200">
                    Substituir: <span className="line-through text-rose-400">"{currentDemo.erroTrecho}"</span> ➔ <strong className="text-emerald-400">"{currentDemo.correcaoTrecho}"</strong>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {currentDemo.regra}
                  </p>
                </div>
              </div>

              {/* Painel de Notas C1-C5 */}
              <div className="lg:col-span-5 bg-[#040815] border border-cyan-500/20 rounded-2xl p-5 flex flex-col justify-between space-y-5">
                
                <div className="flex items-center justify-between bg-[#070e22] p-4 rounded-xl border border-cyan-500/30">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                      Nota Estimada
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-white font-mono text-glow-cyan">
                      {currentDemo.nota} <span className="text-xs text-slate-400 font-normal">/ 1000</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-bold">
                      ★ Faixa de Aprovação no SISU
                    </span>
                  </div>

                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/30">
                    <div className="w-full h-full bg-[#02050f] rounded-[10px] flex items-center justify-center text-cyan-300 font-black text-sm">
                      96%
                    </div>
                  </div>
                </div>

                {/* Barras das 5 Competências */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>C1: Gramática e Norma Culta</span>
                    <strong className="text-cyan-400">{currentDemo.c1}/200</strong>
                  </div>
                  <div className="w-full bg-[#0b1428] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${(currentDemo.c1/200)*100}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span>C2: Tema e Repertório Cultural</span>
                    <strong className="text-cyan-400">{currentDemo.c2}/200</strong>
                  </div>
                  <div className="w-full bg-[#0b1428] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${(currentDemo.c2/200)*100}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span>C3: Projeto de Texto e Argumentação</span>
                    <strong className="text-indigo-400">{currentDemo.c3}/200</strong>
                  </div>
                  <div className="w-full bg-[#0b1428] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(currentDemo.c3/200)*100}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span>C4: Coesão e Conectivos</span>
                    <strong className="text-purple-400">{currentDemo.c4}/200</strong>
                  </div>
                  <div className="w-full bg-[#0b1428] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(currentDemo.c4/200)*100}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span>C5: Proposta de Intervenção (5 Elementos)</span>
                    <strong className="text-emerald-400">{currentDemo.c5}/200</strong>
                  </div>
                  <div className="w-full bg-[#0b1428] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(currentDemo.c5/200)*100}%` }} />
                  </div>
                </div>

                {/* Validação da Proposta */}
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-emerald-300 text-[11px]">
                    <span>Os 5 Elementos da Conclusão:</span>
                    <span className="text-emerald-400">5/5 Identificados</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200">✓ Agente</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200">✓ Ação</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200">✓ Meio</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200">✓ Efeito</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200">✓ Detalhe</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* =========================================================================
            4. CALCULADORA DE IMPACTO NO SISU
           ========================================================================= */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase">Calculadora SISU & ProUni</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
              Veja quanto a redação aumenta a sua nota final
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mx-auto">
              Na maioria das faculdades, a redação tem o maior peso. Arraste a barra e simule suas chances de aprovação:
            </p>
          </div>

          <div className="tech-card p-6 sm:p-10 rounded-3xl border border-cyan-500/40 space-y-8 shadow-2xl">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-bold uppercase">Sua Meta na Redação:</span>
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
                  {notaSimulada} <span className="text-xs text-slate-400 font-normal">pontos</span>
                </div>
              </div>

              <input
                type="range"
                min={520}
                max={1000}
                step={40}
                value={notaSimulada}
                onChange={(e) => setNotaSimulada(Number(e.target.value))}
                className="cyber-slider cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>520 pts (Média Geral)</span>
                <span>760 pts (Bom)</span>
                <span>900 pts (Nota de Corte)</span>
                <span className="text-cyan-400 font-bold">1000 pts (Nota Máxima)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.08]">
              
              <div className="p-4 rounded-2xl bg-[#030612] border border-cyan-500/20 space-y-1">
                <span className="text-xs text-slate-400 block">Sua Média Geral no SISU:</span>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {mediaFinalSisu} <span className="text-xs text-slate-500 font-normal">pts</span>
                </div>
                <span className="text-xs text-cyan-400">Com peso 3 na redação</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#030612] border border-emerald-500/30 space-y-1">
                <span className="text-xs text-slate-400 block">Chances de Aprovação:</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-400">
                  {projecao.chance}
                </div>
                <span className="text-xs text-emerald-300">{projecao.percentil}</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#030612] border border-indigo-500/30 space-y-1">
                <span className="text-xs text-slate-400 block">Cursos ao seu Alcance:</span>
                <div className="text-xs sm:text-sm font-bold text-white line-clamp-2">
                  {projecao.curso}
                </div>
                <span className="text-[11px] text-indigo-400">Vagas Diretas na 1ª Chamada</span>
              </div>

            </div>

            <div className="p-4 rounded-2xl bg-[#081228] border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-slate-300">
                💡 <strong className="text-cyan-300">Dica Estratégica:</strong> Cada 40 pontos a mais na redação equivale a acertar cerca de <strong>12 questões a mais</strong> na prova de Matemática ou Natureza.
              </div>
              <Link
                href="/nova-redacao"
                className="btn-cyber-primary shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                QUERO TIRAR +900 PONTOS
              </Link>
            </div>

          </div>
        </section>

        {/* =========================================================================
            5. DEPOIMENTOS / PROVA SOCIAL DE QUEM PASSOU
           ========================================================================= */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase">Resultados Reais</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
              Quem treina aqui, passa na universidade dos sonhos
            </h2>
            <p className="text-sm text-slate-300">
              Veja a história de estudantes que subiram suas notas e conquistaram suas vagas pelo SISU:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Depoimento 1 */}
            <div className="tech-card p-6 rounded-2xl border border-cyan-500/20 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "Eu tirava 680 nos cursinhos tradicionais porque os professores demoravam 2 semanas para devolver e não explicavam onde eu errava. Na plataforma consegui corrigir 4 redações por semana. Subi para 960 no ENEM oficial e passei em Medicina!"
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Lucas Medeiros</h4>
                  <p className="text-[11px] text-cyan-400">Aprovado em Medicina • UFRJ</p>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-950/80 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30">
                  960 pts
                </span>
              </div>
            </div>

            {/* Depoimento 2 */}
            <div className="tech-card p-6 rounded-2xl border border-cyan-500/20 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "A versão reescrita Nota 1000 foi o divisor de águas. Ver como as minhas ideias ficavam escritas de forma perfeita me ensinou a usar repertórios e conectivos de verdade. Tirei 980 na redação do ENEM!"
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Beatriz Santos</h4>
                  <p className="text-[11px] text-cyan-400">Aprovada em Direito • USP</p>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-950/80 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30">
                  980 pts
                </span>
              </div>
            </div>

            {/* Depoimento 3 */}
            <div className="tech-card p-6 rounded-2xl border border-cyan-500/20 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "O checklist da Competência 5 me salvou. Eu sempre esquecia o detalhamento ou o meio. Depois que comecei a treinar aqui, gabaritei a C5 e garanti minha bolsa de 100% pelo ProUni."
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Gabriel Alencar</h4>
                  <p className="text-[11px] text-cyan-400">Ciência da Computação • UFMG</p>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-950/80 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30">
                  940 pts
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            6. SEÇÃO DE PLANOS & PREÇOS DE ALTA CONVERSÃO
           ========================================================================= */}
        <section id="planos" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase">Planos Acessíveis</span>
            <h2 className="font-heading text-3xl sm:text-5xl font-black text-white">
              Escolha o plano ideal para a sua aprovação
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Menos do que o valor de um lanche por mês para ter o melhor corretor do Brasil na sua mão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Plano Grátis */}
            <div className="tech-card p-6 sm:p-8 rounded-3xl border border-white/[0.08] space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gratuito</span>
                <h3 className="font-heading text-2xl font-bold text-white">Para Começar</h3>
                <div className="text-3xl font-black text-white font-mono">
                  R$ 0 <span className="text-xs text-slate-400 font-normal font-sans">/ sempre grátis</span>
                </div>
                <p className="text-xs text-slate-400">
                  Perfeito para conhecer a plataforma e fazer sua primeira avaliação hoje.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-white/[0.08]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>1 Redação Gratuita por dia</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>Nota das 5 Competências</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>Marcação dos erros gramaticais</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <span className="w-4 h-4 text-center">✕</span>
                    <span>Reescrita Nota 1000 Exclusiva</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/nova-redacao"
                className="w-full py-3 rounded-xl border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs font-bold text-center block transition-colors"
              >
                COMEÇAR GRATUITAMENTE
              </Link>
            </div>

            {/* Plano Aprovação (DESTAQUE / MAIS VENDIDO) */}
            <div className="tech-card p-6 sm:p-8 rounded-3xl border-2 border-cyan-400 space-y-6 flex flex-col justify-between relative shadow-[0_0_50px_rgba(0,240,255,0.25)]">
              
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 text-black text-[11px] font-black tracking-wider uppercase shadow-lg">
                ★ O MAIS ESCOLHIDO
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Plano Mensal</span>
                <h3 className="font-heading text-2xl font-black text-white">Aprovação ENEM</h3>
                <div>
                  <span className="text-xs text-slate-400 line-through">De R$ 49,90</span>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono text-glow-cyan">
                    R$ 19,90 <span className="text-xs text-slate-400 font-normal font-sans">/ mês</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300">
                  Tudo o que você precisa para alcançar mais de 900 pontos com tranquilidade.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-200 pt-3 border-t border-white/[0.08]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 font-bold" />
                    <span><strong>Redações Ilimitadas</strong> todo mês</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 font-bold" />
                    <span><strong>Reescrita Nota 1000</strong> instantânea</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 font-bold" />
                    <span>Auditoria completa dos 5 elementos da C5</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 font-bold" />
                    <span>Gráficos de evolução por competência</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 font-bold" />
                    <span>Exportação de laudo em PDF para impressão</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setShowCheckout(true)}
                className="btn-cyber-primary w-full py-3.5 rounded-xl text-xs font-heading font-black text-center block shadow-lg cursor-pointer hover:scale-105 transition-transform"
              >
                GARANTIR MEU ACESSO AGORA (R$ 19,90)
              </button>
            </div>

            {/* Plano Medicina 1000 (Vitalício / Anual) */}
            <div className="tech-card p-6 sm:p-8 rounded-3xl border border-indigo-500/40 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Acesso Vitalício</span>
                <h3 className="font-heading text-2xl font-bold text-white">Medicina 1000</h3>
                <div>
                  <span className="text-xs text-slate-400 line-through">De R$ 197,00</span>
                  <div className="text-3xl font-black text-white font-mono">
                    R$ 67,00 <span className="text-xs text-slate-400 font-normal font-sans">pagamento único</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Acesso completo até o dia do ENEM sem mensalidades recorrentes.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-white/[0.08]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-400" />
                    <span>Tudo do Plano Mensal incluso</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-400" />
                    <span><strong>Sem mensalidade</strong> (paga só 1 vez)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-400" />
                    <span>Banco de repertórios coringa para qualquer tema</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-400" />
                    <span>Suporte prioritário e novidades 2026</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setShowCheckout(true)}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold text-center block transition-colors cursor-pointer shadow-md hover:scale-105 transition-transform"
              >
                QUERO O ACESSO VITALÍCIO (R$ 67,00)
              </button>
            </div>

          </div>

          {/* Selo de Garantia Incondicional de 7 Dias */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#030918] border border-cyan-500/30 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-white">
                Garantia Incondicional de 7 Dias • Risco Zero
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Se dentro de 7 dias você sentir que a sua nota e a sua escrita não estão evoluindo, nós devolvemos 100% do seu dinheiro. Sem letras miúdas, sem burocracia.
              </p>
            </div>
          </div>

        </section>

        {/* =========================================================================
            7. FAQ: PERGUNTAS FREQUENTES
           ========================================================================= */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase">Tire Suas Dúvidas</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="tech-card rounded-2xl border border-cyan-500/20 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02]"
                  >
                    <span className="text-sm font-bold text-white font-heading">{faq.p}</span>
                    <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/[0.04] pt-3 font-sans">
                      {faq.r}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            8. CTA FINAL DE ALTO IMPACTO
           ========================================================================= */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="tech-card border border-cyan-500/40 p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-[0_0_80px_-15px_rgba(0,240,255,0.3)]">
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none" />

            <div className="space-y-3 relative z-10 max-w-2xl mx-auto">
              <h2 className="font-heading text-3xl sm:text-5xl font-black text-white tracking-tight">
                Sua vaga na faculdade começa na próxima redação
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
                Não deixe para a última hora. Envie sua redação agora e veja exatamente como garantir a sua nota máxima.
              </p>
            </div>

            <div className="pt-2 max-w-md mx-auto relative z-10">
              <Link
                href="/nova-redacao"
                className="btn-cyber-primary w-full py-4 px-8 rounded-2xl text-sm font-heading font-black flex items-center justify-center gap-3 shadow-2xl group cursor-pointer"
              >
                <PenTool className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>AVALIAR MINHA REDAÇÃO GRÁTIS</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <p className="text-xs text-slate-400 relative z-10">
              ✓ Teste 100% Grátis • Sem cartão de crédito • Resultado em segundos
            </p>

          </div>
        </section>

      </main>

      {/* Modal de Checkout Dinâmico com PIX */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={() => {
          fazerUpgradePlano('pro');
          window.location.href = '/nova-redacao';
        }}
      />

      <Footer />
    </div>
  );
}
