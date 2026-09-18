import { Perfil, perfilCompleto } from '@/lib/perfil';
import { DESTINO_PADRAO, urlDeLogin } from '@/lib/redirecionamento';

/**
 * Decisão de acesso extraída de `RequerLogin`/`RequerAssinatura` como função
 * pura, sem depender de React nem de chamadas de rede: recebe o estado já
 * resolvido (usuário, perfil, assinatura) e devolve o que a tela deve fazer.
 * Existe só para tornar a regra testável sem precisar renderizar componente
 * nem simular Supabase — o projeto não usa jsdom/Testing Library, e este é o
 * mesmo padrão de "lógica em lib, componente só chama" usado no resto do
 * código (ex.: `reconciliacao.ts`, `whatsapp.ts`).
 */
export type DecisaoGate = { tipo: 'liberado' } | { tipo: 'redirecionar'; url: string };

/** Regra do `RequerLogin`: exige login + cadastro completo, não exige
 *  assinatura. `usuarioLogado` é só um booleano — o componente não precisa
 *  repassar o objeto `User` inteiro para esta decisão. */
export function decidirGateLogin(
  usuarioLogado: boolean,
  perfil: Perfil | null,
  pathname: string
): DecisaoGate {
  if (!usuarioLogado) {
    return { tipo: 'redirecionar', url: urlDeLogin(pathname || DESTINO_PADRAO) };
  }
  if (!perfilCompleto(perfil)) {
    return {
      tipo: 'redirecionar',
      url: `/completar-perfil?redirect=${encodeURIComponent(pathname || DESTINO_PADRAO)}`,
    };
  }
  return { tipo: 'liberado' };
}

/** Regra do `RequerAssinatura`: exige login + cadastro completo + assinatura
 *  ativa, nessa ordem — perfil incompleto redireciona para completar o
 *  cadastro antes mesmo de checar pagamento, para não mandar ninguém pro
 *  checkout sem os dados que o produto pede depois. */
export function decidirGateAssinatura(
  usuarioLogado: boolean,
  perfil: Perfil | null,
  assinaturaAtiva: boolean,
  pathname: string
): DecisaoGate {
  const destinoPadrao = '/dashboard';
  if (!usuarioLogado) {
    return { tipo: 'redirecionar', url: urlDeLogin(pathname || destinoPadrao) };
  }
  if (!perfilCompleto(perfil)) {
    return {
      tipo: 'redirecionar',
      url: `/completar-perfil?redirect=${encodeURIComponent(pathname || destinoPadrao)}`,
    };
  }
  if (!assinaturaAtiva) {
    // A home é a página de vendas desde 17/09 (antes era `/vendas`, hoje só
    // um redirect). Mandar para `/#planos` em vez de `/` pouparia um scroll,
    // mas quem chega aqui nunca viu a oferta — pular a página inteira e
    // despejar a pessoa em cima do preço é o que converte pior.
    return { tipo: 'redirecionar', url: '/' };
  }
  return { tipo: 'liberado' };
}
