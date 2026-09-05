import { NextRequest, NextResponse } from 'next/server';
import { corrigirRedacaoComDuplaCorrecao } from '@/lib/openai';
import { checarRateLimit, obterIpCliente } from '@/lib/rate-limit';

// Redação ENEM real tem no máximo 30 linhas — 8000 caracteres é uma margem
// generosa para não barrar texto legítimo, mas evita abuso de custo com
// textos gigantes (cada caractere entra 2-3x no prompt por causa da dupla
// correção/arbitragem).
const MAX_CARACTERES_TEXTO = 8000;

// Cada correção dispara 2-3 chamadas de LLM — limite conservador por IP.
const LIMITE_REQUISICOES = 5;
const JANELA_MS = 10 * 60 * 1000; // 10 minutos

export async function POST(req: NextRequest) {
  const ip = obterIpCliente(req);
  const rate = checarRateLimit(`corrigir:${ip}`, LIMITE_REQUISICOES, JANELA_MS);

  if (!rate.permitido) {
    return NextResponse.json(
      {
        error: `Limite de correções atingido. Tente novamente em ${Math.ceil(
          (rate.resetEm - Date.now()) / 1000 / 60
        )} minuto(s).`,
      },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.resetEm - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const { texto, tema, titulo } = body;

    if (!texto || typeof texto !== 'string' || texto.trim().length < 20) {
      return NextResponse.json(
        { error: 'O texto da redação deve ter pelo menos 20 caracteres.' },
        { status: 400 }
      );
    }

    if (texto.length > MAX_CARACTERES_TEXTO) {
      return NextResponse.json(
        {
          error: `O texto excede o limite de ${MAX_CARACTERES_TEXTO} caracteres (uma redação ENEM tem no máximo ~30 linhas).`,
        },
        { status: 413 }
      );
    }

    const correcao = await corrigirRedacaoComDuplaCorrecao(
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
