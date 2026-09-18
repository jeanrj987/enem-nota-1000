import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

const PIXEL = '1234567890';
const TOKEN = 'token-capi-de-teste';
process.env.META_PIXEL_ID = PIXEL;
process.env.META_CAPI_ACCESS_TOKEN = TOKEN;

interface ChamadaCapturada {
  url: string;
  corpo: {
    data: Array<{
      event_name: string;
      event_id: string;
      event_time: number;
      action_source: string;
      user_data: Record<string, unknown>;
      custom_data: Record<string, unknown>;
    }>;
    test_event_code?: string;
  };
}

const estado = {
  chamadas: [] as ChamadaCapturada[],
  responderComErro: false,
  travar: false,
};

const { enviarEventoServidor, enviarCompra, capiAtivo } = await import('@/lib/analytics/meta-capi');

beforeEach(() => {
  estado.chamadas = [];
  estado.responderComErro = false;
  estado.travar = false;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});

  vi.stubGlobal('fetch', async (url: string, init: { body: string; signal?: AbortSignal }) => {
    estado.chamadas.push({ url, corpo: JSON.parse(init.body) });

    if (estado.travar) {
      // Simula a chamada pendurada até o AbortController do timeout cortar.
      return new Promise((_resolver, rejeitar) => {
        init.signal?.addEventListener('abort', () => rejeitar(new Error('The operation was aborted.')));
      });
    }
    if (estado.responderComErro) {
      return { ok: false, status: 400, text: async () => '{"error":{"message":"Invalid parameter"}}' };
    }
    return { ok: true, status: 200, text: async () => '{"events_received":1}' };
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const eventoBase = {
  evento: 'Purchase' as const,
  eventId: 'compra_pedido_1',
  pessoa: { email: 'Maria.Silva@Exemplo.com  ' },
  valor: 97,
};

describe('meta-capi — configuração', () => {
  it('fica ativa quando pixel e token existem', () => {
    expect(capiAtivo).toBe(true);
  });
});

describe('meta-capi — formato exigido pelo Meta', () => {
  it('envia o e-mail em SHA-256, normalizado (minúsculas e sem espaços)', async () => {
    await enviarEventoServidor(eventoBase);

    const esperado = crypto.createHash('sha256').update('maria.silva@exemplo.com').digest('hex');
    expect(estado.chamadas[0].corpo.data[0].user_data.em).toEqual([esperado]);
  });

  it('NÃO hasheia fbc e fbp — são identificadores do próprio Meta', async () => {
    const fbc = 'fb.1.1700000000000.AbCdEf';
    await enviarEventoServidor({ ...eventoBase, pessoa: { ...eventoBase.pessoa, fbc, fbp: 'fb.1.2.3' } });

    const userData = estado.chamadas[0].corpo.data[0].user_data;
    // Hashear esses dois é o erro silencioso clássico: o evento é aceito e a
    // atribuição de campanha some.
    expect(userData.fbc).toBe(fbc);
    expect(userData.fbp).toBe('fb.1.2.3');
  });

  it('omite do user_data os campos que não foram informados', async () => {
    await enviarEventoServidor({ ...eventoBase, pessoa: { email: 'a@b.com' } });
    const userData = estado.chamadas[0].corpo.data[0].user_data;
    expect(userData).not.toHaveProperty('fbc');
    expect(userData).not.toHaveProperty('client_ip_address');
  });

  it('manda o event_id recebido, que é o que permite a deduplicação', async () => {
    await enviarEventoServidor(eventoBase);
    expect(estado.chamadas[0].corpo.data[0].event_id).toBe('compra_pedido_1');
    expect(estado.chamadas[0].corpo.data[0].action_source).toBe('website');
  });

  it('envia valor e moeda como custom_data', async () => {
    await enviarEventoServidor({ ...eventoBase, conteudoId: 'mensal' });
    const custom = estado.chamadas[0].corpo.data[0].custom_data;
    expect(custom.value).toBe(97);
    expect(custom.currency).toBe('BRL');
    expect(custom.content_ids).toEqual(['mensal']);
  });

  it('não vaza o token de acesso no corpo (ele vai na query string)', async () => {
    await enviarEventoServidor(eventoBase);
    expect(JSON.stringify(estado.chamadas[0].corpo)).not.toContain(TOKEN);
    expect(estado.chamadas[0].url).toContain(`/${PIXEL}/events`);
  });
});

describe('meta-capi — resiliência (medição nunca derruba a venda)', () => {
  it('devolve erro sem lançar quando o Meta recusa o evento', async () => {
    estado.responderComErro = true;
    const resultado = await enviarEventoServidor(eventoBase);
    expect(resultado.enviado).toBe(false);
    expect(resultado.erro).toBe('HTTP 400');
  });

  it('devolve erro sem lançar quando a rede falha', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('ECONNREFUSED');
    });
    const resultado = await enviarEventoServidor(eventoBase);
    expect(resultado.enviado).toBe(false);
    expect(resultado.erro).toContain('ECONNREFUSED');
  });

  it('aborta por timeout em vez de pendurar o webhook indefinidamente', async () => {
    estado.travar = true;
    const resultado = await enviarEventoServidor(eventoBase);
    expect(resultado.enviado).toBe(false);
  }, 10000);
});

describe('enviarCompra', () => {
  it('monta um evento Purchase completo', async () => {
    await enviarCompra({
      eventId: 'compra_abc',
      pessoa: { email: 'x@y.com', fbc: 'fb.1.9.z' },
      valor: 147,
      planoId: 'unico',
    });

    const evento = estado.chamadas[0].corpo.data[0];
    expect(evento.event_name).toBe('Purchase');
    expect(evento.event_id).toBe('compra_abc');
    expect(evento.custom_data.value).toBe(147);
    expect(evento.custom_data.content_ids).toEqual(['unico']);
  });
});
