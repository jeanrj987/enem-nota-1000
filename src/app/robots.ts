import type { MetadataRoute } from 'next';
import { urlDoSite } from '@/lib/site';

/**
 * `robots.txt` gerado em build (convenção `app/robots.ts` do App Router).
 *
 * Duas coisas que este arquivo NÃO faz, para não criar falsa sensação de
 * segurança:
 *
 * 1. `Disallow` não protege nada. Ele pede ao robô educado que não rastreie;
 *    não impede ninguém de abrir a URL. O que protege as rotas internas é o
 *    gate de sessão (`RequerLogin`/`RequerAssinatura`) e a RLS do Supabase.
 * 2. `Disallow` não é `noindex`. Uma URL bloqueada aqui ainda pode aparecer
 *    no buscador se alguém linkar para ela de fora — o robô só não lê o
 *    conteúdo. Como nenhuma dessas rotas é linkada publicamente, o efeito
 *    prático é o que se quer: não gastar rastreamento em tela de app que
 *    para um visitante deslogado é só um redirect.
 *
 * O que realmente importa aqui é o inverso: garantir que `/` seja rastreável
 * sem obstáculo, porque é a única página que vende.
 */
export default function robots(): MetadataRoute.Robots {
  const site = urlDoSite();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        // Área logada: para um robô, todas respondem o mesmo esqueleto de
        // carregamento e depois redirecionam. Não há conteúdo a indexar.
        '/dashboard',
        '/historico',
        '/nova-redacao',
        '/correcao/',
        '/completar-perfil',
        '/auth',
        // Pós-compra e resgate: úteis para quem recebe o link, inúteis (e
        // esquisitas) num resultado de busca.
        '/checkout/',
        '/vincular-compra',
      ],
    },
    sitemap: `${site}/sitemap.xml`,
    // Reforça qual dos dois endereços que servem o mesmo conteúdo (domínio
    // próprio e `*.vercel.app`) é o bom. Mesma razão do canônico no layout.
    host: site,
  };
}
