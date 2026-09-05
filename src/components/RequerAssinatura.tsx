'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { temAcessoAtivo } from '@/lib/assinatura';
import { buscarPerfil, perfilCompleto } from '@/lib/perfil';

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
      router.replace('/auth');
      return;
    }

    let ativo = true;
    buscarPerfil(usuario.id).then((perfil) => {
      if (!ativo) return;
      if (!perfilCompleto(perfil)) {
        router.replace(`/completar-perfil?redirect=${encodeURIComponent(pathname || '/dashboard')}`);
        return;
      }
      temAcessoAtivo().then((tem) => {
        if (!ativo) return;
        if (tem) {
          setLiberado(true);
        } else {
          router.replace('/vendas');
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
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
