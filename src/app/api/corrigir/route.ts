import { NextRequest, NextResponse } from 'next/server';
import { corrigirRedacaoComIA } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { texto, tema, titulo } = body;

    if (!texto || typeof texto !== 'string' || texto.trim().length < 20) {
      return NextResponse.json(
        { error: 'O texto da redação deve ter pelo menos 20 caracteres.' },
        { status: 400 }
      );
    }

    const correcao = await corrigirRedacaoComIA(
      texto,
      tema || 'Tema Livre',
      titulo || 'Sem título'
    );

    return NextResponse.json({
      success: true,
      correcao,
    });
  } catch (error: any) {
    console.error('Erro na rota /api/corrigir:', error);
    return NextResponse.json(
      {
        error:
          'Não conseguimos corrigir sua redação agora. Seu texto não foi perdido — tente novamente em instantes.',
      },
      { status: 503 }
    );
  }
}
