'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { buscarPerfil } from '@/lib/perfil';
import { decidirGateLogin } from '@/lib/gates';

/**
 * Exige login + cadastro completo, mas NÃO exige assinatura ativa — usado em
 * páginas onde o usuário pode escrever/corrigir redações de graça e só o
 * resultado detalhado fica bloqueado (blur) até a compra. Sem sessão,
 * redireciona para /auth; logado mas com perfil incompleto (comum em quem
 * entrou via Google, que não passa pelo formulário de cadastro), redireciona
 * para /completar-perfil.
 */
export function RequerLogin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { usuario, carregando } = useAuth();
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    if (carregando) return;
    if (!usuario) {
      // Leva junto de onde a pessoa foi barrada: quem tentou abrir uma
      // correção antiga volta para aquela correção, não para o editor.
      const decisao = decidirGateLogin(false, null, pathname || '');
      if (decisao.tipo === 'redirecionar') router.replace(decisao.url);
      return;
    }

    let ativo = true;
    buscarPerfil(usuario.id).then((perfil) => {
      if (!ativo) return;
      const decisao = decidirGateLogin(true, perfil, pathname || '');
      if (decisao.tipo === 'liberado') {
        setLiberado(true);
      } else {
        router.replace(decisao.url);
      }
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
