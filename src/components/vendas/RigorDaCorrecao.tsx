import { Users, ScanSearch, ListChecks, ShieldCheck } from 'lucide-react';

/**
 * Como a correção é feita — a seção de rigor.
 *
 * Existe porque a objeção real de quem chega por anúncio não é preço, é
 * desconfiança: "corretor de IA inventa erro". Vários concorrentes oferecem
 * correção gratuita ilimitada, então competir por "quanto de graça" é uma
 * disputa perdida. O que dá para defender é COMO a correção é feita.
 *
 * REGRA DESTA SEÇÃO: nenhuma afirmação aqui pode ser superlativo comparativo
 * ("o mais preciso", "melhor que os outros"). Ninguém mediu isso contra a
 * concorrência, e afirmar seria inventar. Cada item abaixo descreve um
 * mecanismo que existe no código e pode ser conferido:
 *
 * - dupla correção + arbitragem → `reconciliarCorrecoes` e
 *   `LIMIAR_DIVERGENCIA` em `src/lib/reconciliacao.ts`
 * - erro com trecho inexistente é descartado → `validarCorrecaoIA` em
 *   `src/lib/correcao-schema.ts` ("Erro descartado (trecho não encontrado
 *   no texto original)")
 * - os 5 elementos da C5 conferidos contra a nota → `ElementosC5Schema` e a
 *   regra de consistência de C5, no mesmo arquivo
 * - divergência de anulação resolvida a favor do aluno → o ramo
 *   `a.anulada !== b.anulada` de `reconciliarCorrecoes`
 */

const PILARES = [
  {
    icone: Users,
    titulo: 'Duas correções independentes, não uma',
    texto:
      'Sua redação é corrigida duas vezes, sem que uma veja a outra. Se as notas divergirem em mais de 100 pontos, uma terceira correção entra para arbitrar. É o mesmo princípio que o INEP usa na prova real: dois corretores, e um terceiro quando eles não concordam.',
    selo: 'Com plano',
  },
  {
    icone: ScanSearch,
    titulo: 'Todo erro apontado existe no seu texto',
    texto:
      'Antes de te mostrar qualquer desvio, o sistema confere se o trecho citado aparece literalmente na sua redação. O que não aparece é descartado e nunca chega até você. É a trava contra o problema mais conhecido de corretor automático: apontar erro que não foi cometido.',
  },
  {
    icone: ListChecks,
    titulo: 'A Competência 5 é conferida elemento por elemento',
    texto:
      'Agente, ação, meio, efeito e detalhamento. A nota da sua proposta de intervenção é checada contra quais desses cinco o seu texto de fato tem — porque esquecer um só derruba a nota em 40 pontos, e é a perda mais comum e mais evitável da redação.',
  },
  {
    icone: ShieldCheck,
    titulo: 'Na dúvida sobre anulação, vale a leitura que te favorece',
    texto:
      'Se as correções discordarem sobre o seu texto ser anulado, não existe "meio anulada": prevalece o julgamento mais favorável a você, e a divergência fica registrada no seu resultado. A régua é sempre a mais garantista para o aluno.',
  },
];

export function RigorDaCorrecao() {
  return (
    <section id="rigor" className="scroll-mt-20 border-y border-regua bg-folha-2/60 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <span className="text-[11px] font-black uppercase tracking-widest text-azul">
            Por que confiar na nota
          </span>
          <h2 className="mx-auto mt-3 max-w-2xl text-[2rem] font-black leading-tight tracking-tight sm:text-4xl">
            Corretor automático que inventa erro é fácil de achar.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-tinta-suave">
            Por isso o rigor da correção não é promessa nossa — é mecanismo. Veja o que acontece com
            a sua redação depois que você envia.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {PILARES.map((p) => (
            <div key={p.titulo} className="glass-card p-7">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-azul/25 bg-azul-claro text-azul">
                  <p.icone className="h-5 w-5" />
                </div>
                {p.selo && (
                  // Marcado porque a dupla correção é do plano: a correção
                  // gratuita roda uma passagem só. Deixar implícito aqui
                  // criaria a expectativa de receber de graça algo que a
                  // rota não entrega — a mesma quebra de promessa que a
                  // reestruturação de 18/09 tirou da página.
                  <span className="rounded-full bg-azul-claro px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-azul">
                    {p.selo}
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-[17px] font-bold leading-snug">{p.titulo}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-tinta-fraca">{p.texto}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-[13px] text-tinta-fraca">
          Nada disso torna a correção infalível, e nenhuma nota aqui é a nota oficial do INEP. O que
          esses mecanismos garantem é que o diagnóstico que você recebe tenha evidência apontável no
          seu próprio texto — que é o que permite estudar em cima dele.
        </p>
      </div>
    </section>
  );
}
