'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { temAcessoAtivo } from '@/lib/assinatura';

/**
 * Bloqueia o conteúdo interno até confirmar que o device_id atual tem
 * assinatura ativa — senão redireciona para /vendas. Usado nas páginas do
 * avaliador (nova-redacao, dashboard, historico, correcao/[id]).
 */
export function RequerAssinatura({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    let ativo = true;
    temAcessoAtivo().then((tem) => {
      if (!ativo) return;
      if (tem) {
        setLiberado(true);
      } else {
        router.replace('/vendas');
      }
    });
    return () => {
      ativo = false;
    };
  }, [router]);

  if (!liberado) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
