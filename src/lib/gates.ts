import { Perfil, perfilCompleto } from '@/lib/perfil';
import { DESTINO_PADRAO, urlDeLogin } from '@/lib/redirecionamento';

/**
 * Decisão de acesso extraída de `RequerLogin`/`RequerAssinatura` como função
 * pura, sem depender de React nem de chamadas de rede: recebe o estado já
 * resolvido (usuário, perfil, assinatura) e devolve o que a tela deve fazer.
 * Testável sem renderizar componente nem simular Supabase — mesmo padrão de
 * "lógica em lib, componente só chama" usado no resto do código (ex.:
 * `reconciliacao.ts`, `whatsapp.ts`). O componente renderizando de verdade
 * (redirecionamento real via jsdom/Testing Library) é coberto à parte em
 * `tests/gates-fluxo.test.tsx` (ADR 038).
 */
export type DecisaoGate = { tipo: 'liberado' } | { tipo: 'redirecionar'; url: string };

/**
 * Para onde vai quem está logado e em dia com o cadastro, mas sem plano.
 *
 * O destino continua sendo a home (que é a página de vendas): mandar direto
 * para `#planos` pula a página inteira e converte pior — ver a nota abaixo,
 * em `decidirGateAssinatura`. O que mudou em 21/09 foi o `?bloqueio`.
 *
 * Sem ele, a pessoa clicava em "Dashboard" no menu e reaparecia no topo do
 * site sem nenhuma explicação — o que, do lado de quem está testando, é
 * indistinguível de um menu quebrado (foi exatamente assim que o problema foi
 * reportado). O parâmetro não muda o destino nem o funil; só permite que a
 * landing diga por que trouxe a pessoa de volta. Quem consome é
 * `motivoDeBloqueio()`, lido na home.
 */
export const URL_SEM_ASSINATURA = '/?bloqueio=assinatura';

/** Lê o motivo carimbado pelo gate na query string. Fora do navegador (ou sem
 *  carimbo), não há motivo nenhum a exibir. */
export function motivoDeBloqueio(busca: string): 'assinatura' | null {
  return new URLSearchParams(busca).get('bloqueio') === 'assinatura' ? 'assinatura' : null;
}

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
    return { tipo: 'redirecionar', url: URL_SEM_ASSINATURA };
  }
  return { tipo: 'liberado' };
}
