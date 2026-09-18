import { Redis } from '@upstash/redis';

/**
 * Rate limiting por IP/identificador, janela fixa.
 *
 * Com `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` configurados, o
 * contador vive no Redis — compartilhado entre todas as instâncias
 * serverless, o que o Map em memória local nunca conseguiria (cada instância
 * fria tinha o próprio contador zerado, então o limite real era N vezes o
 * configurado, N = número de instâncias concorrentes).
 *
 * Sem as variáveis configuradas (dev local sem `.env.local` preenchido, ou
 * falha de rede pontual do Redis), cai para o Map em memória — pior do que
 * o limite real sob múltiplas instâncias, mas nunca bloqueia a aplicação
 * inteira por causa de um rate limiter fora do ar.
 */

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

interface Contador {
  count: number;
  inicioJanela: number;
}

const contadoresEmMemoria = new Map<string, Contador>();

// Evita crescimento ilimitado do Map em processos de longa duração.
const LIMITE_ENTRADAS = 5000;

export interface RateLimitResultado {
  permitido: boolean;
  restantes: number;
  resetEm: number; // epoch ms
}

function checarRateLimitEmMemoria(
  identificador: string,
  limite: number,
  janelaMs: number
): RateLimitResultado {
  const agora = Date.now();
  const atual = contadoresEmMemoria.get(identificador);

  if (!atual || agora - atual.inicioJanela >= janelaMs) {
    if (contadoresEmMemoria.size >= LIMITE_ENTRADAS) contadoresEmMemoria.clear();
    contadoresEmMemoria.set(identificador, { count: 1, inicioJanela: agora });
    return { permitido: true, restantes: limite - 1, resetEm: agora + janelaMs };
  }

  if (atual.count >= limite) {
    return { permitido: false, restantes: 0, resetEm: atual.inicioJanela + janelaMs };
  }

  atual.count += 1;
  return { permitido: true, restantes: limite - atual.count, resetEm: atual.inicioJanela + janelaMs };
}

async function checarRateLimitNoRedis(
  identificador: string,
  limite: number,
  janelaMs: number
): Promise<RateLimitResultado> {
  const chave = `rate-limit:${identificador}`;
  const agora = Date.now();

  // INCR + EXPIRE (só na primeira requisição da janela) é o padrão de janela
  // fixa recomendado pela própria Upstash: atômico o bastante para este uso
  // (perder uma requisição por corrida de borda de janela é aceitável; nunca
  // deixar passar mais que o limite não é garantido por esse padrão, mas o
  // objetivo aqui é conter abuso de custo, não uma trava perfeita).
  const count = await redis!.incr(chave);
  if (count === 1) {
    await redis!.pexpire(chave, janelaMs);
  }

  if (count > limite) {
    const ttl = await redis!.pttl(chave);
    const resetEm = agora + (ttl > 0 ? ttl : janelaMs);
    return { permitido: false, restantes: 0, resetEm };
  }

  const ttl = await redis!.pttl(chave);
  const resetEm = agora + (ttl > 0 ? ttl : janelaMs);
  return { permitido: true, restantes: limite - count, resetEm };
}

export async function checarRateLimit(
  identificador: string,
  limite: number,
  janelaMs: number
): Promise<RateLimitResultado> {
  if (!redis) {
    return checarRateLimitEmMemoria(identificador, limite, janelaMs);
  }

  try {
    return await checarRateLimitNoRedis(identificador, limite, janelaMs);
  } catch (error) {
    console.error('Rate limit no Redis falhou, caindo para memória local:', error);
    return checarRateLimitEmMemoria(identificador, limite, janelaMs);
  }
}

export function obterIpCliente(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'desconhecido';
}
