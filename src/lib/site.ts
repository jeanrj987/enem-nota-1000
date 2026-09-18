/**
 * Endereço público canônico do site.
 *
 * Existe porque `metadataBase`, o link canônico e a imagem de compartilhamento
 * precisam de URL absoluta — e URL de ambiente não pode ficar cravada no
 * código. A ordem de resolução imita a que o próprio Next usa como fallback
 * para imagens sociais (`lib/metadata/resolvers/resolve-url.js`):
 *
 * 1. `NEXT_PUBLIC_SITE_URL` — o domínio próprio, definido por nós. É o único
 *    que aponta para `https://www.nota1000enem.digital`; sem ele o site
 *    responde, mas se anuncia pelo endereço da Vercel.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — injetada pela Vercel em build de
 *    produção. Rede de segurança para o caso de alguém esquecer a de cima.
 * 3. `localhost` — desenvolvimento.
 */

const PORTA_PADRAO_DEV = 3000;

function semBarraFinal(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function urlDoSite(): string {
  const configurada = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configurada) return semBarraFinal(configurada);

  const producaoNaVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (producaoNaVercel) return `https://${producaoNaVercel}`;

  return `http://localhost:${process.env.PORT || PORTA_PADRAO_DEV}`;
}
