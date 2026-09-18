'use client';

/**
 * Landing única do produto — é a antiga `/vendas`, promovida a home.
 *
 * Até 17/09 existiam duas portas de entrada com identidades visuais
 * diferentes: esta página de vendas e uma `LandingPage` institucional em `/`,
 * com `Navbar`/`Footer` do app. Quem criava conta e esbarrava no gate de
 * assinatura era jogado de uma para a outra e via o site "mudar por
 * completo" no meio do funil. Sobrou a que vende; `/vendas` continua
 * existindo só como redirect (ver `src/app/vendas/page.tsx`), porque o link
 * já circula em anúncio e material de divulgação.
 *
 * Shell próprio (header e footer aqui dentro, sem `Navbar`/`Footer`) é
 * intencional: visitante deslogado não tem o que fazer com um menu de
 * Dashboard/Histórico que só vai devolvê-lo para cá.
 *
 * REESTRUTURAÇÃO DE 18/09 — o que estava errado e o que mudou
 *
 * 1. **A página escondia a própria oferta.** O produto dá 3 correções
 *    gratuitas (`LIMITE_CORRECOES_GRATUITAS`, `assinatura-servidor.ts`) e
 *    `/nova-redacao` nunca exigiu assinatura — mas a landing não dizia isso
 *    em lugar nenhum. A prova de valor já estava construída e invisível.
 * 2. **O botão mentia.** Todo CTA dizia "CORRIGIR MINHA REDAÇÃO" e rolava
 *    para a tabela de preços. Quem clicava pedindo para corrigir recebia um
 *    pedido de pagamento: a quebra de promessa acontecia no primeiro clique.
 * 3. **Não havia nenhuma prova.** A página afirmava "análise detalhada",
 *    "erros destacados", "versão reescrita" — e pedia fé. Agora mostra uma
 *    correção de exemplo montada com as mesmas classes do produto real
 *    (`ExemploCorrecao`).
 * 4. **A fronteira grátis/pago era omitida**, o que gera reembolso e
 *    reclamação. Agora está declarada antes do preço, não depois.
 *
 * O fio condutor, do topo ao rodapé: nota sem diagnóstico não ensina → veja
 * o diagnóstico → confira de graça na sua própria redação → assine se valer.
 * O CTA do topo e o do fim são a MESMA ação, de propósito.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Loader2, Lock, Sparkles } from 'lucide-react';
import { PLANOS, PlanoId } from '@/lib/planos';
import { useAuth } from '@/contexts/AuthContext';
import { DESTINO_PADRAO, urlDeLogin } from '@/lib/redirecionamento';
import { supabase } from '@/lib/supabase';
import { lerAtribuicao } from '@/lib/analytics/atribuicao';
import { rastrearInicioCheckout, rastrearVisitaVendas } from '@/lib/analytics/eventos-cliente';
import { ExemploCorrecao } from '@/components/vendas/ExemploCorrecao';

/** Precisa bater com `LIMITE_CORRECOES_GRATUITAS` em `assinatura-servidor.ts`,
 *  que é o valor que o servidor de fato aplica. Divergir aqui promete na
 *  venda um número que a rota depois nega. */
const CORRECOES_GRATUITAS = 3;

const COMPETENCIAS = [
  { sigla: 'C1', titulo: 'Domínio da escrita', texto: 'Identifique desvios de gramática, pontuação, concordância, regência e outros aspectos da escrita formal.' },
  { sigla: 'C2', titulo: 'Tema e repertório', texto: 'Veja se o texto responde ao tema e se o repertório contribui para a argumentação.' },
  { sigla: 'C3', titulo: 'Organização', texto: 'Entenda se suas ideias estão selecionadas, organizadas e relacionadas de forma consistente.' },
  { sigla: 'C4', titulo: 'Coesão', texto: 'Identifique pontos de atenção na ligação entre ideias, frases e parágrafos.' },
  { sigla: 'C5', titulo: 'Intervenção', texto: 'Analise sua proposta de intervenção e os elementos que podem ser aprimorados.' },
];

const PASSOS = [
  { titulo: 'Crie sua conta', texto: `Leva menos de um minuto e já libera suas ${CORRECOES_GRATUITAS} correções gratuitas. Não pedimos cartão.` },
  { titulo: 'Envie sua redação', texto: 'Digite no editor ou importe um arquivo em PDF, Word ou texto simples.' },
  { titulo: 'Veja quantos desvios tem', texto: 'Em segundos você descobre quantos pontos de atenção o seu texto tem — e se ele seria anulado.' },
  { titulo: 'Abra o diagnóstico', texto: 'Com um plano ativo, veja a nota de cada competência, cada desvio marcado no texto e o que fazer na próxima redação.' },
];

const FAQ = [
  {
    q: `As ${CORRECOES_GRATUITAS} correções grátis são de verdade? Precisa de cartão?`,
    a: `São de verdade e não pedimos cartão em momento nenhum. Você cria a conta, envia até ${CORRECOES_GRATUITAS} redações e o sistema corrige cada uma. O que você recebe sem pagar é o veredito: quantos desvios o texto tem e se ele seria anulado pelos critérios do INEP. O diagnóstico completo — nota por competência, cada desvio marcado no seu texto, versão reescrita e plano de estudo — é o que fica com o plano.`,
  },
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
    a: 'A liberação é automática e imediata. Crie sua conta antes de pagar e use o mesmo e-mail no checkout — assim que o pagamento é confirmado, o acesso aparece na sua conta. Se você pagou com outro e-mail e o acesso não liberou, dá para destravar sozinho em "Destrave sua compra", logo abaixo dos planos.',
  },
  {
    q: 'Posso enviar redações em arquivo ou apenas digitando?',
    a: 'Você pode escrever diretamente no editor da plataforma ou importar arquivos nos formatos PDF, Word (.docx) ou bloco de notas (.txt), desde que tenham texto real e legível — fotos ou digitalizações de redação manuscrita não são aceitas, para garantir a melhor precisão da nota.',
  },
  {
    q: 'E se eu assinar e não gostar?',
    a: 'Você pede o reembolso em até sete dias e recebe o valor integral de volta, sem precisar justificar. É por isso que as correções gratuitas vêm antes: a ideia é que você já saiba se o diagnóstico serve para você antes mesmo de pagar.',
  },
];

export default function PaginaInicial() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [planoCarregando, setPlanoCarregando] = useState<PlanoId | null>(null);

  // Marca a visita à página de vendas para o Meta e o GA4. É o denominador do
  // funil: sem ele não existe taxa de conversão, só contagem de vendas.
  useEffect(() => {
    rastrearVisitaVendas();
  }, []);

  /** Destino do CTA principal: a correção gratuita. Quem não tem conta passa
   *  pelo login levando o destino junto, para não se perder no caminho. */
  const destinoCorrecaoGratuita = usuario ? DESTINO_PADRAO : urlDeLogin(DESTINO_PADRAO);

  /**
   * O checkout da Kiwify é um link fixo (não uma sessão criada dinamicamente
   * pela nossa API, como era no Stripe), então não há como carimbar o
   * user_id nele. Pré-preencher o e-mail da conta logada é o que reduz a
   * chance de a compra chegar no webhook com um e-mail que não bate com
   * nenhuma conta — mas depende de a aluna/aluno não trocar o e-mail na
   * hora de pagar. Quando troca, o resgate é em `/vincular-compra`.
   */
  const iniciarCheckout = async (planoId: PlanoId) => {
    if (!usuario) {
      router.push(urlDeLogin('/'));
      return;
    }

    setPlanoCarregando(planoId);
    rastrearInicioCheckout({ planoId, valor: PLANOS[planoId].precoReais });
    await guardarAtribuicao();

    const url = new URL(PLANOS[planoId].checkoutUrl);
    if (usuario.email) url.searchParams.set('email', usuario.email);
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
            <a href="#exemplo" className="hover:text-tinta transition-colors">Ver um exemplo</a>
            <a href="#como" className="hover:text-tinta transition-colors">Como funciona</a>
            <a href="#planos" className="hover:text-tinta transition-colors">Planos</a>
            <a href="#faq" className="hover:text-tinta transition-colors">Dúvidas</a>
          </div>
          <div className="flex items-center gap-4">
            {/* Sem esse link, quem já tem conta cai na página de vendas pelo
                menu "Início" do app e fica sem porta de volta. */}
            <Link
              href={usuario ? DESTINO_PADRAO : urlDeLogin('/')}
              className="text-sm font-medium text-tinta-suave hover:text-tinta transition-colors"
            >
              {usuario ? 'Minha conta' : 'Entrar'}
            </Link>
            <Link
              href={destinoCorrecaoGratuita}
              className="cursor-pointer rounded-xl bg-tinta px-4 py-2.5 text-sm font-bold text-papel hover:brightness-110 transition"
            >
              Corrigir de graça
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — a promessa e a ação são a mesma coisa. */}
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div className="pointer-events-none absolute -right-40 -top-32 h-[500px] w-[600px] rounded-full bg-azul/15 blur-[100px]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-regua bg-folha px-3.5 py-1.5 text-[11px] font-extrabold tracking-widest text-azul">
              📝 CORRETOR DE REDAÇÃO ONLINE
            </span>

            <h1 className="mt-5 max-w-3xl text-[2.4rem] font-black leading-[1.05] tracking-tight sm:text-6xl">
              Sua redação tem desvios que você{' '}
              <span className="gradient-text">não está enxergando</span>
            </h1>

            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-tinta-suave">
              Envie sua redação agora e descubra em segundos quantos pontos de atenção ela tem, pelos
              critérios oficiais do ENEM. As {CORRECOES_GRATUITAS} primeiras são gratuitas e não
              pedimos cartão.
            </p>

            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href={destinoCorrecaoGratuita}
                className="cursor-pointer rounded-xl bg-azul px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_35px_rgba(79,140,255,0.25)] transition hover:brightness-110"
              >
                CORRIGIR MINHA REDAÇÃO DE GRAÇA →
              </Link>
              <a
                href="#exemplo"
                className="text-[13px] font-semibold text-tinta-suave underline decoration-regua underline-offset-4 transition hover:text-tinta"
              >
                Antes, ver um exemplo de correção
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-4 text-[13px] text-tinta-suave">
              <span>✓ Sem cartão</span>
              <span>✓ Resultado em segundos</span>
              <span>✓ Critérios oficiais do INEP</span>
            </div>
            <p className="mt-4 max-w-xl text-[12px] text-tinta-fraca">
              Sem promessa de nota garantida. O objetivo é transformar cada redação em aprendizado.
            </p>
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

        {/* A virada — a ponte entre o problema e a prova. */}
        <section className="border-y border-regua bg-folha-2/60 py-24 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <span className="text-[11px] font-black uppercase tracking-widest text-azul">A virada</span>
            <h2 className="mt-3 text-[1.75rem] font-black tracking-tight">Nota sem diagnóstico não ensina.</h2>
            <p className="mt-4 text-[15px] text-tinta-suave">
              Você precisa entender <strong className="text-tinta">onde perdeu pontos, por que perdeu e como melhorar.</strong>
            </p>
            <h2 className="mt-6 text-2xl font-black tracking-tight text-azul">É isso que o Nota 1000 entrega.</h2>
            <p className="mt-4 text-[14px] text-tinta-fraca">
              E você não precisa acreditar na nossa palavra — role e veja uma correção de verdade.
            </p>
          </div>
        </section>

        {/* A PROVA. É a seção que a página não tinha. */}
        <section id="exemplo" className="py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <span className="text-[11px] font-black uppercase tracking-widest text-azul">A prova</span>
              <h2 className="mx-auto mt-3 max-w-2xl text-[2rem] font-black leading-tight tracking-tight sm:text-4xl">
                É assim que a sua correção chega.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] text-tinta-suave">
                Não é um resumo nem uma nota solta. Cada desvio fica marcado no seu texto, com o
                motivo ao lado e o que fazer na próxima redação.
              </p>
            </div>

            <div className="mt-12">
              <ExemploCorrecao />
            </div>

            <div className="mt-8 text-center">
              <Link
                href={destinoCorrecaoGratuita}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-azul px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_35px_rgba(79,140,255,0.25)] transition hover:brightness-110"
              >
                <Sparkles className="h-4 w-4" />
                Quero ver isso na minha redação
              </Link>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como" className="border-y border-regua bg-folha-2/60 py-24">
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
        <section id="competencias" className="py-24">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-azul">As 5 competências</span>
            <h2 className="mx-auto mt-3 max-w-2xl text-[2rem] font-black leading-tight tracking-tight sm:text-4xl">
              Sua redação é avaliada por cinco competências.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] text-tinta-suave">
              Cada uma vale até 200 pontos. Saber qual delas está te segurando é o que decide onde
              vale a pena gastar seu tempo de estudo.
            </p>

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

        {/* A fronteira grátis/pago, declarada ANTES do preço. */}
        <FronteiraGratisPago destino={destinoCorrecaoGratuita} />

        {/* Planos */}
        <section id="planos" className="border-y border-regua bg-folha-2/60 py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <span className="text-[11px] font-black uppercase tracking-widest text-azul">Oferta</span>
              <h2 className="mx-auto mt-3 max-w-xl text-[2rem] font-black leading-tight tracking-tight sm:text-4xl">
                Depois das gratuitas, escolha como continuar.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[15px] text-tinta-suave">
                Correções ilimitadas em qualquer plano. Sem fidelidade e com garantia de sete dias.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <CartaoDePlano
                plano={PLANOS.mensal}
                destaque
                descricao="Para quem vai treinar redação toda semana até a prova."
                beneficios={[
                  'Correções ilimitadas',
                  'Nota nas 5 competências',
                  'Desvios marcados no seu texto',
                  'Versão reescrita e plano de ação',
                  'Renova sozinho, cancele quando quiser',
                ]}
                carregando={planoCarregando === 'mensal'}
                bloqueado={planoCarregando !== null}
                aoClicar={() => iniciarCheckout('mensal')}
              />
              <CartaoDePlano
                plano={PLANOS.unico}
                descricao="Para quem quer uma reta final concentrada, sem recorrência."
                beneficios={[
                  'Correções ilimitadas por 30 dias',
                  'Nota nas 5 competências',
                  'Desvios marcados no seu texto',
                  'Versão reescrita e plano de ação',
                  'Pagamento único, não renova',
                ]}
                carregando={planoCarregando === 'unico'}
                bloqueado={planoCarregando !== null}
                aoClicar={() => iniciarCheckout('unico')}
              />
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

            {/* Quem pagou com um e-mail diferente do cadastro não tem acesso
                liberado pelo webhook, e o caminho natural de quem está nessa
                situação é voltar para a página de preço achando que a compra
                não passou. Esta linha é a porta de saída antes de comprar de
                novo ou pedir reembolso. */}
            <p className="mt-5 text-center text-[13px] text-tinta-fraca">
              Já comprou e o acesso não liberou?{' '}
              <Link href="/vincular-compra" className="font-semibold text-azul hover:underline">
                Destrave sua compra aqui
              </Link>
              .
            </p>
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
                    aria-expanded={openFaq === idx}
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

        {/* CTA final — a MESMA ação do topo. A página começa e termina com a
            mesma promessa, que é o que faz ela fechar. */}
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
              Envie a redação que você escreveu essa semana e descubra quantos desvios ela tem. Se o
              diagnóstico te ajudar, aí sim a gente conversa sobre plano.
            </p>
            <Link
              href={destinoCorrecaoGratuita}
              className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-azul px-8 py-3.5 text-sm font-bold text-white shadow-[0_12px_35px_rgba(79,140,255,0.25)] transition hover:brightness-110"
            >
              CORRIGIR MINHA REDAÇÃO DE GRAÇA →
            </Link>
            <p className="mt-4 text-[12px] text-tinta-fraca">
              {CORRECOES_GRATUITAS} correções gratuitas · sem cartão · leva menos de um minuto
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-regua py-10">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-6 text-[12px] text-tinta-fraca sm:flex-row">
          <span className="font-bold text-tinta-suave">Nota 1000 · Avaliador de redação do ENEM</span>
          {/* `flex-wrap` porque no celular os dois itens não cabem lado a
              lado e o rodapé estourava a largura. */}
          <div className="flex flex-wrap items-center gap-4">
            <span>suporte@avaliadornota1000.com</span>
            <Link href="/privacidade" className="hover:text-tinta-suave transition-colors">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Diz exatamente o que a pessoa leva sem pagar e o que fica com o plano.
 *
 * Vem ANTES da tabela de preço de propósito. Omitir essa fronteira até
 * depois do pagamento é o que gera a sensação de ter sido enganado — e
 * reembolso, chargeback e reclamação custam mais caro do que a venda que a
 * omissão traria.
 */
function FronteiraGratisPago({ destino }: { destino: string }) {
  return (
    <section className="border-y border-regua bg-folha-2/60 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <span className="text-[11px] font-black uppercase tracking-widest text-azul">Sem letra miúda</span>
          <h2 className="mx-auto mt-3 max-w-2xl text-[2rem] font-black leading-tight tracking-tight sm:text-4xl">
            O que é grátis e o que é pago.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-regua bg-folha p-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-verde-claro px-3 py-1 text-[11px] font-black uppercase tracking-wider text-verde">
              Grátis
            </span>
            <h3 className="mt-4 text-lg font-bold">Suas {CORRECOES_GRATUITAS} primeiras redações</h3>
            <ul className="mt-4 space-y-2.5 text-[13px] text-tinta-suave">
              {[
                'Sua redação corrigida pelos critérios do INEP',
                'Quantos desvios o texto tem',
                'Se a redação seria anulada, e o alerta na hora',
                'Sem pedir cartão de crédito',
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-verde" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href={destino}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-regua bg-folha-2 px-5 py-3 text-[13px] font-bold text-tinta transition hover:border-azul"
            >
              Começar de graça
            </Link>
          </div>

          <div className="rounded-2xl border border-azul/40 bg-folha p-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-azul-claro px-3 py-1 text-[11px] font-black uppercase tracking-wider text-azul">
              <Lock className="h-3 w-3" />
              Com plano
            </span>
            <h3 className="mt-4 text-lg font-bold">O diagnóstico completo</h3>
            <ul className="mt-4 space-y-2.5 text-[13px] text-tinta-suave">
              {[
                'A nota de cada uma das 5 competências',
                'Cada desvio marcado no seu texto, com o motivo',
                'Versão reescrita do seu texto',
                'Plano de ação para a próxima redação',
                'Gráfico de evolução entre as suas redações',
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-azul" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="#planos"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-azul px-5 py-3 text-[13px] font-bold text-white transition hover:brightness-110"
            >
              Ver os planos
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function CartaoDePlano({
  plano,
  descricao,
  beneficios,
  destaque = false,
  carregando,
  bloqueado,
  aoClicar,
}: {
  plano: (typeof PLANOS)[PlanoId];
  descricao: string;
  beneficios: string[];
  destaque?: boolean;
  carregando: boolean;
  bloqueado: boolean;
  aoClicar: () => void;
}) {
  return (
    <div
      className={`price relative flex flex-col justify-between rounded-2xl bg-folha p-7 ${
        destaque
          ? 'border-2 border-azul shadow-[0_0_0_1px_rgba(79,140,255,0.15),0_25px_60px_rgba(0,0,0,0.25)]'
          : 'border border-regua'
      }`}
    >
      {destaque && (
        <span className="absolute right-5 top-5 rounded-full bg-azul-claro px-2.5 py-1 text-[10px] font-black text-azul">
          MAIS ESCOLHIDO
        </span>
      )}

      <div>
        <h3 className="text-lg font-bold">{plano.nome}</h3>
        <p className="mt-1 text-[13px] text-tinta-fraca">{descricao}</p>

        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="text-[15px] font-bold text-tinta-fraca">R$</span>
          <span className="text-5xl font-black tabular-nums tracking-tight">{plano.precoReais}</span>
          <span className="text-[13px] text-tinta-fraca">
            {plano.recorrente ? '/mês' : `· ${plano.diasDeAcesso} dias`}
          </span>
        </div>

        <ul className="mt-6 space-y-2.5 text-[13px] text-tinta-suave">
          {beneficios.map((b) => (
            <li key={b} className="flex gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-azul" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={aoClicar}
        disabled={bloqueado}
        className={`mt-7 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          destaque
            ? 'bg-azul text-white shadow-[0_12px_35px_rgba(79,140,255,0.25)] hover:brightness-110'
            : 'border border-regua bg-folha-2 text-tinta hover:border-azul'
        }`}
      >
        {carregando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span>Assinar {plano.nome}</span>
        )}
      </button>
    </div>
  );
}

/**
 * Manda ao servidor os identificadores de atribuição do Meta (`_fbc`/`_fbp`)
 * antes de a pessoa sair para a Kiwify.
 *
 * Este é o último instante em que esses cookies existem para nós: o checkout
 * roda em outro domínio e o webhook de pagamento só recebe e-mail e id do
 * pedido. Sem guardar aqui, a venda chega ao Meta sem saber de qual anúncio
 * veio, e o custo por aquisição da campanha fica errado.
 *
 * Falha nunca bloqueia o checkout — perder a atribuição é ruim, perder a
 * venda é pior.
 */
async function guardarAtribuicao(): Promise<void> {
  try {
    const { fbc, fbp } = lerAtribuicao();
    if (!fbc && !fbp) return;

    const { data: sessao } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
    const token = sessao.session?.access_token;
    if (!token) return;

    await fetch('/api/atribuicao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fbc, fbp }),
    });
  } catch (erro) {
    console.warn('Não foi possível guardar a atribuição antes do checkout:', erro);
  }
}
