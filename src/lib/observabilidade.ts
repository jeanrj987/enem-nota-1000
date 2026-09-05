/**
 * Log estruturado (JSON de uma linha) para a pipeline de correção. Sem
 * dependência de serviço externo: em produção (Vercel ou qualquer host que
 * capture stdout) essas linhas já ficam disponíveis para busca/agregação por
 * campo, ao contrário do console.warn/error de texto livre usado antes.
 */

type EventoObservabilidade =
  | {
      evento: 'tentativa_provedor';
      provedor: 'gemini' | 'openai';
      tentativa: number;
      sucesso: boolean;
      duracao_ms: number;
      motivo_falha?: string;
    }
  | {
      evento: 'correcao_concluida';
      nota_geral: number;
      anulada: boolean;
      duracao_total_ms: number;
      correcoes_usadas: number;
      divergencia?: number;
      reconciliada: boolean;
    }
  | {
      evento: 'correcao_falhou';
      duracao_total_ms: number;
      motivo: string;
    };

export function logCorrecao(dados: EventoObservabilidade): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...dados }));
}
