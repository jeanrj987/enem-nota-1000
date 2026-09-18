'use client';

/**
 * Resgate de compra que não liberou acesso sozinha.
 *
 * O checkout da Kiwify tem campo de e-mail editável, então nem toda compra
 * chega com o e-mail do cadastro: paga-se com o e-mail do cartão, com o do
 * pai ou da mãe, ou com o mesmo e-mail e um erro de digitação. Antes desta
 * tela, o único caminho de volta era a pessoa abrir um chamado e alguém
 * liberar na mão — quem não reclamava simplesmente ficava sem o que pagou.
 *
 * O código do pedido não é burocracia: é a prova de que a compra é de quem
 * está pedindo. Sem ele, qualquer conta criada de graça reivindicaria o
 * acesso pago de outra pessoa (ver `src/lib/compras-orfas.ts`).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Receipt, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { DESTINO_PADRAO, urlDeLogin } from '@/lib/redirecionamento';

export default function VincularCompraPage() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();

  const [email, setEmail] = useState('');
  const [codigoPedido, setCodigoPedido] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (carregando) return;
    if (!usuario) router.replace(urlDeLogin('/vincular-compra'));
  }, [carregando, usuario, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    try {
      const { data: sessao } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
      const token = sessao.session?.access_token;
      if (!token) {
        setErro('Sua sessão expirou. Entre de novo e tente mais uma vez.');
        return;
      }

      const resposta = await fetch('/api/vincular-compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, codigoPedido }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados?.error ?? 'Não foi possível vincular a compra agora.');
        return;
      }
      setSucesso(true);
    } catch (erroRede) {
      // Rede caindo no meio do resgate é o pior momento possível para a
      // pessoa ficar sem resposta: ela já pagou e está tentando destravar.
      console.error('Falha de rede ao vincular compra:', erroRede);
      setErro('Falha de conexão. Confira sua internet e tente de novo.');
    } finally {
      setEnviando(false);
    }
  };

  if (carregando || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-papel">
        <Loader2 className="w-8 h-8 text-azul animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-papel text-tinta">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {sucesso ? <Liberado /> : (
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-azul flex items-center justify-center mx-auto shadow-lg shadow-tinta/10">
                <ShieldCheck className="w-7 h-7 text-folha" />
              </div>
              <h1 className="text-2xl font-extrabold text-tinta">Já pagou e o acesso não liberou?</h1>
              <p className="text-xs text-tinta-fraca">
                Acontece quando a compra é feita com um e-mail diferente do da sua conta. Informe os
                dados da compra abaixo que liberamos na hora.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="glass-panel p-6 sm:p-8 rounded-xl border border-regua shadow-2xl space-y-4"
            >
              {erro && (
                <div className="p-3 rounded-xl text-xs bg-vermelho-claro border border-vermelho/30 text-vermelho">
                  {erro}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email-compra" className="block text-xs font-semibold text-tinta-suave">
                  E-mail usado na compra
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="email-compra"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="o e-mail que apareceu no checkout"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    className="w-full bg-folha/90 border border-regua/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-tinta placeholder-tinta-fraca focus:outline-none focus:border-azul"
                  />
                </div>
                <p className="text-[11px] text-tinta-fraca">
                  Pode ser diferente do e-mail desta conta ({usuario.email}). É exatamente esse o
                  caso que esta tela resolve.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="codigo-pedido" className="block text-xs font-semibold text-tinta-suave">
                  Código do pedido
                </label>
                <div className="relative">
                  <Receipt className="w-4 h-4 text-tinta-fraca absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="codigo-pedido"
                    type="text"
                    required
                    placeholder="ex: aBc12De34"
                    value={codigoPedido}
                    onChange={(ev) => setCodigoPedido(ev.target.value)}
                    className="w-full bg-folha/90 border border-regua/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-tinta placeholder-tinta-fraca focus:outline-none focus:border-azul"
                  />
                </div>
                <p className="text-[11px] text-tinta-fraca">
                  Está no e-mail de confirmação da Kiwify, como <strong>Pedido</strong> ou{' '}
                  <strong>ID da compra</strong>. Pedimos ele para garantir que ninguém use a compra
                  de outra pessoa.
                </p>
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full py-3 rounded-xl bg-azul hover:brightness-110 text-folha text-xs font-bold shadow-lg shadow-tinta/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {enviando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Liberar meu acesso</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Liberado() {
  return (
    <div className="w-full max-w-md mx-auto space-y-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-verde flex items-center justify-center mx-auto shadow-lg shadow-tinta/10">
        <CheckCircle2 className="w-7 h-7 text-folha" />
      </div>
      <h1 className="text-2xl font-extrabold text-tinta">Acesso liberado!</h1>
      <p className="text-xs text-tinta-fraca">
        Sua compra foi vinculada a esta conta. Pode corrigir suas redações normalmente.
      </p>
      <Link
        href={DESTINO_PADRAO}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-azul px-5 py-3 text-xs font-bold text-folha transition hover:brightness-110"
      >
        <span>Ir para o meu painel</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
