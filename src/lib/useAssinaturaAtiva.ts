'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { temAcessoAtivo } from '@/lib/assinatura';

/**
 * Assinatura ativa da sessão atual, para a interface decidir **o que
 * oferecer** — nunca para liberar acesso.
 *
 * A distinção é a razão de este hook existir separado dos gates. Quem
 * autoriza de verdade é a RLS do Supabase e `RequerAssinatura`; aqui a
 * resposta serve só para não oferecer um caminho que vai ser recusado
 * (ADR 045) e para mostrar ao cliente pagante a navegação que é dele
 * (ADR 047). Se alguém forjar `true` no navegador, ganha um menu bonito e
 * nenhuma correção: o banco continua dizendo não.
 *
 * Vive num módulo próprio porque passou a ter três consumidores — os dois
 * acima e `Navbar` —, que é o limite de duplicação que o projeto tolera.
 */
export function useAssinaturaAtiva(): boolean | null {
  const { usuario } = useAuth();
  // Guarda de quem é a resposta, e não só o booleano: trocar de conta na
  // mesma aba não pode herdar o resultado da sessão anterior.
  const [resposta, setResposta] = useState<{ userId: string; ativa: boolean } | null>(null);

  useEffect(() => {
    if (!usuario) return;
    let ativo = true;
    temAcessoAtivo().then((ativaAgora) => {
      if (ativo) setResposta({ userId: usuario.id, ativa: ativaAgora });
    });
    return () => {
      ativo = false;
    };
  }, [usuario]);

  // `false` significa **uma** coisa: logado, e sabemos que não tem plano.
  // Todo o resto — deslogado, resposta ainda a caminho, resposta de outra
  // sessão — é `null`, "não sei ou não se aplica".
  //
  // A distinção não é preciosismo. Devolver `false` para quem está deslogado
  // fez o menu tratar visitante anônimo como assinante inadimplente e
  // desviá-lo para a oferta, em vez de deixá-lo seguir para o login levando
  // o destino junto. Com os dois casos colapsados num só valor, todo
  // consumidor teria de lembrar de checar `usuario` por fora; separando-os,
  // ninguém precisa lembrar de nada.
  if (!usuario) return null;
  if (resposta?.userId !== usuario.id) return null;
  return resposta.ativa;
}
