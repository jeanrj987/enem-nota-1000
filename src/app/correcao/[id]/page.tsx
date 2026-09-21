'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertCircle,
  PenTool,
  Loader2,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { lerRespostaJson } from '@/lib/resposta-http';
import { Footer } from '@/components/Footer';
import { RequerLogin } from '@/components/RequerLogin';
import { CorrecaoView } from '@/components/CorrecaoView';
import { CorrecaoBloqueada } from '@/components/CorrecaoBloqueada';
import { buscarRedacaoPorId } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { Redacao } from '@/types';

interface RespostaCompletar {
  completada?: boolean;
  correcao?: Redacao['correcao'];
}

export default function PaginaResultadoCorrecao() {
  const params = useParams();
  const id = params?.id as string;

  const [redacao, setRedacao] = useState<Redacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [completando, setCompletando] = useState(false);

  // Não é preciso consultar a assinatura aqui: a correção só vem do banco
  // quando há plano ativo (RLS de `correcoes`). Se veio `chamariz` em vez
  // de `correcao`, é porque o acesso está bloqueado — na origem, não na tela.
  useEffect(() => {
    if (!id) return;
    let ativo = true;

    buscarRedacaoPorId(id).then(async (encontrada) => {
      if (!ativo) return;
      if (encontrada) setRedacao(encontrada);
      setLoading(false);

      // Redação corrigida no acesso gratuito roda uma passagem só. Se a
      // correção chegou até aqui, a RLS já confirmou que há plano ativo —
      // então esta pessoa pagou pela dupla correção e ainda não a recebeu.
      // A rota é idempotente: se já estiver completa, não gasta chamada.
      const r = encontrada?.correcao?.reconciliacao;
      if (!r?.correcaoUnica || r.motivoCorrecaoUnica !== 'acesso-gratuito') return;

      setCompletando(true);
      try {
        const { data: sessao } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
        const token = sessao.session?.access_token;
        if (!token) return;

        const res = await fetch('/api/corrigir/completar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ redacaoId: id }),
        });
        const data = await lerRespostaJson<RespostaCompletar>(res);
        if (ativo && res.ok && data.completada && data.correcao) {
          setRedacao((atual) => (atual ? { ...atual, correcao: data.correcao } : atual));
        }
      } catch {
        // Falhar aqui não tira nada do aluno: ele continua vendo uma correção
        // real e válida, apenas sem a segunda passagem.
      } finally {
        if (ativo) setCompletando(false);
      }
    });

    return () => {
      ativo = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-papel text-tinta">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
        <RequerLogin>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-tinta-fraca hover:text-tinta px-3 py-1.5 rounded-xl bg-folha border border-regua transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>

        {loading ? (
          <div className="glass-panel p-16 rounded-xl border border-regua text-center space-y-4">
            <Loader2 className="w-8 h-8 text-azul animate-spin mx-auto" />
            <p className="text-sm text-tinta-fraca">Carregando relatório da redação...</p>
          </div>
        ) : redacao && !redacao.correcao && redacao.chamariz ? (
          <CorrecaoBloqueada redacao={redacao} chamariz={redacao.chamariz} />
        ) : !redacao || !redacao.correcao ? (
          <div className="glass-panel p-16 rounded-xl border border-regua text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-vermelho-claro border border-vermelho/30 flex items-center justify-center mx-auto text-vermelho">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-tinta">Redação não encontrada</h2>
            <p className="text-xs text-tinta-fraca max-w-md mx-auto">
              O relatório solicitado não pôde ser localizado ou ainda está em processamento.
            </p>
            <div className="pt-2">
              <Link
                href="/nova-redacao"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-azul text-folha text-xs font-semibold shadow-md"
              >
                <PenTool className="w-4 h-4" />
                <span>Escrever Nova Redação</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {completando && (
              <div className="glass-panel rounded-xl border border-regua p-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-azul animate-spin shrink-0" />
                <p className="text-xs text-tinta-suave">
                  Rodando a segunda correção independente e reconciliando as notas, como faz a
                  banca do ENEM. A nota abaixo pode se ajustar em instantes.
                </p>
              </div>
            )}
            <CorrecaoView redacao={redacao} correcao={redacao.correcao} />
          </>
        )}
        </RequerLogin>
      </main>

      <Footer />
    </div>
  );
}
