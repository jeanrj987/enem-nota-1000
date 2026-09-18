import { Quote } from 'lucide-react';

/**
 * Demonstração da correção na página de vendas.
 *
 * Existe porque a landing não tinha nenhuma prova: afirmava "análise
 * detalhada", "erros destacados", "versão reescrita" e pedia que se
 * acreditasse. Quem nunca viu o produto não tinha como julgar se valia R$97
 * — e a objeção real de quem chega por anúncio não é preço, é desconfiança.
 *
 * Usa as MESMAS classes de marcação do produto (`highlight-*`,
 * `risco-corretor`, `bloco-pautado`, definidas em `globals.css`), e não uma
 * imitação: se o visual da correção mudar, esta demonstração muda junto. Uma
 * demonstração que envelhece separada do produto vira promessa falsa.
 *
 * O conteúdo é um exemplo ilustrativo, escrito para a demonstração — não é a
 * redação de nenhum aluno real, e está rotulado como exemplo na tela.
 */

const COMPETENCIAS_EXEMPLO = [
  { sigla: 'C1', nome: 'Norma culta', nota: 160 },
  { sigla: 'C2', nome: 'Tema e repertório', nota: 200 },
  { sigla: 'C3', nome: 'Argumentação', nota: 160 },
  { sigla: 'C4', nome: 'Coesão', nota: 160 },
  { sigla: 'C5', nome: 'Intervenção', nota: 160 },
];

const NOTA_MAXIMA_COMPETENCIA = 200;
const NOTA_EXEMPLO = COMPETENCIAS_EXEMPLO.reduce((soma, c) => soma + c.nota, 0);

export function ExemploCorrecao() {
  return (
    <div className="glass-panel overflow-hidden rounded-2xl border border-regua">
      {/* Cabeçalho: a nota, que é a primeira coisa que a pessoa procura. */}
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-regua bg-folha-2/60 p-6 sm:p-7">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-azul">
            Exemplo de correção
          </span>
          <p className="mt-1.5 text-[13px] text-tinta-fraca">
            Tema: Desafios para o acolhimento da população idosa no Brasil
          </p>
        </div>
        <div className="text-right">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-tinta-fraca">
            Nota estimada
          </span>
          <span className="text-4xl font-black tabular-nums text-tinta">{NOTA_EXEMPLO}</span>
          <span className="text-lg font-bold text-tinta-fraca">/1000</span>
        </div>
      </div>

      {/* As 5 competências, com a barra mostrando quanto falta para 200. */}
      <div className="grid gap-3 border-b border-regua p-6 sm:grid-cols-5 sm:p-7">
        {COMPETENCIAS_EXEMPLO.map((c) => (
          <div key={c.sigla}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-black text-azul">{c.sigla}</span>
              <span className="text-[13px] font-bold tabular-nums text-tinta">{c.nota}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-folha-2">
              <div
                className="h-full rounded-full bg-azul"
                style={{ width: `${(c.nota / NOTA_MAXIMA_COMPETENCIA) * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] leading-tight text-tinta-fraca">{c.nome}</p>
          </div>
        ))}
      </div>

      {/* O trecho marcado: é isto que diferencia diagnóstico de nota solta. */}
      <div className="p-6 sm:p-7">
        <span className="text-[11px] font-black uppercase tracking-widest text-tinta-fraca">
          Seu texto, com as marcações
        </span>

        <p className="bloco-pautado mt-3 text-[15px] leading-8 text-tinta">
          Portanto, é evidente que o poder público deve criar políticas que garantam o acesso à
          saúde, tendo em vista que muitos idosos{' '}
          <span className="highlight-concordancia">não tem</span> condições de arcar com os
          tratamentos necessários{' '}
          <span className="highlight-coesao">e também</span> com os medicamentos de uso contínuo.
        </p>

        <div className="mt-5 space-y-3">
          <ComentarioDoCorretor
            categoria="Concordância verbal"
            corDaCategoria="text-verde"
            competencia="C1"
          >
            O sujeito é <strong className="text-tinta">muitos idosos</strong>, plural. O certo é{' '}
            <span className="risco-corretor">não tem</span>{' '}
            <strong className="text-tinta">não têm</strong>, com acento circunflexo — é ele que
            marca a terceira pessoa do plural.
          </ComentarioDoCorretor>

          <ComentarioDoCorretor
            categoria="Coesão"
            corDaCategoria="text-ambar"
            competencia="C4"
          >
            <strong className="text-tinta">e também</strong> só empilha uma ideia na outra. Um
            conectivo que marque intensificação — <strong className="text-tinta">bem como</strong>{' '}
            ou <strong className="text-tinta">além dos</strong> — mostra relação entre as ideias, e
            é isso que a C4 avalia.
          </ComentarioDoCorretor>
        </div>

        {/* O próximo passo: o que transforma correção em estudo. */}
        <div className="mt-6 rounded-xl border border-azul/25 bg-azul-claro/50 p-5">
          <span className="text-[11px] font-black uppercase tracking-widest text-azul">
            Seu próximo passo
          </span>
          <p className="mt-2 text-[14px] leading-relaxed text-tinta-suave">
            Sua C5 perde pontos por um motivo só: a proposta diz{' '}
            <em className="text-tinta">o que</em> fazer, mas não <em className="text-tinta">quem</em>{' '}
            faz nem <em className="text-tinta">como</em>. Na próxima redação, nomeie o agente
            (Ministério da Saúde), o meio (campanhas nas UBS) e o efeito esperado. Só isso costuma
            valer 40 pontos.
          </p>
        </div>
      </div>
    </div>
  );
}

function ComentarioDoCorretor({
  categoria,
  corDaCategoria,
  competencia,
  children,
}: {
  categoria: string;
  corDaCategoria: string;
  competencia: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-regua bg-folha/60 p-4">
      <Quote className="mt-0.5 h-4 w-4 shrink-0 text-tinta-fraca" />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[11px] font-black uppercase tracking-wider ${corDaCategoria}`}>
            {categoria}
          </span>
          <span className="rounded-full bg-folha-2 px-2 py-0.5 text-[10px] font-bold text-tinta-fraca">
            {competencia}
          </span>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-tinta-fraca">{children}</p>
      </div>
    </div>
  );
}
