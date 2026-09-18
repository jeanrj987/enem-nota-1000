import { NextRequest, NextResponse } from 'next/server';
import { corrigirRedacaoComDuplaCorrecao, corrigirRedacaoSimples } from '@/lib/openai';
import { checarRateLimit, obterIpCliente } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { assinaturaAtivaDoUsuario, contarCorrecoesDoUsuario } from '@/lib/assinatura-servidor';
import { LIMITE_CORRECOES_GRATUITAS, textoCorrecoesGratuitas } from '@/lib/limites';
import { salvarCorrecao } from '@/lib/salvar-correcao';
import { gerarId } from '@/lib/ids';

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
  const rate = await checarRateLimit(`corrigir:${ip}`, LIMITE_REQUISICOES, JANELA_MS);

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

  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'É necessário estar logado para corrigir uma redação.' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Autenticação não está configurada.' }, { status: 503 });
  }
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Sessão inválida. Faça login novamente.' }, { status: 401 });
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

    const temaFinal = tema || 'Tema Livre';
    const tituloFinal = (titulo || '').trim() || `Redação sobre ${temaFinal.slice(0, 30)}`;

    // A assinatura é consultada ANTES de corrigir, não depois: quem não pagou
    // vê apenas o número de desvios, então rodar duas correções e uma
    // arbitragem para exibir um cadeado é pagar o produto inteiro por nada.
    // A correção única fica marcada e é completada para dupla no momento em
    // que a pessoa assina — ninguém recebe menos do que pagou.
    const assinante = await assinaturaAtivaDoUsuario(userData.user.id);

    // Teto de correções gratuitas: o rate limit acima é só uma janela
    // deslizante, não impede corrigir indefinidamente ao longo do tempo.
    // Sem esse teto, o freemium não tem limite real de custo por conta.
    if (!assinante) {
      const totalCorrecoes = await contarCorrecoesDoUsuario(userData.user.id);
      if (totalCorrecoes >= LIMITE_CORRECOES_GRATUITAS) {
        return NextResponse.json(
          {
            error: `Você já usou ${textoCorrecoesGratuitas()}. Assine um plano para continuar corrigindo redações.`,
          },
          { status: 403 }
        );
      }
    }

    const correcao = assinante
      ? await corrigirRedacaoComDuplaCorrecao(texto, temaFinal, tituloFinal)
      : await corrigirRedacaoSimples(texto, temaFinal, tituloFinal);

    // A persistência acontece aqui, e não no cliente: é o que permite guardar
    // a correção completa mesmo para quem não pagou (ela fica esperando a
    // assinatura) sem nunca entregá-la ao navegador.
    const redacaoId = gerarId('red');
    const chamariz = {
      total_erros: correcao.erros.length,
      anulada: correcao.anulada,
    };

    const persistiu = await salvarCorrecao({
      redacaoId,
      userId: userData.user.id,
      texto,
      tema: temaFinal,
      titulo: tituloFinal,
      correcao,
      chamariz,
    });

    if (!persistiu) {
      return NextResponse.json(
        { error: 'Corrigimos sua redação, mas não conseguimos salvá-la. Tente novamente.' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      redacaoId,
      ...(assinante ? { correcao } : { chamariz }),
    });
  } catch (error) {
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
