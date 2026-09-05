'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Lock,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  BookOpen,
  FileCheck,
  Target,
  Sparkles,
  HelpCircle,
  Mail,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { getDeviceId } from '@/lib/device-id';
import { PlanoId } from '@/lib/planos';

export default function PaginaDeVendas() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [planoCarregando, setPlanoCarregando] = useState<PlanoId | null>(null);
  const [erroCheckout, setErroCheckout] = useState<string | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const scrollToPricing = () => {
    const el = document.getElementById('oferta');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const iniciarCheckout = async (planoId: PlanoId) => {
    setErroCheckout(null);
    setPlanoCarregando(planoId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planoId, deviceId: getDeviceId() }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Não foi possível iniciar o pagamento.');
      }
      window.location.href = data.url;
    } catch (err: any) {
      setErroCheckout(err.message || 'Erro ao iniciar o pagamento.');
      setPlanoCarregando(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      {/* Top Header Independente & Sóbrio */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">
              Avaliador <span className="text-blue-400">Nota 1000</span>
            </span>
          </div>

          <button
            onClick={scrollToPricing}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
          >
            Ver Planos
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* 1. Headline & Subtítulo (Hero Section) */}
        <section className="pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-900 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/70 border border-blue-800/60 text-blue-300 text-xs font-medium">
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span>Matriz Oficial do INEP</span>
            </div>

            {/* Headline: Direta, benefício central, 11 palavras */}
            <h1 className="text-3xl sm:text-5xl md:text-[52px] font-extrabold text-white leading-[1.15] tracking-tight max-w-3xl mx-auto">
              Garanta mais de 900 pontos na redação do ENEM com correções imediatas
            </h1>

            {/* Subtítulo: 2 linhas, linguagem natural */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Receba avaliações detalhadas pelas 5 competências oficiais em segundos, com marcação exata dos erros e versão reescrita sugerida para o seu tema.
            </p>

            {/* CTA Inicial */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={scrollToPricing}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-lg shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Garantir Acesso ao Avaliador</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Garantia incondicional de 7 dias
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-400" />
                Liberação imediata
              </span>
            </div>
          </div>
        </section>

        {/* 2. Problema / Conexão */}
        <section className="py-16 md:py-20 bg-slate-950/60 border-b border-slate-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              O gargalo silencioso na preparação da redação
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              <p>
                Praticar redação com frequência é o único caminho para alcançar uma nota competitiva no ENEM. No entanto, o modelo tradicional de correção cria barreiras que atrasam a sua evolução.
              </p>
              <p>
                Na maioria dos cursinhos e plataformas, o estudante envia um texto e precisa esperar de 10 a 20 dias para receber o retorno. Quando a folha é devolvida, a linha de raciocínio daquele tema já foi esquecida, e os comentários costumam ser vagos: anotações como "melhore a coesão" ou "repertório insuficiente", sem indicar como reescrever.
              </p>
              <p>
                Sem um feedback imediato e transparente sobre cada uma das 5 competências, o estudante continua repetindo os mesmos desvios gramaticais e falhas na proposta de intervenção sem perceber.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Apresentação da Solução */}
        <section className="py-16 md:py-20 border-b border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="space-y-3 text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Um avaliador rigoroso e disponível a qualquer momento
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                O Avaliador Nota 1000 foi estruturado para fornecer o suporte técnico e pedagógico que você precisa para escrever com segurança.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Benefício 1 */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Correção em menos de 10 segundos</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Envie sua redação e receba o diagnóstico completo na hora. Isso permite corrigir o texto e produzir uma nova versão no mesmo dia.
                </p>
              </div>

              {/* Benefício 2 */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Critérios oficiais do INEP (C1 a C5)</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Avaliação detalhada com notas de 0 a 200 pontos em cada competência, permitindo identificar com precisão onde você ganha ou perde pontos.
                </p>
              </div>

              {/* Benefício 3 */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Marcação de erros linha por linha</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Cada desvio de concordância, pontuação, regência ou conectivo é destacado no texto com a justificativa da regra e a reescrita sugerida.
                </p>
              </div>

              {/* Benefício 4 */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Auditoria completa da Competência 5</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Checagem rigorosa dos 5 elementos da proposta de intervenção: Agente, Ação, Modo/Meio, Efeito e Detalhamento, garantindo os 200 pontos.
                </p>
              </div>

              {/* Benefício 5 */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 md:col-span-2">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Versão reescrita no padrão nota 1000</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  O sistema reconstrói os seus próprios argumentos em um modelo exemplar de nota máxima, mostrando na prática como articular repertórios e conectivos no tema escolhido.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Prova de Valor e Confiança */}
        <section className="py-16 bg-slate-950/70 border-b border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Rigor técnico baseado na grade oficial
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                A metodologia segue estritamente as diretrizes públicas da matriz de correção do ENEM.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs sm:text-sm">
                <span className="font-semibold text-slate-300">Exemplo de Diagnóstico em Tempo Real</span>
                <span className="font-bold text-blue-400">Análise da Competência 1</span>
              </div>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <div className="text-slate-300">
                    Trecho apontado: <span className="line-through text-red-400 font-mono">"os estudantes tem acesso"</span> → Correção: <strong className="text-emerald-400 font-mono">"os estudantes têm acesso"</strong>
                  </div>
                  <p className="text-xs text-slate-400">
                    O verbo "ter" na 3ª pessoa do plural exige acento circunflexo diferencial obrigatório.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <div className="text-slate-300">
                    Auditoria da Competência 5: <span className="text-emerald-400 font-semibold">5 de 5 elementos validados</span> (Agente, Ação, Meio, Efeito e Detalhamento presentes).
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Como Funciona (Fluxo Simplificado em 4 Passos) */}
        <section className="py-16 md:py-20 border-b border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Como funciona o acesso
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Processo simples, prático e 100% digital.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-left">
                <div className="text-xs font-black text-blue-400 uppercase tracking-wider">Passo 1</div>
                <h3 className="text-sm font-bold text-white">Escolha seu plano</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Selecione o período de acesso ideal para o seu cronograma de estudos.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-left">
                <div className="text-xs font-black text-blue-400 uppercase tracking-wider">Passo 2</div>
                <h3 className="text-sm font-bold text-white">Liberação imediata</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Os dados de login são enviados automaticamente para seu e-mail após a confirmação.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-left">
                <div className="text-xs font-black text-blue-400 uppercase tracking-wider">Passo 3</div>
                <h3 className="text-sm font-bold text-white">Envie sua redação</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Digite direto no editor ou faça upload do seu arquivo em PDF, Word ou texto.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-left">
                <div className="text-xs font-black text-blue-400 uppercase tracking-wider">Passo 4</div>
                <h3 className="text-sm font-bold text-white">Receba o relatório</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Veja a nota, as marcações de erro e a versão nota 1000 em menos de 10 segundos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Oferta / Preço */}
        <section id="oferta" className="py-16 md:py-24 bg-slate-950/80 border-b border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Planos de Acesso ao Avaliador
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Acesso direto e sem contratos de longo prazo. Escolha a melhor opção para a sua rotina:
              </p>
              {erroCheckout && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-4 py-2 inline-block">
                  {erroCheckout}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* Plano Mensal */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white">Mensal</h3>
                  <p className="text-xs text-slate-400">Ideal para testar a plataforma no seu ritmo.</p>
                  <div>
                    <div className="text-3xl font-bold text-white">
                      R$ 29,90 <span className="text-xs font-normal text-slate-400">/mês</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Renovação mensal, cancele quando quiser</span>
                  </div>

                  <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Correções ilimitadas no mês</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Avaliação pelas 5 competências</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Marcação de erros no texto</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => iniciarCheckout('mensal')}
                  disabled={planoCarregando !== null}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {planoCarregando === 'mensal' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assinar Plano Mensal'}
                </button>
              </div>

              {/* Plano Anual (Destaque) */}
              <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border-2 border-blue-500 flex flex-col justify-between space-y-6 relative shadow-xl shadow-blue-500/10 scale-[1.02]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-[11px] uppercase tracking-wide">
                  Mais Escolhido
                </div>

                <div className="space-y-4 pt-1">
                  <h3 className="text-lg font-bold text-white">Anual (Até o ENEM)</h3>
                  <p className="text-xs text-slate-300">Acesso contínuo com todas as ferramentas inclusas.</p>
                  <div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-blue-400">
                      12x R$ 14,90
                    </div>
                    <span className="text-xs text-slate-300">ou R$ 147,00 à vista</span>
                  </div>

                  <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-200">
                    <li className="flex items-center gap-2 font-medium text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Correções ilimitadas 24h por dia</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Versão reescrita nota 1000 em todas</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Auditoria completa da Competência 5</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Exportação de relatórios em PDF</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Garantia incondicional de 7 dias</span>
                    </li>
                  </ul>
                </div>

                {/* 7. CTA Principal */}
                <div className="space-y-2">
                  <button
                    onClick={() => iniciarCheckout('anual')}
                    disabled={planoCarregando !== null}
                    className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm text-center shadow-lg shadow-blue-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {planoCarregando === 'anual' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Garantir Acesso ao Avaliador'}
                  </button>
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pagamento seguro • Acesso imediato</span>
                  </div>
                </div>
              </div>

              {/* Plano Semestral */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white">Semestral</h3>
                  <p className="text-xs text-slate-400">Para intensificar o treino na reta de preparação.</p>
                  <div>
                    <div className="text-3xl font-bold text-white">
                      R$ 89,00 <span className="text-xs font-normal text-slate-400">/semestre</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Pagamento único para 6 meses</span>
                  </div>

                  <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Correções ilimitadas por 6 meses</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Versão reescrita nota 1000 inclusa</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Matriz das 5 competências</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => iniciarCheckout('semestral')}
                  disabled={planoCarregando !== null}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {planoCarregando === 'semestral' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assinar Plano Semestral'}
                </button>
              </div>
            </div>

            {/* Bloco de Garantia Honesta */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Garantia de 7 dias para testar</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Utilize o avaliador, envie suas redações e analise a qualidade dos diagnósticos. Se por qualquer motivo não for útil para seus estudos, solicite o reembolso em até 7 dias para devolução integral do valor pago.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Objeções / Perguntas Frequentes (FAQ) */}
        <section className="py-16 md:py-20 border-b border-slate-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                <HelpCircle className="w-4 h-4" />
                <span>Dúvidas Frequentes</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: 'A avaliação segue os critérios reais do ENEM?',
                  a: 'Sim. A avaliação é orientada estritamente pela matriz oficial do INEP, atribuindo notas de 0 a 200 pontos em cada uma das 5 competências e verificando a presença dos 5 elementos da proposta de intervenção.',
                },
                {
                  q: 'Quanto tempo leva para a redação ser corrigida?',
                  a: 'A resposta é gerada em menos de 10 segundos após o envio do texto, com todas as notas, marcações de erros e sugestões de melhoria prontas para visualização.',
                },
                {
                  q: 'Como recebo o acesso após a compra?',
                  a: 'A liberação é automática e imediata. Logo após a confirmação do pagamento, você recebe os dados de acesso diretamente no seu e-mail.',
                },
                {
                  q: 'Posso enviar redações em arquivo ou apenas digitando?',
                  a: 'Você pode escrever diretamente no editor integrado da plataforma ou importar arquivos salvos nos formatos PDF, Word (.docx) ou bloco de notas (.txt).',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-white text-xs sm:text-sm hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    {openFaq === idx ? (
                      <ChevronUp className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {openFaq === idx && (
                    <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/40">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA Final */}
            <div className="pt-8 text-center space-y-3">
              <button
                onClick={scrollToPricing}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-600/25 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Garantir Acesso ao Avaliador</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-slate-400">
                Acesso imediato • Garantia de 7 dias
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Rodapé Sóbrio & Sem Distrações */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <GraduationCap className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-300">Avaliador Nota 1000</span>
            <span>• Plataforma de apoio ao vestibulando</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Garantia de 7 dias</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> suporte@avaliadornota1000.com
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
