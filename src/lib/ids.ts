/**
 * Gera um ID único no formato "prefixo_uuid" (ex: "cor_3f2a1b9c-...").
 * Usa crypto.randomUUID() — disponível tanto em Node.js quanto no navegador —
 * em vez de Math.random(), que não garante unicidade nem é apropriado para
 * identificadores.
 */
export function gerarId(prefixo: 'cor' | 'red'): string {
  return `${prefixo}_${crypto.randomUUID()}`;
}
