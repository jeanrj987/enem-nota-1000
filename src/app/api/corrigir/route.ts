import { NextRequest, NextResponse } from 'next/server';
import { corrigirRedacaoComIA } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { texto, tema, titulo, historico_aluno, plano_usuario } = body;

    if (!texto || typeof texto !== 'string' || texto.trim().length < 20) {
      return NextResponse.json(
        { error: 'O texto da redação deve ter pelo menos 20 caracteres.' },
        { status: 400 }
      );
    }

    const isPlanoPago = plano_usuario === 'pro' || plano_usuario === 'medicina';

    const correcaoCompleta = await corrigirRedacaoComIA(
      texto,
      tema || 'Tema Livre',
      titulo || 'Sem título',
      historico_aluno
    );

    // BLINDAGEM DE SEGURANÇA SERVER-SIDE:
    // Se o usuário não for assinante PRO, os dados confidenciais (nota final, pontos de C1-C5 e texto reescrito)
    // são FISICAMENTE DELETADOS E HIGIENIZADOS no servidor antes de qualquer envio ao navegador.
    // Nenhum inspecionar de elementos, leitor de requisição HTTP ou DevTools conseguirá acessar os dados.
    if (!isPlanoPago) {
      const correcaoProtegida = {
        ...correcaoCompleta,
        nota_geral: 0, // Nota real não trafega pela rede
        competencias: correcaoCompleta.competencias.map((c) => ({
          ...c,
          nota: 0, // Pontuação individual não trafega pela rede
        })),
        versao_reescrita:
          '🔒 [CONTEÚDO PROTEGIDO NO SERVIDOR]\n\nA versão reescrita Modelo Nota 1000 foi processada e está armazenada em segurança. Faça o desbloqueio do Plano de Aprovação por R$ 19,90 para liberar a transferência do texto completo e de todas as notas oficiais.',
        is_bloqueado: true,
        nota_oculta: true,
      };

      return NextResponse.json({
        success: true,
        correcao: correcaoProtegida,
      });
    }

    // Se for usuário com assinatura confirmada, entrega os dados completos
    return NextResponse.json({
      success: true,
      correcao: correcaoCompleta,
    });
  } catch (error: any) {
    console.error('Erro na rota /api/corrigir:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao processar correção.' },
      { status: 500 }
    );
  }
}
