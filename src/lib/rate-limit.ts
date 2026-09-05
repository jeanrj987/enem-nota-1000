/**
 * Rate limiting em memória, por IP, janela fixa. Suficiente para uma
 * instância única/warm (dev, ou Vercel com poucas invocações concorrentes);
 * não é compartilhado entre instâncias serverless frias — para limitar de
 * forma consistente sob escala real, trocar por um store compartilhado
 * (ex: Upstash Redis). Documentado como limitação conhecida.
 */

interface Contador {
  count: number;
  inicioJanela: number;
}

const contadores = new Map<string, Contador>();

// Evita crescimento ilimitado do Map em processos de longa duração.
const LIMITE_ENTRADAS = 5000;

export interface RateLimitResultado {
  permitido: boolean;
  restantes: number;
  resetEm: number; // epoch ms
}

export function checarRateLimit(
  identificador: string,
  limite: number,
  janelaMs: number
): RateLimitResultado {
  const agora = Date.now();
  const atual = contadores.get(identificador);

  if (!atual || agora - atual.inicioJanela >= janelaMs) {
    if (contadores.size >= LIMITE_ENTRADAS) contadores.clear();
    contadores.set(identificador, { count: 1, inicioJanela: agora });
    return { permitido: true, restantes: limite - 1, resetEm: agora + janelaMs };
  }

  if (atual.count >= limite) {
    return { permitido: false, restantes: 0, resetEm: atual.inicioJanela + janelaMs };
  }

  atual.count += 1;
  return { permitido: true, restantes: limite - atual.count, resetEm: atual.inicioJanela + janelaMs };
}

export function obterIpCliente(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'desconhecido';
}
