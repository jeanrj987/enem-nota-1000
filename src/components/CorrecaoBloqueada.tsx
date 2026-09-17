'use client';

import Link from 'next/link';
import { Lock, AlertTriangle, ArrowRight } from 'lucide-react';
import { ChamarizCorrecao, Redacao } from '@/types';

/**
 * Tela mostrada quando a redação foi corrigida mas o usuário não tem
 * assinatura ativa. A correção real não está aqui — ela nunca sai do
 * servidor, porque a RLS de `correcoes` exige plano ativo. O que aparece
 * são só os dados de chamariz (quantos desvios foram encontrados e se o
 * texto foi anulado), suficientes para provar que a correção existe.
 *
 * Os blocos borrados abaixo são deliberadamente vazios: é um esqueleto,
 * não uma nota real desfocada. Borrar dado verdadeiro seria falso conforto,
 * já que qualquer inspetor de elementos o revelaria.
 */
export function CorrecaoBloqueada({
  redacao,
  chamariz,
}: {
  redacao: Redacao;
  chamariz: ChamarizCorrecao;
}) {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl border border-regua p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-tinta-fraca">
          Correção concluída
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-tinta sm:text-3xl">
          {redacao.titulo || 'Redação ENEM'}
        </h1>
        <p className="mt-1 text-sm text-tinta-fraca">Tema: {redacao.tema}</p>

        {chamariz.anulada && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-vermelho/30 bg-vermelho-claro p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-vermelho" />
            <p className="text-sm text-vermelho">
              Sua redação se enquadrou em uma situação que <strong>zera a nota</strong> pelos
              critérios do INEP. O motivo detalhado está na correção completa.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-regua bg-folha/60 p-5">
            <span className="text-3xl font-black tabular-nums text-tinta">
              {chamariz.total_erros}
            </span>
            <p className="mt-1 text-sm text-tinta-fraca">
              {chamariz.total_erros === 1
                ? 'desvio identificado no seu texto'
                : 'desvios identificados no seu texto'}
            </p>
          </div>
          <div className="rounded-xl border border-regua bg-folha/60 p-5">
            <span className="text-3xl font-black text-tinta-fraca">•••</span>
            <p className="mt-1 text-sm text-tinta-fraca">
              Nota nas 5 competências, disponível com um plano ativo
            </p>
          </div>
        </div>
      </div>

      {/* Esqueleto do relatório: forma, sem conteúdo. */}
      <div className="relative">
        <div className="pointer-events-none select-none space-y-4 opacity-40 blur-[6px]" aria-hidden>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-regua bg-folha/60 p-6">
              <div className="mb-3 h-3 w-1/3 rounded bg-pauta" />
              <div className="mb-2 h-2.5 w-full rounded bg-folha-2" />
              <div className="mb-2 h-2.5 w-11/12 rounded bg-folha-2" />
              <div className="h-2.5 w-4/5 rounded bg-folha-2" />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-azul/30 bg-azul-claro text-azul">
            <Lock className="h-7 w-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h2 className="text-lg font-bold text-tinta">Sua correção completa está pronta</h2>
            <p className="text-sm text-tinta-suave">
              Assine um plano para ver a nota de cada competência, os {chamariz.total_erros} desvios
              marcados no seu texto, a versão reescrita nota 1000 e o plano de ação pedagógico.
            </p>
          </div>
          <Link
            href="/vendas"
            className="inline-flex items-center gap-2 rounded-xl bg-azul px-7 py-3 text-sm font-bold text-folha shadow-lg shadow-tinta/10 transition-colors hover:bg-azul"
          >
            Ver planos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
