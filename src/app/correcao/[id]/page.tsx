'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertCircle,
  PenTool,
  Loader2,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { RequerLogin } from '@/components/RequerLogin';
import { CorrecaoView } from '@/components/CorrecaoView';
import { buscarRedacaoPorId } from '@/lib/storage';
import { temAcessoAtivo } from '@/lib/assinatura';
import { Redacao } from '@/types';

export default function PaginaResultadoCorrecao() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [redacao, setRedacao] = useState<Redacao | null>(null);
  const [assinaturaAtiva, setAssinaturaAtiva] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([buscarRedacaoPorId(id), temAcessoAtivo()]).then(([encontrada, ativa]) => {
        if (encontrada) setRedacao(encontrada);
        setAssinaturaAtiva(ativa);
        setLoading(false);
      });
    }
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
        <RequerLogin>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>

        {loading ? (
          <div className="glass-panel p-16 rounded-3xl border border-slate-800 text-center space-y-4">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Carregando relatório da redação...</p>
          </div>
        ) : !redacao || !redacao.correcao ? (
          <div className="glass-panel p-16 rounded-3xl border border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-800/60 flex items-center justify-center mx-auto text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Redação não encontrada</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              O relatório solicitado não pôde ser localizado ou ainda está em processamento.
            </p>
            <div className="pt-2">
              <Link
                href="/nova-redacao"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md"
              >
                <PenTool className="w-4 h-4" />
                <span>Escrever Nova Redação</span>
              </Link>
            </div>
          </div>
        ) : (
          <CorrecaoView redacao={redacao} correcao={redacao.correcao} bloqueado={!assinaturaAtiva} />
        )}
        </RequerLogin>
      </main>

      <Footer />
    </div>
  );
}
