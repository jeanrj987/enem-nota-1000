'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, ChevronDown, Loader2 } from 'lucide-react';
import { PlanoId } from '@/lib/planos';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/** Faixas usadas no painel de competências do topo. São ilustrativas: mostram
 * como o sistema pontua cada competência, não o resultado de nenhum aluno
 * real — a página deixa isso explícito em vez de sugerir um caso verídico. */
const COMPETENCIAS = [
  { sigla: 'C1', nome: 'Norma culta', antes: 120, depois: 200 },
  { sigla: 'C2', nome: 'Tema e repertório', antes: 120, depois: 200 },
  { sigla: 'C3', nome: 'Argumentação', antes: 100, depois: 160 },
  { sigla: 'C4', nome: 'Coesão', antes: 120, depois: 200 },
  { sigla: 'C5', nome: 'Proposta de intervenção', antes: 80, depois: 160 },
];

const ENTREGAS = [
  {
    numero: '01',
    titulo: 'Nota em cada competência, não um "está bom"',
    texto:
      'De 0 a 200 pontos em C1, C2, C3, C4 e C5, com a justificativa de cada faixa. Você sabe exatamente onde perdeu ponto e quantos.',
  },
  {
    numero: '02',
    titulo: 'Cada erro marcado onde ele acontece',
    texto:
      'Concordância, regência, pontuação, conectivo repetido — tudo destacado no seu texto, com a regra que explica e a reescrita no lugar.',
  },
  {
    numero: '03',
    titulo: 'A Competência 5 auditada elemento por elemento',
    texto:
      'Agente, ação, meio, efeito e detalhamento. É onde a maioria perde 40 a 80 pontos sem perceber que faltou um deles.',
  },
  {
    numero: '04',
    titulo: 'A sua redação reescrita em padrão nota 1000',
    texto:
      'O sistema pega os seus argumentos e mostra como eles ficariam num texto de nota máxima. Você compara lado a lado.',
  },
  {
    numero: '05',
    titulo: 'Resultado em menos de 10 segundos',
    texto:
      'Dá tempo de corrigir e reescrever no mesmo dia, com o tema ainda fresco na cabeça. É isso que faz a nota subir.',
  },
];

const FAQ = [
  {
    q: 'A avaliação segue os critérios reais do ENEM?',
    a: 'Sim. A avaliação é orientada pela matriz oficial do INEP, atribuindo de 0 a 200 pontos em cada uma das cinco competências e verificando a presença dos cinco elementos da proposta de intervenção.',
  },
  {
    q: 'Quanto tempo leva para a redação ser corrigida?',
    a: 'Menos de dez segundos após o envio. Notas, marcações de erro e sugestões aparecem prontas na tela.',
  },
  {
    q: 'Preciso pagar para testar?',
    a: 'Não. Você cria a conta, escreve ou envia sua redação e ela é corrigida de verdade. O relatório completo — nota detalhada, erros marcados, reescrita e plano de ação — é o que fica liberado com o plano.',
  },
  {
    q: 'Posso enviar arquivo ou só digitando?',
    a: 'Os dois. Editor da plataforma ou upload em PDF, Word (.docx) e texto simples. Foto de redação manuscrita em PDF também é lida.',
  },
  {
    q: 'Como recebo o acesso depois de pagar?',
    a: 'Na hora, na sua própria conta. Não precisa esperar e-mail nem digitar código: assim que o pagamento é confirmado, o relatório completo destrava.',
  },
];

export default function PaginaDeVendas() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [planoCarregando, setPlanoCarregando] = useState<PlanoId | null>(null);
  const [erroCheckout, setErroCheckout] = useState<string | null>(null);

  const irParaPlanos = () => {
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
    <div className="tema-placar fonte-ui min-h-screen bg-[#0b1b2b] text-[#f2f7fb]">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-40 border-b border-[#23415e] bg-[#0b1b2b]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="fonte-placar text-xl uppercase tracking-wide">
            Nota <span className="text-[#c6f24e]">1000</span>
          </span>
          <button
            onClick={irParaPlanos}
            className="cursor-pointer bg-[#c6f24e] px-5 py-2 text-[13px] font-bold uppercase tracking-wide text-[#0b1b2b] transition-colors hover:bg-[#a5ce35]"
          >
            Ver planos
          </button>
        </div>
      </header>

      <main>
        {/* HERO — o placar é a manchete */}
        <section className="border-b border-[#23415e]">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
            <p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#93a8bc]">
              Avaliador de redação · Matriz oficial do INEP
            </p>

            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
              {/* Lado esquerdo: o placar */}
              <div>
                <div className="flex items-end gap-5 sm:gap-8">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#93a8bc]">
                      Sua nota hoje
                    </span>
                    <span className="fonte-placar block text-[68px] leading-[0.85] text-[#4a6178] tabular-nums sm:text-[92px]">
                      540
                    </span>
                  </div>

                  <ArrowRight className="mb-4 h-8 w-8 shrink-0 text-[#4a6178]" strokeWidth={2.5} />

                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#c6f24e]">
                      Sua nota treinada
                    </span>
                    <span className="fonte-placar block text-[68px] leading-[0.85] text-[#c6f24e] tabular-nums sm:text-[92px]">
                      920
                    </span>
                  </div>
                </div>

                <h1 className="fonte-placar mt-10 max-w-xl text-[34px] uppercase leading-[1.05] text-balance sm:text-[46px]">
                  A diferença entre essas duas notas é{' '}
                  <span className="text-[#c6f24e]">saber onde você perde ponto</span>
                </h1>

                <p className="mt-6 max-w-lg text-[15px] leading-[1.7] text-[#93a8bc]">
                  No cursinho você descobre isso em duas semanas, num bilhete vago na margem da
                  folha. Aqui, em dez segundos, competência por competência, com cada erro marcado
                  no lugar exato e a sua redação reescrita em padrão nota 1000.
                </p>

                <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <button
                    onClick={irParaPlanos}
                    className="flex cursor-pointer items-center gap-2 bg-[#c6f24e] px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#0b1b2b] transition-colors hover:bg-[#a5ce35]"
                  >
                    Começar agora
                    <ArrowRight className="h-4 w-4" strokeWidth={3} />
                  </button>
                  <span className="text-[13px] text-[#93a8bc]">
                    Corrija de graça · Garantia de 7 dias
                  </span>
                </div>
              </div>

              {/* Lado direito: painel de competências */}
              <div className="border border-[#23415e] bg-[#0f2438] p-6 sm:p-7">
                <div className="mb-6 flex items-baseline justify-between border-b border-[#23415e] pb-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#93a8bc]">
                    Onde os pontos aparecem
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#c6f24e]">
                    /200 cada
                  </span>
                </div>

                <ul className="space-y-5">
                  {COMPETENCIAS.map((c) => (
                    <li key={c.sigla}>
                      <div className="mb-2 flex items-baseline justify-between gap-3">
                        <span className="text-[13px] font-semibold text-[#f2f7fb]">
                          <span className="fonte-placar mr-2 text-[#93a8bc]">{c.sigla}</span>
                          {c.nome}
                        </span>
                        <span className="shrink-0 text-[13px] font-bold tabular-nums">
                          <span className="text-[#4a6178]">{c.antes}</span>
                          <span className="mx-1.5 text-[#4a6178]">→</span>
                          <span className="text-[#c6f24e]">{c.depois}</span>
                        </span>
                      </div>
                      <div className="barra-comp">
                        <span style={{ width: `${(c.depois / 200) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>

                <p className="mt-6 border-t border-[#23415e] pt-4 text-[11px] leading-relaxed text-[#93a8bc]">
                  Faixas ilustrativas para mostrar como o sistema pontua cada competência. Não são o
                  resultado de um aluno específico.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contraste de volume de treino */}
        <section className="border-b border-[#23415e] bg-[#0f2438]">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <div className="grid gap-10 md:grid-cols-[1fr_1.3fr] md:items-center">
              <div className="flex items-end gap-10">
                <div>
                  <span className="fonte-placar block text-[56px] leading-none text-[#4a6178] tabular-nums">
                    3
                  </span>
                  <span className="mt-1 block text-[12px] font-semibold uppercase tracking-wide text-[#93a8bc]">
                    correções por
                    <br />
                    semestre no cursinho
                  </span>
                </div>
                <div>
                  <span className="fonte-placar block text-[56px] leading-none text-[#c6f24e] tabular-nums">
                    ∞
                  </span>
                  <span className="mt-1 block text-[12px] font-semibold uppercase tracking-wide text-[#93a8bc]">
                    correções
                    <br />
                    aqui
                  </span>
                </div>
              </div>

              <div>
                <h2 className="fonte-placar text-[26px] uppercase leading-tight text-balance sm:text-[32px]">
                  Redação não melhora lendo teoria. Melhora escrevendo e sendo corrigido.
                </h2>
                <p className="mt-4 max-w-xl text-[15px] leading-[1.7] text-[#93a8bc]">
                  O limite nunca foi a sua vontade de treinar — é a fila de correção. Enquanto o
                  retorno demora dez, quinze dias, você repete o mesmo desvio de norma culta e a
                  mesma proposta de intervenção incompleta por meses, sem ninguém apontar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Demonstração da correção */}
        <section className="border-b border-[#23415e]">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="fonte-placar mb-8 text-[26px] uppercase sm:text-[32px]">
              É assim que o erro aparece
            </h2>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="border border-[#23415e] bg-[#0f2438] p-6 sm:p-7">
                <span className="mb-4 block text-[11px] font-bold uppercase tracking-[0.16em] text-[#93a8bc]">
                  No seu texto
                </span>
                <p className="text-[15px] leading-[1.9] text-[#f2f7fb]">
                  Nesse contexto, é evidente que{' '}
                  <span className="bg-[#c6f24e]/15 px-1 pb-0.5 [border-bottom:2px_solid_#c6f24e]">
                    os estudantes tem acesso
                  </span>{' '}
                  desigual à informação de qualidade.
                </p>
              </div>

              <div className="border border-[#23415e] bg-[#0f2438] p-6 sm:p-7">
                <span className="mb-4 block text-[11px] font-bold uppercase tracking-[0.16em] text-[#c6f24e]">
                  Competência 1 · −40 pontos
                </span>
                <p className="text-[15px] leading-relaxed text-[#93a8bc]">
                  &ldquo;Ter&rdquo; na terceira pessoa do plural exige acento circunflexo
                  diferencial:{' '}
                  <strong className="font-bold text-[#f2f7fb]">os estudantes têm acesso</strong>. É o
                  tipo de desvio que derruba a C1 de 200 para 160 sem você notar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* O que você recebe */}
        <section className="border-b border-[#23415e] bg-[#0f2438]">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="fonte-placar mb-10 text-[26px] uppercase sm:text-[32px]">
              O que vem em cada correção
            </h2>

            <ul className="divide-y divide-[#23415e] border-y border-[#23415e]">
              {ENTREGAS.map((item) => (
                <li key={item.numero} className="grid gap-3 py-6 md:grid-cols-[auto_1fr_1.5fr] md:gap-8">
                  <span className="fonte-placar text-[22px] leading-none text-[#c6f24e] tabular-nums">
                    {item.numero}
                  </span>
                  <h3 className="text-[16px] font-bold leading-snug text-[#f2f7fb]">
                    {item.titulo}
                  </h3>
                  <p className="text-[14px] leading-[1.7] text-[#93a8bc]">{item.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Planos */}
        <section id="oferta" className="border-b border-[#23415e]">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="fonte-placar text-[26px] uppercase sm:text-[32px]">Escolha seu plano</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#93a8bc]">
              Correções ilimitadas em todos os planos. Sem fidelidade, com sete dias de garantia
              incondicional.
            </p>

            {erroCheckout && (
              <p className="mt-5 border-l-4 border-[#c6f24e] bg-[#0f2438] px-4 py-3 text-[13px] text-[#f2f7fb]">
                {erroCheckout}
              </p>
            )}

            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {/* Mensal */}
              <div className="flex flex-col justify-between border border-[#23415e] bg-[#0f2438] p-7">
                <div>
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#93a8bc]">
                    Mensal
                  </h3>
                  <p className="fonte-placar mt-4 text-[42px] leading-none tabular-nums">
                    R$ 29
                    <span className="text-[24px] text-[#93a8bc]">,90</span>
                  </p>
                  <p className="mt-1.5 text-[12px] text-[#93a8bc]">por mês · cancele quando quiser</p>

                  <ul className="mt-6 space-y-3 border-t border-[#23415e] pt-5 text-[13px] text-[#93a8bc]">
                    <li className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c6f24e]" strokeWidth={3} />
                      Correções ilimitadas no mês
                    </li>
                    <li className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c6f24e]" strokeWidth={3} />
                      Nota nas cinco competências
                    </li>
                    <li className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c6f24e]" strokeWidth={3} />
                      Erros marcados no texto
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => iniciarCheckout('mensal')}
                  disabled={planoCarregando !== null}
                  className="mt-7 flex cursor-pointer items-center justify-center border-2 border-[#23415e] py-3 text-[13px] font-bold uppercase tracking-wide text-[#f2f7fb] transition-colors hover:border-[#c6f24e] hover:text-[#c6f24e] disabled:opacity-50"
                >
                  {planoCarregando === 'mensal' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Assinar mensal'
                  )}
                </button>
              </div>

              {/* Anual — destaque */}
              <div className="relative flex flex-col justify-between border-2 border-[#c6f24e] bg-[#0f2438] p-7">
                <span className="absolute -top-3 left-6 bg-[#c6f24e] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0b1b2b]">
                  Melhor custo
                </span>
                <div>
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#c6f24e]">
                    Anual · até o ENEM
                  </h3>
                  <p className="fonte-placar mt-4 text-[42px] leading-none tabular-nums">
                    R$ 147
                    <span className="text-[24px] text-[#93a8bc]">,00</span>
                  </p>
                  <p className="mt-1.5 text-[12px] text-[#93a8bc]">ou 12x de R$ 14,90</p>

                  <ul className="mt-6 space-y-3 border-t border-[#23415e] pt-5 text-[13px] text-[#93a8bc]">
                    <li className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c6f24e]" strokeWidth={3} />
                      Tudo do plano mensal
                    </li>
                    <li className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c6f24e]" strokeWidth={3} />
                      Reescrita nota 1000 em todas
                    </li>
                    <li className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c6f24e]" strokeWidth={3} />
                      Auditoria completa da C5
                    </li>
                    <li className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c6f24e]" strokeWidth={3} />
                      Relatório exportável em PDF
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => iniciarCheckout('anual')}
                  disabled={planoCarregando !== null}
                  className="mt-7 flex cursor-pointer items-center justify-center gap-2 bg-[#c6f24e] py-4 text-[13px] font-bold uppercase tracking-wide text-[#0b1b2b] transition-colors hover:bg-[#a5ce35] disabled:opacity-50"
                >
                  {planoCarregando === 'anual' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Garantir acesso
                      <ArrowRight className="h-4 w-4" strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>

              {/* Semestral */}
              <div className="flex flex-col justify-between border border-[#23415e] bg-[#0f2438] p-7">
                <div>
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#93a8bc]">
                    Semestral
                  </h3>
                  <p className="fonte-placar mt-4 text-[42px] leading-none tabular-nums">
                    R$ 89
                    <span className="text-[24px] text-[#93a8bc]">,00</span>
                  </p>
                  <p className="mt-1.5 text-[12px] text-[#93a8bc]">pagamento único · seis meses</p>

                  <ul className="mt-6 space-y-3 border-t border-[#23415e] pt-5 text-[13px] text-[#93a8bc]">
                    <li className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c6f24e]" strokeWidth={3} />
                      Correções ilimitadas por 6 meses
                    </li>
                    <li className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c6f24e]" strokeWidth={3} />
                      Reescrita nota 1000
                    </li>
                    <li className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c6f24e]" strokeWidth={3} />
                      Matriz das cinco competências
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => iniciarCheckout('semestral')}
                  disabled={planoCarregando !== null}
                  className="mt-7 flex cursor-pointer items-center justify-center border-2 border-[#23415e] py-3 text-[13px] font-bold uppercase tracking-wide text-[#f2f7fb] transition-colors hover:border-[#c6f24e] hover:text-[#c6f24e] disabled:opacity-50"
                >
                  {planoCarregando === 'semestral' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Assinar semestral'
                  )}
                </button>
              </div>
            </div>

            {/* Garantia */}
            <div className="mt-10 flex flex-col gap-5 border border-[#23415e] bg-[#0f2438] p-6 sm:flex-row sm:items-center sm:gap-8">
              <div className="shrink-0 border-2 border-[#c6f24e] px-5 py-3 text-center">
                <span className="fonte-placar block text-[28px] leading-none text-[#c6f24e]">7</span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#c6f24e]">
                  dias
                </span>
              </div>
              <p className="max-w-2xl text-[14px] leading-relaxed text-[#93a8bc]">
                Use o avaliador, envie quantas redações quiser e avalie a qualidade dos
                diagnósticos. Se não for útil para os seus estudos, peça o reembolso em até sete
                dias e receba o valor integral de volta, sem precisar justificar.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-[#23415e] bg-[#0f2438]">
          <div className="mx-auto max-w-3xl px-5 py-14">
            <h2 className="fonte-placar mb-8 text-[26px] uppercase sm:text-[32px]">
              Perguntas frequentes
            </h2>

            <div className="divide-y divide-[#23415e] border-y border-[#23415e]">
              {FAQ.map((item, idx) => (
                <div key={item.q}>
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left"
                  >
                    <span className="text-[15px] font-bold text-[#f2f7fb]">{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#c6f24e] transition-transform ${
                        openFaq === idx ? 'rotate-180' : ''
                      }`}
                      strokeWidth={3}
                    />
                  </button>
                  {openFaq === idx && (
                    <p className="pb-5 pr-10 text-[14px] leading-[1.75] text-[#93a8bc]">{item.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-b border-[#23415e]">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center">
            <h2 className="fonte-placar text-[30px] uppercase leading-tight text-balance sm:text-[40px]">
              A próxima redação que você escrever pode já voltar corrigida
            </h2>
            <button
              onClick={irParaPlanos}
              className="mt-8 inline-flex cursor-pointer items-center gap-2 bg-[#c6f24e] px-9 py-4 text-sm font-bold uppercase tracking-wide text-[#0b1b2b] transition-colors hover:bg-[#a5ce35]"
            >
              Escolher meu plano
              <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex flex-col justify-between gap-2 text-[12px] text-[#93a8bc] sm:flex-row">
          <span className="fonte-placar uppercase tracking-wide">Nota 1000</span>
          <span>suporte@avaliadornota1000.com</span>
        </div>
      </footer>
    </div>
  );
}
