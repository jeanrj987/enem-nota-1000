'use client';

import { EVENTOS_META, EventoMeta, ga4Ativo, metaPixelAtivo } from './config';

/**
 * Disparo de evento no navegador, para Meta Pixel e GA4 ao mesmo tempo.
 *
 * Toda chamada gera um `eventId` e o entrega ao Pixel. Isso existe por causa
 * da **deduplicação**: o mesmo evento pode chegar ao Meta duas vezes, uma
 * pelo navegador e outra pela Conversions API (servidor). Com o mesmo
 * `event_id` nos dois lados, o Meta entende que é a mesma conversão e conta
 * uma só. Sem isso, o relatório dobra e o custo por aquisição aparece pela
 * metade do real — que é o tipo de erro que faz escalar uma campanha ruim.
 *
 * O `eventId` é devolvido para quem chamou justamente para poder ser enviado
 * ao servidor quando o mesmo evento também vai sair por lá.
 */

type ParametrosEvento = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    fbq?: (
      comando: 'track' | 'trackCustom' | 'init' | 'consent',
      evento: string,
      parametros?: ParametrosEvento,
      opcoes?: { eventID: string }
    ) => void;
    gtag?: (comando: 'event' | 'config' | 'js', alvo: string, parametros?: ParametrosEvento) => void;
  }
}

function gerarEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Navegador antigo ou contexto não seguro: qualquer string única serve, o
  // Meta só compara igualdade entre os dois lados.
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Nome do evento no GA4. O GA4 não usa os nomes do Meta; usar os dele
 * (`sign_up`, `begin_checkout`, `purchase`) é o que faz os relatórios
 * prontos de e-commerce funcionarem sem configuração manual.
 */
const NOME_GA4: Record<EventoMeta, string> = {
  ViewContent: 'view_item',
  CompleteRegistration: 'sign_up',
  Lead: 'generate_lead',
  InitiateCheckout: 'begin_checkout',
  Purchase: 'purchase',
};

export function rastrear(evento: EventoMeta, parametros: ParametrosEvento = {}): string {
  const eventId = gerarEventId();

  try {
    if (metaPixelAtivo && typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', evento, parametros, { eventID: eventId });
    }
    if (ga4Ativo && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', NOME_GA4[evento] ?? evento, parametros);
    }
  } catch (erro) {
    // Bloqueador de anúncio deixa `window.fbq` indefinido ou lança ao ser
    // chamado. É o cenário mais comum do mundo real, não um erro nosso — e
    // não pode impedir o clique que a pessoa acabou de dar.
    console.warn('Falha ao registrar evento de medição:', { evento, erro });
  }

  return eventId;
}

/** Atalhos nomeados: o call site fica legível e ninguém precisa lembrar qual
 *  nome padrão do Meta corresponde a qual momento do funil. */
export const rastrearVisitaVendas = () => rastrear(EVENTOS_META.visualizouConteudo, {
  content_name: 'Landing Nota 1000',
});

export const rastrearCadastro = (metodo: 'email' | 'google') =>
  rastrear(EVENTOS_META.completouCadastro, { method: metodo });

export const rastrearPrimeiraCorrecao = () =>
  rastrear(EVENTOS_META.usouProduto, { content_name: 'Correcao enviada' });

export const rastrearInicioCheckout = (dados: {
  planoId: string;
  valor: number;
}) =>
  rastrear(EVENTOS_META.iniciouCheckout, {
    content_ids: dados.planoId,
    content_name: dados.planoId,
    value: dados.valor,
    currency: 'BRL',
  });
