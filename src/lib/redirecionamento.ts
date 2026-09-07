/**
 * Destino pós-login ("?redirect=") — leitura, validação e transporte.
 *
 * Existe como módulo próprio por dois motivos. O primeiro é que a regra é
 * usada em cinco telas e duplicá-la significaria, mais cedo ou mais tarde,
 * uma delas esquecer a validação. O segundo é que essa validação não é
 * detalhe: um `?redirect=` aceito sem checagem é uma vulnerabilidade de
 * **open redirect** — o atacante monta `nossosite.com/auth?redirect=https://
 * site-falso.com`, a vítima vê o nosso domínio e a nossa tela de login
 * legítima, entra, e é despejada num clone que pede a senha de novo.
 */

/** Para onde vai quem não pediu destino algum. É livre para qualquer usuário
 *  logado, ao contrário de /dashboard, que exige assinatura. */
export const DESTINO_PADRAO = '/nova-redacao';

const CHAVE_SESSAO = 'nota1000:destino-pos-login';

/**
 * Aceita apenas caminho interno. Rejeita URL absoluta (`https://...`),
 * protocolo relativo (`//site-falso.com`, que o navegador resolve como host
 * externo) e qualquer coisa que não comece por barra.
 */
export function destinoSeguro(bruto: string | null | undefined): string {
  if (!bruto) return DESTINO_PADRAO;
  if (!bruto.startsWith('/')) return DESTINO_PADRAO;
  if (bruto.startsWith('//')) return DESTINO_PADRAO;
  // `/\` é tratado como `//` por alguns navegadores.
  if (bruto.startsWith('/\\')) return DESTINO_PADRAO;
  return bruto;
}

/** Monta o link para /auth preservando de onde a pessoa veio. */
export function urlDeLogin(destino: string): string {
  const seguro = destinoSeguro(destino);
  return seguro === DESTINO_PADRAO ? '/auth' : `/auth?redirect=${encodeURIComponent(seguro)}`;
}

/**
 * O login pelo Google sai do site e volta em /auth/callback — um carregamento
 * novo, sem a query string original. Por isso o destino precisa ser guardado
 * antes da saída e recuperado na volta; passar o parâmetro entre páginas
 * funcionaria no login por e-mail e falharia em silêncio no Google.
 *
 * sessionStorage (e não localStorage) porque o destino morre com a aba: é
 * lixo se sobreviver ao fim da sessão de navegação.
 */
export function guardarDestino(destino: string): void {
  try {
    sessionStorage.setItem(CHAVE_SESSAO, destinoSeguro(destino));
  } catch {
    // Modo privado ou storage bloqueado: perder o destino só faz cair no
    // padrão, então não vale interromper o login por causa disso.
  }
}

/** Lê e consome o destino guardado. Consome para não vazar para um login
 *  seguinte, que teria outro contexto. */
export function resgatarDestino(): string {
  try {
    const guardado = sessionStorage.getItem(CHAVE_SESSAO);
    sessionStorage.removeItem(CHAVE_SESSAO);
    return destinoSeguro(guardado);
  } catch {
    return DESTINO_PADRAO;
  }
}
