'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { temAcessoAtivo } from '@/lib/assinatura';

const TENTATIVAS_MAX = 6;
const INTERVALO_MS = 2000;

function ConteudoSucesso() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [estado, setEstado] = useState<'confirmando' | 'ativo' | 'demorando'>('confirmando');

  useEffect(() => {
    let tentativas = 0;
    let cancelado = false;

    // A Kiwify redireciona para cá depois do pagamento, mas quem confirma o
    // acesso é o webhook (/api/kiwify/webhook) — aqui só ficamos consultando
    // se o acesso já apareceu, sem verificação síncrona própria (diferente
    // do fluxo antigo do Stripe, que consultava a Checkout Session direto).
    const checar = async () => {
      const ativo = await temAcessoAtivo();
      if (cancelado) return;
      if (ativo) {
        setEstado('ativo');
        return;
      }
      tentativas += 1;
      if (tentativas >= TENTATIVAS_MAX) {
        setEstado('demorando');
        return;
      }
      setTimeout(checar, INTERVALO_MS);
    };

    checar();
    return () => {
      cancelado = true;
    };
  }, [sessionId]);

  return (
    <div className="glass-panel p-10 sm:p-16 rounded-xl border border-regua text-center space-y-5 max-w-lg mx-auto">
      {estado === 'confirmando' && (
        <>
          <Loader2 className="w-10 h-10 text-azul animate-spin mx-auto" />
          <h1 className="text-xl font-bold text-tinta">Confirmando seu pagamento...</h1>
          <p className="text-sm text-tinta-fraca">
            Isso costuma levar poucos segundos. Não feche esta página.
          </p>
        </>
      )}

      {estado === 'ativo' && (
        <>
          <div className="w-14 h-14 rounded-xl bg-verde-claro border border-verde/30 flex items-center justify-center mx-auto text-verde">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-tinta">Pagamento confirmado!</h1>
          <p className="text-sm text-tinta-fraca">Seu acesso ao avaliador já está liberado.</p>
          <Link
            href="/nova-redacao"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-azul hover:bg-azul text-folha text-xs font-semibold shadow-md transition-all"
          >
            Corrigir minha primeira redação
          </Link>
        </>
      )}

      {estado === 'demorando' && (
        <>
          <div className="w-14 h-14 rounded-xl bg-ambar-claro border border-ambar/30 flex items-center justify-center mx-auto text-ambar">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-tinta">Ainda confirmando</h1>
          <p className="text-sm text-tinta-fraca">
            O pagamento está demorando mais que o esperado para confirmar
            {sessionId ? ` (referência ${sessionId.slice(0, 20)}...)` : ''}. Se você já pagou,
            recarregue esta página em instantes.
          </p>
          {/* Recarregar não resolve o motivo mais comum de cair aqui: a
              compra feita com um e-mail diferente do da conta nunca vai
              aparecer, por mais que se espere — o webhook já passou e mandou
              a compra para a fila de resgate. Sem esta saída, a pessoa fica
              recarregando uma tela que não muda. */}
          <div className="pt-1 space-y-2">
            <p className="text-xs text-tinta-fraca">
              Pagou com um e-mail diferente do da sua conta? Então não vai confirmar sozinho.
            </p>
            <Link
              href="/vincular-compra"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-azul text-folha text-xs font-semibold shadow-md transition-all hover:brightness-110"
            >
              Liberar meu acesso agora
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function PaginaSucessoCheckout() {
  return (
    <div className="min-h-screen flex flex-col bg-papel text-tinta">
      <Navbar />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-16">
        <Suspense fallback={<Loader2 className="w-8 h-8 text-azul animate-spin mx-auto" />}>
          <ConteudoSucesso />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
