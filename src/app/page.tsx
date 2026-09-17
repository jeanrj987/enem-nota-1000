import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Award,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  FileCheck,
  Zap,
  ShieldCheck,
  GraduationCap,
  Users,
  Clock,
  ChevronRight,
  PenTool,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function LandingPage() {
  const competencias = [
    {
      num: 'C1',
      title: 'Norma Culta',
      desc: 'Detecção profunda de desvios gramaticais, pontuação, crase, concordância e regência verbal e nominal.',
      color: 'border-azul text-azul',
    },
    {
      num: 'C2',
      title: 'Tema & Repertório',
      desc: 'Validação de tese e checagem de repertório sociocultural legitimado, produtivo e pertinente.',
      color: 'border-ambar text-ambar',
    },
    {
      num: 'C3',
      title: 'Projeto de Texto',
      desc: 'Avaliação da coerência, defesa de ponto de vista e organização lógica das ideias e argumentos.',
      color: 'border-verde text-verde',
    },
    {
      num: 'C4',
      title: 'Coesão & Conectivos',
      desc: 'Análise detalhada de recursos coesivos interparágrafos e intraparágrafos sem repetições excessivas.',
      color: 'border-azul text-azul',
    },
    {
      num: 'C5',
      title: 'Proposta de Intervenção',
      desc: 'Contagem rigorosa dos 5 elementos (Agente, Ação, Meio, Efeito, Detalhamento) com respeito aos Direitos Humanos.',
      color: 'border-azul text-azul',
    },
  ];

  const passos = [
    {
      step: '01',
      title: 'Envie sua Redação',
      desc: 'Escreva diretamente em nosso editor inteligente ou faça upload do seu arquivo em PDF, DOCX ou TXT.',
      icon: PenTool,
    },
    {
      step: '02',
      title: 'Correção Especialista em < 10s',
      desc: 'Nosso sistema calibrado na Matriz Oficial do ENEM analisa cada parágrafo, linha por linha, com precisão cirúrgica.',
      icon: Sparkles,
    },
    {
      step: '03',
      title: 'Receba a Nota e Versão 1000',
      desc: 'Visualize nota por competência, erros destacados, plano de ação pedagógico e a versão reescrita sugerida.',
      icon: Award,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-papel text-tinta">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Glow Gradients */}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-azul text-azul text-xs font-semibold shadow-lg shadow-tinta/10 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-azul animate-pulse" />
            <span>Matriz Oficial do INEP Calibrada para o ENEM</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-tinta max-w-4xl mx-auto leading-[1.1]">
            Alcance a <span className="gradient-text">Nota 1000</span> na Redação do ENEM
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-tinta-suave max-w-2xl mx-auto leading-relaxed">
            Correção detalhada em segundos, nota pelas 5 competências oficiais, marcação de erros linha a linha e versão reescrita nota 1000.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/nova-redacao"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-azul hover:brightness-110 text-folha font-bold text-base shadow-xl shadow-tinta/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
            >
              <PenTool className="w-5 h-5" />
              <span>Corrigir Redação Agora</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-folha/90 hover:bg-folha-2 text-tinta font-semibold text-base border border-regua/80 shadow-lg hover:border-regua transition-all flex items-center justify-center gap-2"
            >
              <span>Ver Demonstração</span>
              <ChevronRight className="w-4 h-4 text-tinta-fraca" />
            </Link>
          </div>

          {/* Mini Trust Stats */}
          <div className="pt-10 flex flex-wrap items-center justify-center gap-8 text-xs text-tinta-fraca border-t border-regua/80">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-ambar" />
              <span>Resposta em menos de 10 segundos</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-verde" />
              <span>Critérios 100% alinhados ao INEP</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-azul" />
              <span>Análise das 5 Competências</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Preview Card Section */}
      <section className="py-12 bg-papel/60 border-y border-regua">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel p-6 sm:p-10 rounded-xl border border-regua shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-azul-claro text-azul text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Feedback Pedagógico Completo
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-tinta">
                  Muito mais do que uma nota: um guia passo a passo para a sua aprovação
                </h2>
                <p className="text-sm text-tinta-suave leading-relaxed">
                  Não fique na dúvida de onde você errou. Nossa ferramenta aponta exatamente o erro no texto, explica a regra gramatical ou de coesão envolvida e fornece a reescrita ideal.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-verde shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-tinta-suave">
                      <strong>Destaque visual interativo:</strong> clique sobre os trechos coloridos para entender o desvio e a melhoria.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-verde shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-tinta-suave">
                      <strong>Validação dos 5 elementos da C5:</strong> checagem de agente, ação, modo, efeito e detalhamento.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-verde shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-tinta-suave">
                      <strong>Exportação em PDF:</strong> baixe seu relatório oficial de correção formatado para arquivar ou imprimir.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mockup Preview Card */}
              <div className="lg:col-span-6">
                <div className="p-6 rounded-xl bg-folha border border-regua space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-regua pb-3">
                    <span className="text-xs font-bold text-tinta-suave">Prévia de Avaliação</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-verde-claro text-verde border border-verde/30">
                      960 / 1000 pts
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-tinta-fraca">Competência V (Proposta de Intervenção):</div>
                    <div className="p-3 rounded-xl bg-papel/80 border border-regua/80 text-xs text-tinta-suave">
                      <span className="text-verde font-bold">200/200 pts:</span> Todos os 5 elementos (Agente, Ação, Meio, Efeito e Detalhamento) foram validados com pleno respeito aos Direitos Humanos.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-tinta-fraca">Correção Linha por Linha:</div>
                    <div className="p-3 rounded-xl bg-vermelho-claro border border-vermelho/30 text-xs space-y-1">
                      <div className="text-tinta-suave">
                        <span className="line-through text-vermelho">"ensino básica e superior"</span> → <span className="text-verde font-bold">"ensino básico e superior"</span>
                      </div>
                      <p className="text-[11px] text-tinta-fraca">
                        Concordância nominal com o substantivo masculino "ensino".
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* As 5 Competências do ENEM */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-azul uppercase tracking-wider">
              <Award className="w-4 h-4" />
              Matriz do INEP
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-tinta">
              Avaliação completa nas 5 competências oficiais
            </h2>
            <p className="text-sm text-tinta-fraca">
              Cada eixo avalia até 200 pontos com os níveis específicos da banca examinadora.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competencias.map((comp) => (
              <div
                key={comp.num}
                className="glass-panel p-6 rounded-xl border border-regua hover:border-regua transition-all space-y-3"
              >
                <div className={`w-10 h-10 rounded-xl bg-azul flex items-center justify-center font-black text-sm border ${comp.color}`}>
                  {comp.num}
                </div>
                <h3 className="text-base font-bold text-tinta">{comp.title}</h3>
                <p className="text-xs text-tinta-fraca leading-relaxed">{comp.desc}</p>
              </div>
            ))}

            {/* Card Extra: Gráfico de Evolução */}
            <div className="glass-panel p-6 rounded-xl border border-azul bg-azul hover:brightness-110 to-folha hover:border-azul transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-azul-claro border border-azul flex items-center justify-center text-azul">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-tinta">Histórico & Radar</h3>
              <p className="text-xs text-tinta-suave leading-relaxed">
                Acompanhe o crescimento da sua nota ao longo das semanas através de gráficos interativos e descubra onde focar seus estudos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona em 3 Passos */}
      <section className="py-20 bg-papel/70 border-t border-regua">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-tinta">
              Como funciona em 3 passos simples
            </h2>
            <p className="text-sm text-tinta-fraca">
              Da digitação ao plano de melhoria em menos de 1 minuto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {passos.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.step} className="glass-panel p-8 rounded-xl border border-regua relative space-y-4">
                  <div className="text-4xl font-black text-tinta">{p.step}</div>
                  <div className="w-12 h-12 rounded-xl bg-azul-claro border border-azul flex items-center justify-center text-azul">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-tinta">{p.title}</h3>
                  <p className="text-xs sm:text-sm text-tinta-fraca leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="glass-panel p-8 sm:p-12 rounded-xl border border-azul bg-azul hover:brightness-110 to-folha relative overflow-hidden shadow-2xl">
            <div className="w-16 h-16 rounded-xl bg-azul-claro border border-azul flex items-center justify-center mx-auto text-azul shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-tinta pt-4">
              Pronto para elevar seu desempenho rumo à nota 1000?
            </h2>
            <p className="text-sm sm:text-base text-tinta-suave max-w-xl mx-auto">
              Envie sua redação agora mesmo e receba o diagnóstico completo com a nossa banca especialista.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/nova-redacao"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-azul hover:brightness-110 text-folha font-bold text-base shadow-xl shadow-tinta/10 transition-all flex items-center justify-center gap-2"
              >
                <PenTool className="w-5 h-5" />
                <span>Iniciar Minha Primeira Redação</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
