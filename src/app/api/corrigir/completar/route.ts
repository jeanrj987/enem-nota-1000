import { NextRequest, NextResponse } from 'next/server';
import { completarParaDuplaCorrecao } from '@/lib/openai';
import { checarRateLimit } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { assinaturaAtivaDoUsuario } from '@/lib/assinatura-servidor';
import { Correcao } from '@/types';

/**
 * Completa para dupla correção uma redação que foi corrigida no acesso
 * gratuito (uma passagem só, para não pagar o produto inteiro por quem ainda
 * não comprou). Chamada quando o dono passa a ter assinatura ativa, de modo
 * que ele receba exatamente o mesmo resultado que teria se já fosse assinante
 * ao enviar o texto.
 *
 * É idempotente: uma correção que já é dupla volta como está, sem gastar
 * chamada de LLM. Isso importa porque a tela chama esta rota sozinha ao abrir.
 */
const LIMITE_REQUISICOES = 10;
const JANELA_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'É necessário estar logado.' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Autenticação não está configurada.' }, { status: 503 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Sessão inválida. Faça login novamente.' }, { status: 401 });
  }
  const userId = userData.user.id;

  const rate = checarRateLimit(`completar:${userId}`, LIMITE_REQUISICOES, JANELA_MS);
  if (!rate.permitido) {
    return NextResponse.json(
      { error: 'Muitas solicitações. Tente novamente em alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.resetEm - Date.now()) / 1000)) } }
    );
  }

  // A dupla correção é o que se paga: sem plano ativo, não há o que completar.
  const assinante = await assinaturaAtivaDoUsuario(userId);
  if (!assinante) {
    return NextResponse.json({ error: 'Esta ação exige um plano ativo.' }, { status: 402 });
  }

  let redacaoId: string;
  try {
    const body = await req.json();
    redacaoId = body?.redacaoId;
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
  }
  if (!redacaoId || typeof redacaoId !== 'string') {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
  }

  // O filtro por user_id é a barreira de posse: mesmo com service role, só a
  // redação do próprio solicitante é alcançável.
  const { data: redacao, error: erroRedacao } = await supabaseAdmin
    .from('redacoes')
    .select('id, texto, tema, titulo')
    .eq('id', redacaoId)
    .eq('user_id', userId)
    .maybeSingle();

  if (erroRedacao || !redacao) {
    return NextResponse.json({ error: 'Redação não encontrada.' }, { status: 404 });
  }

  const { data: linhaCorrecao, error: erroCorrecao } = await supabaseAdmin
    .from('correcoes')
    .select('dados')
    .eq('redacao_id', redacaoId)
    .eq('user_id', userId)
    .maybeSingle();

  if (erroCorrecao || !linhaCorrecao) {
    return NextResponse.json({ error: 'Correção não encontrada.' }, { status: 404 });
  }

  const correcaoAtual = linhaCorrecao.dados as Correcao;
  const precisaCompletar =
    correcaoAtual.reconciliacao?.correcaoUnica === true &&
    correcaoAtual.reconciliacao?.motivoCorrecaoUnica === 'acesso-gratuito';

  // Já está dupla, ou nasceu única porque a segunda passagem falhou de fato —
  // nos dois casos não há nada a fazer, e refazer só queimaria cota.
  if (!precisaCompletar) {
    return NextResponse.json({ success: true, completada: false, correcao: correcaoAtual });
  }

  try {
    const completa = await completarParaDuplaCorrecao(
      correcaoAtual,
      redacao.texto,
      redacao.tema,
      redacao.titulo
    );

    const { error: erroUpdate } = await supabaseAdmin
      .from('correcoes')
      .update({ dados: completa })
      .eq('redacao_id', redacaoId)
      .eq('user_id', userId);

    if (erroUpdate) {
      console.error('Erro ao gravar correção completada:', erroUpdate);
      // A correção existente continua válida; devolvê-la é melhor do que
      // falhar a tela por causa de uma melhoria que não pôde ser gravada.
      return NextResponse.json({ success: true, completada: false, correcao: correcaoAtual });
    }

    // O total de erros pode ter mudado com a reconciliação; o chamariz precisa
    // acompanhar, senão o histórico mostra um número e a correção, outro.
    await supabaseAdmin
      .from('redacoes')
      .update({ total_erros: completa.erros.length, anulada: completa.anulada })
      .eq('id', redacaoId)
      .eq('user_id', userId);

    return NextResponse.json({ success: true, completada: true, correcao: completa });
  } catch (error) {
    console.error('Falha ao completar a correção:', error);
    // Devolve o que já existe em vez de erro: o aluno tem uma correção real e
    // válida, só não reconciliada. Fingir que não há nada seria pior.
    return NextResponse.json({ success: true, completada: false, correcao: correcaoAtual });
  }
}
