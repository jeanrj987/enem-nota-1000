'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { PlanoId } from '@/lib/planos';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const BENEFICIOS = [
  {
    titulo: 'Correção em menos de 10 segundos',
    texto:
      'Envie sua redação e receba o diagnóstico completo na hora. Isso permite corrigir o texto e produzir uma nova versão no mesmo dia, enquanto o tema ainda está fresco.',
  },
  {
    titulo: 'Critérios oficiais do INEP, de C1 a C5',
    texto:
      'Nota de 0 a 200 pontos em cada uma das cinco competências, com a justificativa de cada faixa — você vê exatamente onde ganha e onde perde ponto.',
  },
  {
    titulo: 'Marcação de erros linha por linha',
    texto:
      'Cada desvio de concordância, pontuação, regência ou conectivo é destacado no seu texto com a regra que o explica e a reescrita sugerida no lugar.',
  },
  {
    titulo: 'Auditoria completa da Competência 5',
    texto:
      'Checagem dos cinco elementos da proposta de intervenção — agente, ação, meio, efeito e detalhamento — que é onde a maioria dos candidatos perde os 200 pontos.',
  },
  {
    titulo: 'Versão reescrita no padrão nota 1000',
    texto:
      'O sistema reconstrói os seus próprios argumentos em um modelo de nota máxima, mostrando na prática como articular repertório e coesão no tema que você escolheu.',
  },
];

const PASSOS = [
  {
    titulo: 'Crie sua conta',
    texto: 'Cadastro com e-mail e senha ou direto pela sua conta Google.',
  },
  {
    titulo: 'Escreva ou envie sua redação',
    texto: 'Digite no editor ou importe um arquivo em PDF, Word ou texto simples.',
  },
  {
    titulo: 'Receba a correção',
    texto: 'Nota, competências e erros marcados aparecem em menos de dez segundos.',
  },
  {
    titulo: 'Assine para ver tudo',
    texto: 'O relatório completo, a reescrita e o plano de ação são liberados com o plano.',
  },
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
    a: 'Você pode escrever diretamente no editor da plataforma ou importar arquivos nos formatos PDF, Word (.docx) ou bloco de notas (.txt). Fotos de redação manuscrita em PDF também são lidas.',
  },
];

export default function PaginaDeVendas() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [planoCarregando, setPlanoCarregando] = useState<PlanoId | null>(null);
  const [erroCheckout, setErroCheckout] = useState<string | null>(null);

  const scrollToPricing = () => {
    document.getElementById('oferta')?.scrollIntoView({ behavior: 'smooth' });
  };

  const iniciarCheckout = async (planoId: PlanoId) => {
    setErroCheckout(null);

    if (!usuario) {
      router.push('/auth?redirect=/vendas');
      return;
    }

    setPlanoCarregando(planoId);
    try {
      const { data: sessionData } = await supabase!.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        router.push('/auth?redirect=/vendas');
        return;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planoId }),
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
    <div className="fonte-humanista min-h-screen bg-papel text-tinta">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-40 border-b border-regua bg-papel/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-baseline gap-2">
            <span className="fonte-serifada text-lg font-semibold tracking-tight">Nota 1000</span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-tinta-fraca">
              Avaliador de redação
            </span>
          </div>
          <button
            onClick={scrollToPricing}
            className="cursor-pointer border-b border-vermelho pb-0.5 text-sm font-semibold text-vermelho transition-colors hover:text-vermelho-escuro"
          >
            Ver planos
          </button>
        </div>
      </header>

      <main>
        {/* Hero — a própria manchete é uma correção */}
        <section className="border-b border-regua">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
            <p className="mb-6 text-[11px] uppercase tracking-[0.2em] text-tinta-fraca">
              Matriz oficial do INEP · Competências 1 a 5
            </p>

            <h1 className="fonte-serifada max-w-3xl text-[2.1rem] font-semibold leading-[1.12] tracking-tight text-balance sm:text-[3.25rem]">
              Sua redação corrigida{' '}
              <span className="relative whitespace-nowrap">
                <span className="risco-corretor">em duas semanas</span>
              </span>{' '}
              <span className="fonte-manuscrita text-vermelho">hoje mesmo</span>, com a nota de cada
              competência e os erros marcados no texto.
            </h1>

            <p className="mt-7 max-w-2xl text-[15px] leading-[1.75] text-tinta-suave">
              Escreva, envie e receba em segundos o mesmo tipo de diagnóstico que um corretor
              experiente faria à mão: nota de 0 a 200 em C1, C2, C3, C4 e C5, cada desvio apontado no
              lugar onde acontece e uma versão reescrita do seu próprio argumento no padrão nota
              1000.
            </p>

            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <button
                onClick={scrollToPricing}
                className="cursor-pointer bg-vermelho px-7 py-3.5 text-sm font-bold text-folha transition-colors hover:bg-vermelho-escuro"
              >
                Ver planos de acesso
              </button>
              <span className="text-[13px] text-tinta-fraca">
                Garantia de 7 dias · Liberação imediata
              </span>
            </div>
          </div>
        </section>

        {/* Problema */}
        <section className="border-b border-regua bg-folha">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
              <h2 className="fonte-serifada text-2xl font-semibold leading-snug tracking-tight text-balance sm:text-3xl">
                O gargalo silencioso na preparação da redação
              </h2>

              <div className="margem-caderno space-y-5 pl-6 text-[15px] leading-[1.75] text-tinta-suave">
                <p>
                  Praticar com frequência é o único caminho para uma nota competitiva. O modelo
                  tradicional de correção, porém, cria uma barreira que trava exatamente isso.
                </p>
                <p>
                  Na maioria dos cursinhos, o estudante entrega o texto e espera de dez a vinte dias.
                  Quando a folha volta, a linha de raciocínio daquele tema já foi esquecida, e os
                  comentários costumam ser vagos:{' '}
                  <span className="fonte-manuscrita text-vermelho">
                    &ldquo;melhore a coesão&rdquo;
                  </span>
                  ,{' '}
                  <span className="fonte-manuscrita text-vermelho">
                    &ldquo;repertório insuficiente&rdquo;
                  </span>{' '}
                  — sem indicar como reescrever.
                </p>
                <p>
                  Sem retorno imediato sobre cada uma das cinco competências, o candidato repete os
                  mesmos desvios de norma culta e as mesmas falhas na proposta de intervenção durante
                  meses, sem perceber.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Exemplo real de correção — a prova de valor */}
        <section className="border-b border-regua">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-tinta-fraca">
              Exemplo de diagnóstico
            </p>
            <h2 className="fonte-serifada mb-9 max-w-2xl text-2xl font-semibold leading-snug tracking-tight text-balance sm:text-3xl">
              É assim que o seu texto volta corrigido
            </h2>

            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
              {/* Folha do aluno com marcações */}
              <div className="border border-regua bg-folha p-6 sm:p-8 shadow-[0_1px_0_rgba(28,25,23,0.06)]">
                <div className="bloco-pautado text-[15px] text-azul">
                  Nesse contexto, é evidente que{' '}
                  <span className="risco-corretor">os estudantes tem acesso</span>{' '}
                  <span className="fonte-manuscrita text-vermelho">têm</span> desigual à
                  informação de qualidade, o que aprofunda a distância entre as escolas públicas e
                  particulares do país.
                </div>

                <div className="mt-6 border-t border-regua pt-5">
                  <p className="mb-1.5 text-[11px] uppercase tracking-[0.16em] text-vermelho">
                    Competência 1 · Norma culta
                  </p>
                  <p className="text-[13px] leading-relaxed text-tinta-suave">
                    O verbo &ldquo;ter&rdquo; na terceira pessoa do plural exige acento circunflexo
                    diferencial obrigatório: <strong className="text-tinta">têm</strong>.
                  </p>
                </div>
              </div>

              {/* Placar de competências */}
              <div className="border border-regua bg-folha p-6 sm:p-8">
                <p className="mb-5 text-[11px] uppercase tracking-[0.16em] text-tinta-fraca">
                  Notas por competência
                </p>
                <ul className="space-y-3.5">
                  {[
                    ['C1', 'Norma culta', 160],
                    ['C2', 'Tema e repertório', 200],
                    ['C3', 'Argumentação', 160],
                    ['C4', 'Coesão', 200],
                    ['C5', 'Intervenção', 200],
                  ].map(([sigla, nome, nota]) => (
                    <li key={sigla as string} className="flex items-baseline gap-3">
                      <span className="fonte-serifada w-7 shrink-0 text-sm font-semibold text-tinta">
                        {sigla}
                      </span>
                      <span className="flex-1 text-[13px] text-tinta-suave">{nome}</span>
                      <span className="text-sm font-semibold tabular-nums text-tinta">
                        {nota}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-baseline justify-between border-t border-regua pt-5">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-tinta-fraca">
                    Nota final
                  </span>
                  <span className="fonte-serifada text-3xl font-semibold tabular-nums text-vermelho">
                    920
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios como rubrica numerada */}
        <section className="border-b border-regua bg-folha">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <h2 className="fonte-serifada mb-10 max-w-2xl text-2xl font-semibold leading-snug tracking-tight text-balance sm:text-3xl">
              Um corretor rigoroso, disponível a qualquer hora
            </h2>

            <ul className="divide-y divide-regua border-y border-regua">
              {BENEFICIOS.map((item) => (
                <li key={item.titulo} className="grid gap-2 py-6 md:grid-cols-[1fr_1.6fr] md:gap-10">
                  <h3 className="fonte-serifada text-lg font-semibold leading-snug text-tinta">
                    {item.titulo}
                  </h3>
                  <p className="text-[15px] leading-[1.75] text-tinta-suave">{item.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Como funciona — sequência real, por isso numerada */}
        <section className="border-b border-regua">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <h2 className="fonte-serifada mb-10 text-2xl font-semibold tracking-tight sm:text-3xl">
              Como funciona
            </h2>

            <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {PASSOS.map((passo, i) => (
                <li key={passo.titulo} className="margem-caderno pl-5">
                  <span className="fonte-serifada block text-sm font-semibold text-vermelho">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="fonte-serifada mt-1.5 text-base font-semibold leading-snug text-tinta">
                    {passo.titulo}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-tinta-suave">{passo.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Planos */}
        <section id="oferta" className="border-b border-regua bg-folha">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <h2 className="fonte-serifada text-2xl font-semibold tracking-tight sm:text-3xl">
              Planos de acesso
            </h2>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-tinta-suave">
              Correções ilimitadas em qualquer plano. Sem fidelidade e com garantia de sete dias.
            </p>

            {erroCheckout && (
              <p className="mt-5 border border-vermelho bg-vermelho-claro px-4 py-2.5 text-[13px] text-vermelho-escuro">
                {erroCheckout}
              </p>
            )}

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {/* Mensal */}
              <div className="flex flex-col justify-between border border-regua bg-papel p-7">
                <div>
                  <h3 className="fonte-serifada text-lg font-semibold">Mensal</h3>
                  <p className="mt-1 text-[13px] text-tinta-fraca">Para testar no seu ritmo.</p>
                  <p className="fonte-serifada mt-5 text-3xl font-semibold tabular-nums">
                    R$ 29,90
                  </p>
                  <p className="text-[12px] text-tinta-fraca">por mês</p>

                  <ul className="mt-6 space-y-2.5 border-t border-regua pt-5 text-[13px] text-tinta-suave">
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vermelho" />
                      Correções ilimitadas no mês
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vermelho" />
                      Avaliação pelas cinco competências
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vermelho" />
                      Marcação de erros no texto
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => iniciarCheckout('mensal')}
                  disabled={planoCarregando !== null}
                  className="mt-7 flex cursor-pointer items-center justify-center border border-tinta px-5 py-3 text-[13px] font-bold text-tinta transition-colors hover:bg-tinta hover:text-folha disabled:opacity-50"
                >
                  {planoCarregando === 'mensal' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Assinar mensal'
                  )}
                </button>
              </div>

              {/* Anual — destaque */}
              <div className="relative flex flex-col justify-between border-2 border-vermelho bg-papel p-7">
                <span className="fonte-manuscrita absolute -top-3.5 left-6 bg-papel px-2 text-base text-vermelho">
                  o mais escolhido
                </span>
                <div>
                  <h3 className="fonte-serifada text-lg font-semibold">Anual</h3>
                  <p className="mt-1 text-[13px] text-tinta-fraca">Acesso até a prova.</p>
                  <p className="fonte-serifada mt-5 text-3xl font-semibold tabular-nums">
                    R$ 147,00
                  </p>
                  <p className="text-[12px] text-tinta-fraca">ou 12x de R$ 14,90</p>

                  <ul className="mt-6 space-y-2.5 border-t border-regua pt-5 text-[13px] text-tinta-suave">
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vermelho" />
                      Tudo do plano mensal
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vermelho" />
                      Versão reescrita nota 1000
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vermelho" />
                      Auditoria completa da C5
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vermelho" />
                      Exportação do relatório em PDF
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => iniciarCheckout('anual')}
                  disabled={planoCarregando !== null}
                  className="mt-7 flex cursor-pointer items-center justify-center bg-vermelho px-5 py-3.5 text-[13px] font-bold text-folha transition-colors hover:bg-vermelho-escuro disabled:opacity-50"
                >
                  {planoCarregando === 'anual' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Garantir acesso até o ENEM'
                  )}
                </button>
              </div>

              {/* Semestral */}
              <div className="flex flex-col justify-between border border-regua bg-papel p-7">
                <div>
                  <h3 className="fonte-serifada text-lg font-semibold">Semestral</h3>
                  <p className="mt-1 text-[13px] text-tinta-fraca">Para a reta de preparação.</p>
                  <p className="fonte-serifada mt-5 text-3xl font-semibold tabular-nums">
                    R$ 89,00
                  </p>
                  <p className="text-[12px] text-tinta-fraca">pagamento único, seis meses</p>

                  <ul className="mt-6 space-y-2.5 border-t border-regua pt-5 text-[13px] text-tinta-suave">
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vermelho" />
                      Correções ilimitadas por seis meses
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vermelho" />
                      Versão reescrita nota 1000
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vermelho" />
                      Matriz das cinco competências
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => iniciarCheckout('semestral')}
                  disabled={planoCarregando !== null}
                  className="mt-7 flex cursor-pointer items-center justify-center border border-tinta px-5 py-3 text-[13px] font-bold text-tinta transition-colors hover:bg-tinta hover:text-folha disabled:opacity-50"
                >
                  {planoCarregando === 'semestral' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Assinar semestral'
                  )}
                </button>
              </div>
            </div>

            {/* Garantia como carimbo */}
            <div className="mt-12 flex flex-col items-start gap-6 border-t border-regua pt-10 sm:flex-row sm:items-center">
              <div className="carimbo shrink-0 px-5 py-3 text-center">
                <span className="block text-[10px] uppercase tracking-[0.18em]">Garantia</span>
                <span className="fonte-serifada block text-xl font-bold leading-tight">7 dias</span>
              </div>
              <p className="max-w-xl text-[14px] leading-relaxed text-tinta-suave">
                Use o avaliador, envie suas redações e analise a qualidade dos diagnósticos. Se não
                for útil para os seus estudos, peça o reembolso em até sete dias e receba o valor
                integral de volta, sem justificativa.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-regua">
          <div className="mx-auto max-w-3xl px-5 py-16">
            <h2 className="fonte-serifada mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">
              Perguntas frequentes
            </h2>

            <div className="divide-y divide-regua border-y border-regua">
              {FAQ.map((item, idx) => (
                <div key={item.q}>
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left"
                  >
                    <span className="fonte-serifada text-[15px] font-semibold text-tinta">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-tinta-fraca transition-transform ${
                        openFaq === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <p className="pb-5 pr-10 text-[14px] leading-[1.75] text-tinta-suave">{item.a}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <button
                onClick={scrollToPricing}
                className="cursor-pointer bg-vermelho px-8 py-3.5 text-sm font-bold text-folha transition-colors hover:bg-vermelho-escuro"
              >
                Ver planos de acesso
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-col justify-between gap-3 text-[12px] text-tinta-fraca sm:flex-row">
          <span className="fonte-serifada text-tinta-suave">
            Nota 1000 · Avaliador de redação do ENEM
          </span>
          <span>suporte@avaliadornota1000.com</span>
        </div>
      </footer>
    </div>
  );
}
