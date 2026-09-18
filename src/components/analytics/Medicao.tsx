'use client';

import { Suspense, useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { GA_MEASUREMENT_ID, META_PIXEL_ID, ga4Ativo, metaPixelAtivo } from '@/lib/analytics/config';
import { capturarAtribuicao } from '@/lib/analytics/atribuicao';

/**
 * Carrega Meta Pixel e GA4 e mantém os dois cientes da navegação.
 *
 * Vive no layout raiz, mas não renderiza nada quando as variáveis não estão
 * configuradas — em desenvolvimento e em preview o normal é não haver pixel
 * nenhum, e isso não pode ser um erro.
 *
 * `afterInteractive` e não `beforeInteractive`: medição não é crítica para
 * pintar a página. Bloquear a hidratação da landing para carregar script de
 * anúncio custaria exatamente a conversão que se está tentando medir.
 */
export function Medicao() {
  if (!metaPixelAtivo && !ga4Ativo) return null;

  return (
    <>
      {metaPixelAtivo && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
          {/* Sem JavaScript o Pixel não roda; este pixel de imagem cobre esse
              caso e é o que o próprio Meta entrega no código base. */}
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              alt=""
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}

      {ga4Ativo && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: true });
            `}
          </Script>
        </>
      )}

      {/* `useSearchParams` obriga um limite de Suspense: sem ele, toda a
          árvore abaixo do layout raiz cairia para renderização no cliente e
          a landing deixaria de ser estática — perderíamos justamente a
          página que precisa carregar rápido para converter. */}
      <Suspense fallback={null}>
        <NavegacaoMedida />
      </Suspense>
    </>
  );
}

/**
 * O App Router troca de página sem recarregar o documento, então o código
 * base do Pixel — que só roda uma vez — registraria a visita inicial e mais
 * nenhuma. Este efeito repõe o `PageView` a cada navegação e reaproveita o
 * momento para capturar o `fbclid`, que pode chegar em qualquer URL, não só
 * na primeira.
 */
function NavegacaoMedida() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    capturarAtribuicao();

    // O código base já disparou o PageView desta primeira página. Disparar
    // de novo aqui contaria toda visita em dobro.
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }

    if (metaPixelAtivo) window.fbq?.('track', 'PageView');
    if (ga4Ativo && GA_MEASUREMENT_ID) {
      window.gtag?.('config', GA_MEASUREMENT_ID, {
        page_path: `${pathname}${searchParams.toString() ? `?${searchParams}` : ''}`,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
