'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Sem dependência de Navbar/Footer de propósito: um error boundary precisa
 * ser a coisa mais simples possível da árvore — se o que quebrou for algo
 * que esses componentes também usam (ex: AuthContext), arrastar mais
 * dependência aqui só aumenta a chance de o próprio fallback falhar.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro não tratado em produção:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-papel px-4 py-20 text-center text-tinta">
      <p className="text-xs font-semibold uppercase tracking-wider text-vermelho">Algo deu errado</p>
      <h1 className="mt-2 fonte-serifada text-3xl font-bold sm:text-4xl">
        Não conseguimos carregar esta página
      </h1>
      <p className="mt-3 max-w-md text-sm text-tinta-fraca">
        O erro já foi registrado. Tente novamente ou volte para a página inicial.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-azul px-6 py-3 font-bold text-sm text-white shadow-[0_12px_35px_rgba(79,140,255,0.25)] hover:brightness-110 transition cursor-pointer"
        >
          Tentar de novo
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-regua bg-folha px-6 py-3 font-bold text-sm text-tinta hover:border-azul transition"
        >
          Voltar para a home
        </Link>
      </div>
    </div>
  );
}
