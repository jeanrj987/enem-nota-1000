'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertCircle,
  PenTool,
  Loader2,
  Cpu,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CorrecaoView } from '@/components/CorrecaoView';
import { buscarRedacaoPorId } from '@/lib/storage';
import { Redacao } from '@/types';

export default function PaginaResultadoCorrecao() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [redacao, setRedacao] = useState<Redacao | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const encontrada = buscarRedacaoPorId(id);
      if (encontrada) {
        setRedacao(encontrada);
      }
      setLoading(false);
    }
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-[#02040a] text-slate-100 font-sans selection:bg-cyan-400 selection:text-black relative">
      <div className="fixed inset-0 tech-grid-bg opacity-30 pointer-events-none z-0" />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 relative z-10">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-slate-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg bg-[#040816] border border-cyan-500/25 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>VOLTAR AO CENTRO DE CONTROLE</span>
          </Link>
        </div>

        {loading ? (
          <div className="tech-card p-16 rounded-3xl border border-cyan-500/30 text-center space-y-4 hud-corner">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-400">CARREGANDO DIAGNÓSTICO DO EXAME...</p>
          </div>
        ) : !redacao || !redacao.correcao ? (
          <div className="tech-card p-16 rounded-3xl border border-rose-500/30 text-center space-y-4 hud-corner">
            <div className="w-12 h-12 rounded-xl bg-rose-950/50 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-mono font-bold text-white uppercase">[ REDAÇÃO NÃO ENCONTRADA ]</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
              O relatório solicitado não pôde ser localizado na base local de dados.
            </p>
            <div className="pt-2">
              <Link
                href="/nova-redacao"
                className="btn-cyber-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-mono font-bold"
              >
                <PenTool className="w-4 h-4" />
                <span>AVALIAR NOVA REDAÇÃO</span>
              </Link>
            </div>
          </div>
        ) : (
          <CorrecaoView redacao={redacao} correcao={redacao.correcao} />
        )}
      </main>

      <Footer />
    </div>
  );
}
