'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { PLANOS, PlanoId } from '@/lib/planos';
import { useAuth } from '@/contexts/AuthContext';
import { urlDeLogin } from '@/lib/redirecionamento';

const COMPETENCIAS = [
  { sigla: 'C1', titulo: 'Domínio da escrita', texto: 'Identifique desvios de gramática, pontuação, concordância, regência e outros aspectos da escrita formal.' },
  { sigla: 'C2', titulo: 'Tema e repertório', texto: 'Veja se o texto responde ao tema e se o repertório contribui para a argumentação.' },
  { sigla: 'C3', titulo: 'Organização', texto: 'Entenda se suas ideias estão selecionadas, organizadas e relacionadas de forma consistente.' },
  { sigla: 'C4', titulo: 'Coesão', texto: 'Identifique pontos de atenção na ligação entre ideias, frases e parágrafos.' },
  { sigla: 'C5', titulo: 'Intervenção', texto: 'Analise sua proposta de intervenção e os elementos que podem ser aprimorados.' },
];

const PASSOS = [
  { titulo: 'Envie sua redação', texto: 'Digite no editor ou importe um arquivo em PDF, Word ou texto simples.' },
  { titulo: 'O sistema analisa', texto: 'A correção avalia os critérios oficiais do INEP para as cinco competências.' },
  { titulo: 'Entenda sua nota', texto: 'Veja a pontuação estimada e a distribuição por competência.' },
  { titulo: 'Saiba como melhorar', texto: 'Receba pontos de atenção e uma versão reescrita para orientar seu próximo texto.' },
];

const BENEFICIOS = [
  { icon: '🎯', titulo: 'Saiba onde focar', texto: 'Pare de estudar tudo ao mesmo tempo e identifique pontos prioritários.' },
  { icon: '⚡', titulo: 'Tenha feedback rápido', texto: 'Transforme mais práticas em ciclos de correção e aprendizado.' },
  { icon: '📈', titulo: 'Acompanhe sua evolução', texto: 'Compare suas correções e visualize seu progresso.' },
  { icon: '🧠', titulo: 'Aprenda com seus erros', texto: 'Use cada redação como informação para melhorar a próxima.' },
];

const FAQ = [
  {
    q: 'A avaliação segue os critérios reais do ENEM?',
    a: 'Sim. A avaliação é orientada pela matriz oficial do INEP, atribuindo notas de 0 a 200 pontos em cada uma das cinco competências e verificando a presença dos cinco elementos da proposta de intervenção.',
  },
  {
    q: 'Quanto tempo leva para a redação ser corrigida?',
    a: 'A resposta é gerada em menos de dez segundos após o envio do texto, com todas as notas, marcações de erro e sugestões de melhoria prontas para visualização.',
  },
  {
    q: 'Como recebo o acesso após a compra?',
    a: 'A liberação é automática e imediata. Basta criar sua conta antes de pagar — assim que o pagamento é confirmado, o acesso já aparece na sua própria conta, sem precisar esperar e-mail.',
  },
  {
    q: 'Posso enviar redações em arquivo ou apenas digitando?',
    a: 'Você pode escrever diretamente no editor da plataforma ou importar arquivos nos formatos PDF, Word (.docx) ou bloco de notas (.txt), desde que tenham texto real e legível — fotos ou digitalizações de redação manuscrita não são aceitas, para garantir a melhor precisão da nota.',
  },
];

export default function PaginaDeVendas() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [planoCarregando, setPlanoCarregando] = useState<PlanoId | null>(null);

  const scrollToPricing = () => {
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
  };

  // O checkout da Kiwify é um link fixo (não uma sessão criada dinamicamente
  // pela nossa API, como era no Stripe), então não há como carimbar o
  // user_id nele. Pré-preencher o e-mail da conta logada é o que reduz a
  // chance de a compra chegar no webhook com um e-mail que não bate com
  // nenhuma conta — mas depende de a aluna/aluno não trocar o e-mail na
  // hora de pagar.
  const iniciarCheckout = (planoId: PlanoId) => {
    if (!usuario) {
      router.push(urlDeLogin('/vendas'));
      return;
    }

    setPlanoCarregando(planoId);
    const url = new URL(PLANOS[planoId].checkoutUrl);
    if (usuario.email) {
      url.searchParams.set('email', usuario.email);
    }
    window.location.href = url.toString();
  };

  return (
    <div className="fonte-humanista min-h-screen bg-papel text-tinta">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-regua bg-papel/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-lg font-black tracking-tight">
            NOTA <span className="text-azul">1000</span>
          </span>
          <div className="hidden md:flex items-center gap-7 text-sm text-tinta-suave">
            <a href="#como" className="hover:text-tinta transition-colors">Como funciona</a>
            <a href="#competencias" className="hover:text-tinta transition-colors">Competências</a>
            <a href="#planos" className="hover:text-tinta transition-colors">Planos</a>
            <a href="#faq" className="hover:text-tinta transition-colors">Dúvidas</a>
          </div>
          <button
            onClick={scrollToPricing}
            className="cursor-pointer rounded-xl bg-tinta px-4 py-2.5 text-sm font-bold text-papel hover:brightness-110 transition"
          >
            Corrigir minha redação
          </button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div className="pointer-events-none absolute -right-40 -top-32 h-[500px] w-[600px] rounded-full bg-azul/15 blur-[100px]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-regua bg-folha px-3.5 py-1.5 text-[11px] font-extrabold tracking-widest text-azul">
              📝 CORRETOR DE REDAÇÃO ONLINE
            </span>

            <h1 className="mt-5 max-w-3xl text-[2.4rem] font-black leading-[1.05] tracking-tight sm:text-6xl">
              Descubra exatamente por que sua redação{' '}
              <span className="gradient-text">não está chegando aos 900+</span>
            </h1>

            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-tinta-suave">
              Corrija sua redação com uma análise detalhada baseada nos critérios de avaliação do
              ENEM, veja onde está perdendo pontos e receba orientações práticas para melhorar seu
              próximo texto.
            </p>

            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <button
                onClick={scrollToPricing}
                className="cursor-pointer rounded-xl bg-azul px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_35px_rgba(79,140,255,0.25)] transition hover:brightness-110"
              >
                CORRIGIR MINHA REDAÇÃO →
              </button>
              <span className="text-[13px] text-tinta-fraca">
                Sem promessa de nota garantida. O objetivo é transformar cada redação em aprendizado.
              </span>
            </div>

            <div className="mt-7 flex flex-wrap gap-4 text-[13px] text-tinta-suave">
              <span>✓ 5 competências</span>
              <span>✓ Correção detalhada</span>
              <span>✓ Resultado rápido</span>
            </div>
          </div>
        </section>

        <div className="border-y border-regua py-5">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-6 text-[13px] text-tinta-fraca">
            <span>Baseado nos critérios públicos de avaliação do ENEM</span>
            {['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => (
              <strong key={c} className="text-tinta-suave">{c}</strong>
            ))}
          </div>
        </div>

        {/* O problema */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-azul">O problema</span>
            <h2 className="mx-auto mt-3 max-w-3xl text-[2rem] font-black leading-tight tracking-tight sm:text-4xl">
              Você escreve redações, mas ainda não sabe exatamente onde está errando?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] text-tinta-suave">
              Uma nota sozinha não mostra o caminho. Você precisa entender o motivo da pontuação e o
              que fazer a partir dela.
            </p>

            <div className="mt-12 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['❓', 'Recebe uma nota, mas não entende o motivo', 'Você sabe o número, mas não sabe exatamente o que precisa mudar.'],
                ['🔁', 'Repete os mesmos erros', 'Corrige uma redação e acaba cometendo os mesmos problemas na próxima.'],
                ['🎯', 'Não sabe qual competência te segura', 'C1? C2? C3? C4? C5? Descubra onde concentrar seu estudo.'],
                ['⏳', 'Precisa esperar por uma correção', 'Tenha feedback rápido para transformar prática em aprendizado.'],
              ].map(([icon, titulo, texto]) => (
                <div key={titulo} className="glass-card p-6 text-left">
                  <div className="text-2xl">{icon}</div>
                  <h3 className="mt-4 text-[17px] font-bold">{titulo}</h3>
                  <p className="mt-1.5 text-[13px] text-tinta-fraca">{texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* A virada */}
        <section className="border-y border-regua bg-folha-2/60 py-24 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <span className="text-[11px] font-black uppercase tracking-widest text-azul">A virada</span>
            <h2 className="mt-3 text-[1.75rem] font-black tracking-tight">Nota sem diagnóstico não ensina.</h2>
            <p className="mt-4 text-[15px] text-tinta-suave">
              Você precisa entender <strong className="text-tinta">onde perdeu pontos, por que perdeu e como melhorar.</strong>
            </p>
            <h2 className="mt-6 text-2xl font-black tracking-tight text-azul">É isso que o Nota 1000 faz.</h2>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como" className="py-24">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-azul">Como funciona</span>
            <h2 className="mx-auto mt-3 max-w-2xl text-[2rem] font-black leading-tight tracking-tight sm:text-4xl">
              Da redação ao diagnóstico em poucos passos.
            </h2>

            <div className="mt-12 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {PASSOS.map((p, i) => (
                <div key={p.titulo} className="glass-card p-6 text-left">
                  <span className="text-xs font-black text-azul">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-2 text-[17px] font-bold">{p.titulo}</h3>
                  <p className="mt-1.5 text-[13px] text-tinta-fraca">{p.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* As competências */}
        <section id="competencias" className="border-y border-regua bg-folha-2/60 py-24">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-azul">As 5 competências</span>
            <h2 className="mx-auto mt-3 max-w-2xl text-[2rem] font-black leading-tight tracking-tight sm:text-4xl">
              Sua redação é avaliada por cinco competências.
            </h2>

            <div className="mt-12 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
              {COMPETENCIAS.map((c) => (
                <div key={c.sigla} className="glass-card p-5 text-left">
                  <b className="text-2xl font-black text-azul">{c.sigla}</b>
                  <h3 className="mt-2 text-[15px] font-bold">{c.titulo}</h3>
                  <p className="mt-1 text-[12px] text-tinta-fraca">{c.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-azul">Benefícios</span>
            <h2 className="mx-auto mt-3 text-[2rem] font-black leading-tight tracking-tight sm:text-4xl">
              Estude redação com mais clareza.
            </h2>

            <div className="mt-12 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {BENEFICIOS.map((b) => (
                <div key={b.titulo} className="glass-card p-6 text-left">
                  <div className="text-2xl">{b.icon}</div>
                  <h3 className="mt-4 text-[17px] font-bold">{b.titulo}</h3>
                  <p className="mt-1.5 text-[13px] text-tinta-fraca">{b.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="border-y border-regua bg-folha-2/60 py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <span className="text-[11px] font-black uppercase tracking-widest text-azul">Oferta</span>
              <h2 className="mx-auto mt-3 max-w-xl text-[2rem] font-black leading-tight tracking-tight sm:text-4xl">
                Escolha como você quer treinar sua redação.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[15px] text-tinta-suave">
                Correções ilimitadas em qualquer plano. Sem fidelidade e com garantia de sete dias.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {/* Mensal — destaque */}
              <div className="price relative flex flex-col justify-between rounded-2xl border-2 border-azul bg-folha p-7 shadow-[0_0_0_1px_rgba(79,140,255,0.15),0_25px_60px_rgba(0,0,0,0.25)]">
                <span className="absolute right-5 top-5 rounded-full bg-azul-claro px-2.5 py-1 text-[10px] font-black text-azul">
                  MAIS ESCOLHIDO
                </span>
                <div>
                  <h3 className="text-lg font-bold">Mensal</h3>
                  <p className="mt-1 text-[13px] text-tinta-fraca">Renova todo mês, cancele quando quiser.</p>
                  <p className="mt-5 text-4xl font-black tracking-tight">R$ 97,00</p>
                  <p className="text-[12px] text-tinta-fraca">por mês, assinatura recorrente</p>

                  <ul className="mt-6 space-y-2.5 border-t border-regua pt-5 text-[13px] text-tinta-suave">
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-azul" />
                      Correções ilimitadas todo mês
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-azul" />
                      Avaliação pelas cinco competências
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-azul" />
                      Versão reescrita nota 1000
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-azul" />
                      Marcação de erros no texto
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => iniciarCheckout('mensal')}
                  disabled={planoCarregando !== null}
                  className="mt-7 flex cursor-pointer items-center justify-center rounded-xl bg-azul px-5 py-3.5 text-[13px] font-bold text-white shadow-[0_12px_35px_rgba(79,140,255,0.25)] transition hover:brightness-110 disabled:opacity-50"
                >
                  {planoCarregando === 'mensal' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assinar mensal'}
                </button>
              </div>

              {/* Único — 30 dias */}
              <div className="flex flex-col justify-between rounded-2xl border border-regua bg-folha p-7">
                <div>
                  <h3 className="text-lg font-bold">Acesso 30 dias</h3>
                  <p className="mt-1 text-[13px] text-tinta-fraca">Pagamento único, sem renovar sozinho.</p>
                  <p className="mt-5 text-4xl font-black tracking-tight">R$ 147,00</p>
                  <p className="text-[12px] text-tinta-fraca">pagamento único, 30 dias de acesso</p>

                  <ul className="mt-6 space-y-2.5 border-t border-regua pt-5 text-[13px] text-tinta-suave">
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-azul" />
                      Correções ilimitadas por 30 dias
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-azul" />
                      Versão reescrita nota 1000
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-azul" />
                      Matriz das cinco competências
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => iniciarCheckout('unico')}
                  disabled={planoCarregando !== null}
                  className="mt-7 flex cursor-pointer items-center justify-center rounded-xl border border-regua bg-folha-2 px-5 py-3.5 text-[13px] font-bold text-tinta transition hover:border-azul disabled:opacity-50"
                >
                  {planoCarregando === 'unico' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Comprar acesso de 30 dias'}
                </button>
              </div>
            </div>

            {/* Garantia */}
            <div className="mt-12 flex flex-col items-start gap-5 rounded-2xl border border-regua bg-folha p-7 sm:flex-row sm:items-center">
              <div className="text-4xl">🛡️</div>
              <div>
                <h3 className="text-base font-bold">Você pode testar sem medo.</h3>
                <p className="mt-1 text-[13px] text-tinta-fraca">
                  Use o avaliador, envie suas redações e analise a qualidade dos diagnósticos. Se não
                  for útil para os seus estudos, peça o reembolso em até sete dias e receba o valor
                  integral de volta, sem justificativa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="text-center">
              <span className="text-[11px] font-black uppercase tracking-widest text-azul">Dúvidas</span>
              <h2 className="mx-auto mt-3 text-[2rem] font-black leading-tight tracking-tight sm:text-4xl">
                Perguntas frequentes
              </h2>
            </div>

            <div className="mt-10 space-y-2.5">
              {FAQ.map((item, idx) => (
                <div key={item.q} className="rounded-xl border border-regua bg-folha">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="flex w-full cursor-pointer items-center justify-between gap-6 px-5 py-4 text-left"
                  >
                    <span className="text-[14px] font-bold">{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-tinta-fraca transition-transform ${
                        openFaq === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <p className="px-5 pb-5 text-[13px] leading-relaxed text-tinta-fraca">{item.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="relative overflow-hidden py-28 text-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[500px] w-[700px] rounded-full bg-azul/10 blur-[100px]" />
          </div>
          <div className="relative mx-auto max-w-xl px-6">
            <span className="text-[11px] font-black uppercase tracking-widest text-azul">Comece agora</span>
            <h2 className="mt-3 text-[2rem] font-black leading-tight tracking-tight sm:text-4xl">
              Pare de escrever redações no escuro.
            </h2>
            <p className="mt-4 text-[15px] text-tinta-suave">
              Envie sua redação, descubra onde está perdendo pontos e saiba o que melhorar no próximo
              texto.
            </p>
            <button
              onClick={scrollToPricing}
              className="mt-8 cursor-pointer rounded-xl bg-azul px-8 py-3.5 text-sm font-bold text-white shadow-[0_12px_35px_rgba(79,140,255,0.25)] transition hover:brightness-110"
            >
              CORRIGIR MINHA PRIMEIRA REDAÇÃO →
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-regua py-10">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-6 text-[12px] text-tinta-fraca sm:flex-row">
          <span className="font-bold text-tinta-suave">Nota 1000 · Avaliador de redação do ENEM</span>
          <span>suporte@avaliadornota1000.com</span>
        </div>
      </footer>
    </div>
  );
}
