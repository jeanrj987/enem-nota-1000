import { NextRequest, NextResponse } from 'next/server';
import { corrigirRedacaoComIA } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { texto, tema, titulo, historico_aluno } = body;

    if (!texto || typeof texto !== 'string') {
      return NextResponse.json(
        { error: 'Texto da redação ausente para desbloqueio.' },
        { status: 400 }
      );
    }

    // Processa a versão 100% desbloqueada no servidor
    const correcaoDesbloqueada = await corrigirRedacaoComIA(
      texto,
      tema || 'Tema Livre',
      titulo || 'Sem título',
      historico_aluno
    );

    return NextResponse.json({
      success: true,
      correcao: correcaoDesbloqueada,
    });
  } catch (error: any) {
    console.error('Erro na rota /api/desbloquear:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar liberação.' },
      { status: 500 }
    );
  }
}
