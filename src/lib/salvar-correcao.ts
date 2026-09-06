import { supabaseAdmin } from '@/lib/supabase-admin';
import { ChamarizCorrecao, Correcao } from '@/types';

function contarPalavras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

function contarLinhas(texto: string): number {
  const linhas = texto.split('\n').filter((l) => l.trim().length > 0).length;
  return linhas || Math.ceil(contarPalavras(texto) / 10);
}

/**
 * Grava a redação e sua correção com service role. Fica no servidor de
 * propósito: a correção completa nunca passa pelo navegador de quem não tem
 * assinatura, e o cliente também não pode forjar/alterar o próprio
 * diagnóstico. Os campos de chamariz (total de erros, anulada) ficam na
 * tabela `redacoes`, legível pelo dono mesmo sem pagar.
 */
export async function salvarCorrecao(params: {
  redacaoId: string;
  userId: string;
  texto: string;
  tema: string;
  titulo: string;
  correcao: Correcao;
  chamariz: ChamarizCorrecao;
}): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const { error: erroRedacao } = await supabaseAdmin.from('redacoes').insert({
    id: params.redacaoId,
    user_id: params.userId,
    titulo: params.titulo,
    tema: params.tema,
    texto: params.texto,
    palavras_count: contarPalavras(params.texto),
    linhas_count: contarLinhas(params.texto),
    status: 'corrigida',
    total_erros: params.chamariz.total_erros,
    anulada: params.chamariz.anulada,
    created_at: new Date().toISOString(),
  });

  if (erroRedacao) {
    console.error('Erro ao salvar redação:', erroRedacao);
    return false;
  }

  const { error: erroCorrecao } = await supabaseAdmin.from('correcoes').insert({
    redacao_id: params.redacaoId,
    user_id: params.userId,
    dados: params.correcao,
  });

  if (erroCorrecao) {
    console.error('Erro ao salvar correção:', erroCorrecao);
    return false;
  }

  return true;
}
