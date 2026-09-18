import crypto from 'crypto';
import { EVENTOS_META, EventoMeta } from './config';

/**
 * Meta Conversions API — envio de evento pelo SERVIDOR.
 *
 * Por que a compra precisa sair daqui e não do navegador: o checkout roda em
 * `pay.kiwify.com.br`, então nenhum script nosso está presente quando o
 * pagamento é aprovado. Mesmo que estivesse, bloqueador de anúncio e as
 * restrições de cookie de terceiros do Safari/iOS derrubam uma fatia grande
 * dos eventos de navegador — e essa fatia não é aleatória, é concentrada
 * justamente em quem compra pelo celular.
 *
 * O resultado prático de não ter isto: o Meta enxerga cliques e visitas mas
 * quase nenhuma venda, não consegue otimizar por "Compra", e o custo por
 * aquisição no painel fica alto demais (vendas reais não atribuídas) ou
 * simplesmente vazio.
 */

const PIXEL_ID = process.env.META_PIXEL_ID?.trim() || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || '';
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN?.trim() || '';

/**
 * Código de teste do "Testar eventos" do Gerenciador de Eventos. Quando
 * presente, os eventos aparecem na aba de teste e NÃO contam como conversão
 * real. Deve ficar vazio em produção.
 */
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE?.trim() || '';

/**
 * Versão da Graph API. Configurável porque o Meta aposenta versões a cada
 * ~2 anos e uma versão vencida faz a chamada falhar inteira.
 * CONFERIR no Gerenciador de Eventos ao configurar, e atualizar aqui.
 */
const VERSAO_API = process.env.META_GRAPH_API_VERSION?.trim() || 'v23.0';

const TIMEOUT_MS = 5000;

export const capiAtivo = Boolean(PIXEL_ID && ACCESS_TOKEN);

/**
 * O Meta exige dado pessoal em SHA-256, normalizado antes: minúsculas e sem
 * espaços nas pontas. Sem normalizar, o mesmo e-mail escrito de duas formas
 * vira dois hashes diferentes e a correspondência com o usuário do Facebook
 * falha — o evento chega, mas sem conseguir atribuir a ninguém.
 */
function hash(valor: string): string {
  return crypto.createHash('sha256').update(valor.trim().toLowerCase()).digest('hex');
}

export interface DadosPessoaEvento {
  email?: string | null;
  /** Cookie `_fbc` — liga a conversão ao clique no anúncio. É o campo que
   *  mais pesa na precisão do custo por aquisição. */
  fbc?: string | null;
  /** Cookie `_fbp` — identificador do navegador. */
  fbp?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface EventoServidor {
  evento: EventoMeta;
  /** Mesmo id usado no navegador, quando o evento sai dos dois lados. É o
   *  que evita a conversão ser contada em dobro. */
  eventId: string;
  pessoa: DadosPessoaEvento;
  valor?: number;
  moeda?: string;
  conteudoId?: string;
  /** Unix em segundos. O Meta aceita até 7 dias no passado. */
  ocorridoEm?: number;
}

function montarUserData(pessoa: DadosPessoaEvento): Record<string, string | string[]> {
  const userData: Record<string, string | string[]> = {};
  // `em` é array por exigência do formato da API, mesmo com um e-mail só.
  if (pessoa.email) userData.em = [hash(pessoa.email)];
  // `fbc`/`fbp` NÃO são hasheados: são identificadores do próprio Meta, não
  // dado pessoal. Hashear aqui é o erro silencioso mais comum da integração
  // — o evento é aceito e a atribuição some.
  if (pessoa.fbc) userData.fbc = pessoa.fbc;
  if (pessoa.fbp) userData.fbp = pessoa.fbp;
  if (pessoa.ip) userData.client_ip_address = pessoa.ip;
  if (pessoa.userAgent) userData.client_user_agent = pessoa.userAgent;
  return userData;
}

/**
 * Envia um evento e devolve se foi aceito. Nunca lança: medição não pode
 * derrubar o fluxo que a chamou — no caso do `Purchase`, o chamador é o
 * webhook que acabou de liberar o acesso de alguém que pagou.
 */
export async function enviarEventoServidor(dados: EventoServidor): Promise<{ enviado: boolean; erro?: string }> {
  if (!capiAtivo) return { enviado: false, erro: 'Conversions API não configurada.' };

  const corpo = {
    data: [
      {
        event_name: dados.evento,
        event_time: dados.ocorridoEm ?? Math.floor(Date.now() / 1000),
        event_id: dados.eventId,
        action_source: 'website',
        user_data: montarUserData(dados.pessoa),
        custom_data: {
          ...(dados.valor !== undefined ? { value: dados.valor } : {}),
          currency: dados.moeda ?? 'BRL',
          ...(dados.conteudoId ? { content_ids: [dados.conteudoId] } : {}),
        },
      },
    ],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  };

  const controle = new AbortController();
  const expirar = setTimeout(() => controle.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(
      `https://graph.facebook.com/${VERSAO_API}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
        signal: controle.signal,
      }
    );

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      // Logado com o nome do evento e o id: é o que permite reenviar na mão
      // pelo Gerenciador de Eventos se uma venda ficar sem atribuição.
      console.error('Conversions API recusou o evento:', {
        evento: dados.evento,
        event_id: dados.eventId,
        status: resposta.status,
        detalhe: detalhe.slice(0, 500),
      });
      return { enviado: false, erro: `HTTP ${resposta.status}` };
    }

    console.log(
      JSON.stringify({ evento: 'capi_enviado', nome: dados.evento, event_id: dados.eventId })
    );
    return { enviado: true };
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : String(erro);
    console.error('Falha ao chamar a Conversions API:', {
      evento: dados.evento,
      event_id: dados.eventId,
      motivo,
    });
    return { enviado: false, erro: motivo };
  } finally {
    clearTimeout(expirar);
  }
}

/** Atalho para a única conversão que importa para a otimização de campanha. */
export function enviarCompra(params: {
  eventId: string;
  pessoa: DadosPessoaEvento;
  valor: number;
  planoId: string;
}) {
  return enviarEventoServidor({
    evento: EVENTOS_META.comprou,
    eventId: params.eventId,
    pessoa: params.pessoa,
    valor: params.valor,
    conteudoId: params.planoId,
  });
}
