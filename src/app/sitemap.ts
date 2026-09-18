import type { MetadataRoute } from 'next';
import { urlDoSite } from '@/lib/site';

/**
 * `sitemap.xml` gerado em build (convenção `app/sitemap.ts` do App Router).
 *
 * São só duas URLs, e é para ser assim: o site tem uma página que vende e um
 * documento legal. Todo o resto é área logada, redirect ou endpoint.
 *
 * O que NÃO entra, e por quê:
 * - `/vendas` — responde 308 para `/`. Declarar um redirect no sitemap
 *   contradiz o canônico e faz o buscador gastar rastreamento para
 *   redescobrir que o endereço bom é a raiz.
 * - Rotas de app e de API — bloqueadas em `robots.ts`. Listar aqui o que se
 *   pede para não rastrear ali é mandar dois sinais opostos.
 *
 * `lastModified` usa a data do build. É honesto para um site cujo conteúdo
 * muda quando o código muda: não existe CMS nem publicação fora do deploy.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = urlDoSite();
  const modificadoEm = new Date();

  return [
    {
      url: site,
      lastModified: modificadoEm,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${site}/privacidade`,
      lastModified: modificadoEm,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
