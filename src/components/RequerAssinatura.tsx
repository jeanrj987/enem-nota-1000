'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { temAcessoAtivo } from '@/lib/assinatura';
import { buscarPerfil, perfilCompleto } from '@/lib/perfil';
import { decidirGateAssinatura } from '@/lib/gates';

/**
 * Bloqueia o conteúdo interno até confirmar login + cadastro completo +
 * assinatura ativa do usuário autenticado — sem sessão, redireciona para
 * /auth; logado com perfil incompleto, para /completar-perfil; sem
 * assinatura, para /vendas. Usado nas páginas que exigem pagamento
 * (dashboard, histórico). Nova redação e visualização de correção usam
 * `RequerLogin` — não exigem assinatura, só bloqueiam (blur) o resultado.
 */
export function RequerAssinatura({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { usuario, carregando } = useAuth();
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    if (carregando) return;
    if (!usuario) {
      const decisao = decidirGateAssinatura(false, null, false, pathname || '');
      if (decisao.tipo === 'redirecionar') router.replace(decisao.url);
      return;
    }

    let ativo = true;
    buscarPerfil(usuario.id).then((perfil) => {
      if (!ativo) return;
      if (!perfilCompleto(perfil)) {
        const decisao = decidirGateAssinatura(true, perfil, false, pathname || '');
        if (decisao.tipo === 'redirecionar') router.replace(decisao.url);
        return;
      }
      temAcessoAtivo().then((tem) => {
        if (!ativo) return;
        const decisaoFinal = decidirGateAssinatura(true, perfil, tem, pathname || '');
        if (decisaoFinal.tipo === 'liberado') {
          setLiberado(true);
        } else {
          router.replace(decisaoFinal.url);
        }
      });
    });
    return () => {
      ativo = false;
    };
  }, [carregando, usuario, router, pathname]);

  if (!liberado) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-vermelho animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
