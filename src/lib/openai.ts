import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { Correcao, ErroIdentificado } from '@/types';
import { SYSTEM_PROMPT_ENEM } from './prompt-agente';
import { contarParagrafos, montarCorrecao, validarCorrecaoIA } from './correcao-schema';
import { LIMIAR_DIVERGENCIA, reconciliarCorrecoes } from './reconciliacao';
import { gerarId } from './ids';

export async function corrigirRedacaoComIA(
  texto: string,
  tema: string = 'Tema Livre',
  titulo: string = 'Sem título'
): Promise<Correcao> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const paragrafos = contarParagrafos(texto);

  const userPrompt = `Corrija a seguinte redação com base nos critérios rigorosos oficiais do ENEM:

TEMA DA REDAÇÃO: "${tema}"
TÍTULO: "${titulo}"

FATO ESTRUTURAL (não inferir, usar exatamente este número): o texto abaixo tem ${paragrafos} parágrafo(s) real(is), contando quebras de linha efetivas no texto entregue pelo aluno.${paragrafos <= 1 ? ' Isso significa que o texto está em BLOCO ÚNICO (monobloco) — NÃO descreva divisão em parágrafos de desenvolvimento (D1, D2 etc.) que não existe, e lembre-se do teto de 80 pontos em C2 para monobloco.' : ''}

TEXTO DA REDAÇÃO:
"""
${texto}
"""`;

  // 1. Google Gemini 3.6 Flash com sistema de retry automático para picos de demanda (503)
  //    e para respostas que não passam na validação do schema.
  if (geminiApiKey && geminiApiKey.trim() !== '' && geminiApiKey !== 'sua-chave-gemini-aqui') {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [
            { role: 'user', parts: [{ text: `${SYSTEM_PROMPT_ENEM}\n\n${userPrompt}` }] }
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          }
        });

        const duration = Date.now() - startTime;
        const textOutput = response.text;

        if (textOutput) {
          const raw = JSON.parse(textOutput);
          const validacao = validarCorrecaoIA(raw, texto);

          if (validacao.success) {
            if (validacao.avisos.length > 0) {
              console.warn('Avisos de validação (Gemini):', validacao.avisos);
            }
            return montarCorrecao(validacao.data, duration);
          }

          console.warn(`Tentativa ${attempt} no Gemini falhou validação: ${validacao.error}`);
        }
      } catch (geminiError: any) {
        console.warn(`Tentativa ${attempt} no Gemini falhou (${geminiError?.message?.slice(0, 80)}).`);
      }

      if (attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, 1200 * attempt));
      }
    }
  }

  // 2. OpenAI gpt-4o-mini, com uma segunda tentativa em caso de falha de validação
  if (openaiApiKey && openaiApiKey.trim() !== '' && openaiApiKey !== 'your-openai-api-key') {
    const openai = new OpenAI({ apiKey: openaiApiKey });
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT_ENEM },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 3000,
        });

        const duration = Date.now() - startTime;
        const content = response.choices[0]?.message?.content;

        if (content) {
          const raw = JSON.parse(content);
          const validacao = validarCorrecaoIA(raw, texto);

          if (validacao.success) {
            if (validacao.avisos.length > 0) {
              console.warn('Avisos de validação (OpenAI):', validacao.avisos);
            }
            return montarCorrecao(validacao.data, duration);
          }

          console.warn(`Tentativa ${attempt} na OpenAI falhou validação: ${validacao.error}`);
        }
      } catch (openaiError: any) {
        console.error(`Tentativa ${attempt} na OpenAI falhou:`, openaiError?.message || openaiError);
      }
    }
  }

  if (!geminiApiKey && !openaiApiKey) {
    throw new Error(
      'Nenhum provedor de IA está configurado (GEMINI_API_KEY / OPENAI_API_KEY ausentes).'
    );
  }

  throw new Error(
    'Não foi possível corrigir a redação no momento. Todos os provedores de IA falharam ou estão indisponíveis.'
  );
}

/**
 * Réplica do protocolo oficial do ENEM: duas correções independentes da mesma
 * redação. Se divergirem mais que LIMIAR_DIVERGENCIA pontos na nota geral, uma
 * terceira correção é acionada para arbitrar, e a nota final usa o par mais
 * próximo entre as três. Custa 2x (ou 3x, em caso de divergência) o preço e o
 * tempo de uma correção única — é a troca deliberada entre custo/latência e
 * consistência, motivada por termos medido variação real de até 120 pontos
 * entre execuções da mesma redação.
 *
 * Se uma das duas chamadas falhar (provedor indisponível) mas a outra
 * suceder, a correção que teve sucesso é usada sozinha — nunca fabricamos uma
 * segunda opinião falsa só para completar o par.
 */
export async function corrigirRedacaoComDuplaCorrecao(
  texto: string,
  tema: string = 'Tema Livre',
  titulo: string = 'Sem título'
): Promise<Correcao> {
  const [resultado1, resultado2] = await Promise.allSettled([
    corrigirRedacaoComIA(texto, tema, titulo),
    corrigirRedacaoComIA(texto, tema, titulo),
  ]);

  const sucesso1 = resultado1.status === 'fulfilled' ? resultado1.value : null;
  const sucesso2 = resultado2.status === 'fulfilled' ? resultado2.value : null;

  if (resultado1.status === 'rejected' && resultado2.status === 'rejected') {
    // Ambas falharam: propaga o erro da primeira, mantendo a mensagem honesta do R1.
    throw resultado1.reason;
  }

  if (sucesso1 && !sucesso2) return reconciliarCorrecoes([sucesso1]);
  if (!sucesso1 && sucesso2) return reconciliarCorrecoes([sucesso2]);

  const [c1, c2] = [sucesso1!, sucesso2!];
  const divergencia = Math.abs(c1.nota_geral - c2.nota_geral);

  if (divergencia <= LIMIAR_DIVERGENCIA) {
    return reconciliarCorrecoes([c1, c2]);
  }

  // Divergência alta: aciona uma terceira correção de arbitragem.
  try {
    const c3 = await corrigirRedacaoComIA(texto, tema, titulo);
    return reconciliarCorrecoes([c1, c2, c3]);
  } catch {
    // Terceira correção falhou (ex: cota esgotada) — reconcilia com as duas
    // que já temos, mesmo divergentes, em vez de falhar a correção inteira.
    return reconciliarCorrecoes([c1, c2]);
  }
}

// Fixture para testes locais/offline. Não é chamada pelo caminho de produção:
// corrigirRedacaoComIA nunca deve devolver uma correção que não veio de um modelo real.
export function gerarCorrecaoMock(
  texto: string,
  tema: string = 'Tema Livre',
  titulo: string = 'Sem título'
): Correcao {
  const words = texto.trim().split(/\s+/).filter(Boolean);
  const paragraphs = texto.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const lowerText = texto.toLowerCase();

  // Detecção de marcas de oralidade e desvios graves
  const marcasOralidade = ['pra', 'pro', 'ai', 'a gente', 'muita gente', 'coisa', 'ne', 'ta', 'num', 'podia ter'];
  const ocorrenciasOralidade = marcasOralidade.filter(m => new RegExp(`\\b${m}\\b`, 'i').test(lowerText)).length;

  const errosGramaticais = [
    { regex: /\b(as|essas|suas)\s+pessoa\b/i, trecho: 'essas pessoa', correcao: 'essas pessoas', tipo: 'concordancia' as const, exp: 'Concordância nominal incorreta: o substantivo deve flexionar no plural acompanhando o pronome.' },
    { regex: /\bmuitas pessoas nasce\b/i, trecho: 'muitas pessoas nasce', correcao: 'muitas pessoas nascem', tipo: 'concordancia' as const, exp: 'Concordância verbal incorreta: o verbo deve concordar em número com o sujeito no plural.' },
    { regex: /\bsem estuda\b/i, trecho: 'sem estuda', correcao: 'sem estudar', tipo: 'ortografia' as const, exp: 'Omissão da terminação de infinitivo verbal (-r).' },
    { regex: /\bsem sai\b/i, trecho: 'sem sai', correcao: 'sem sair', tipo: 'ortografia' as const, exp: 'Omissão da desinência de infinitivo (-r).' },
    { regex: /\bpode vota\b/i, trecho: 'pode vota', correcao: 'pode votar', tipo: 'ortografia' as const, exp: 'Forma verbal no infinitivo exige a desinência "-r".' },
    { regex: /\bvai fica\b/i, trecho: 'vai fica', correcao: 'vai ficar', tipo: 'ortografia' as const, exp: 'Locução verbal com infinitivo terminado em "-r".' },
    { regex: /\bos documento\b/i, trecho: 'os documento', correcao: 'os documentos', tipo: 'concordancia' as const, exp: 'Falta de desinência de plural no substantivo.' },
    { regex: /\bos brasileiro\b/i, trecho: 'os brasileiro', correcao: 'os brasileiros', tipo: 'concordancia' as const, exp: 'Substantivo masculino plural deve concordar com o artigo definido.' },
    { regex: /\bdevia leva\b/i, trecho: 'devia leva', correcao: 'deveria levar', tipo: 'gramatica' as const, exp: 'Prefira o futuro do pretérito "deveria levar" e utilize a terminação de infinitivo.' },
    { regex: /\bpra\b/i, trecho: 'pra', correcao: 'para', tipo: 'vocabulario' as const, exp: 'A forma reduzida "pra" é uma marca de oralidade inadequada à modalidade formal escrita.' },
    { regex: /\bpro\b/i, trecho: 'pro', correcao: 'para o', tipo: 'vocabulario' as const, exp: 'Substitua a contração informal "pro" por "para o".' },
    { regex: /\bai\b/i, trecho: 'ai', correcao: 'consequentemente / nesse contexto', tipo: 'coesao' as const, exp: 'O termo "ai" é marcador conversacional oral. Use conectivos formais.' },
  ];

  const erros: ErroIdentificado[] = [];
  let desviosCount = 0;

  errosGramaticais.forEach((item, idx) => {
    if (item.regex.test(texto)) {
      desviosCount++;
      const match = texto.match(item.regex);
      erros.push({
        id: `err_${idx + 1}`,
        trecho: match ? match[0] : item.trecho,
        tipo: item.tipo,
        correcao: item.correcao,
        explicacao: item.exp,
        competencia_relacionada: (item.tipo === 'coesao' ? 4 : 1) as 1 | 4,
      });
    }
  });

  // Cálculo Rigoroso das Competências
  let c1 = 160;
  let c2 = 160;
  let c3 = 160;
  let c4 = 160;
  let c5 = 160;

  // Penalidade de Competência 1 (Norma Culta)
  if (desviosCount >= 4 || ocorrenciasOralidade >= 3) {
    c1 = 40; // Domínio precário / muitos desvios graves
  } else if (desviosCount >= 2 || ocorrenciasOralidade >= 1) {
    c1 = 80;
  } else if (desviosCount === 1) {
    c1 = 120;
  }

  // Penalidade de Competência 2 (Paragrafação & Tipo Textual & Repertório)
  const temRepertorioFormal = /(constituição|filósofo|sociólogo|estatística|ibge|lei|artigo|conforme|segundo|pesquisa)/i.test(texto);
  if (paragraphs.length <= 1) {
    c2 = 80; // Texto em monobloco
  } else if (!temRepertorioFormal) {
    c2 = 120;
  } else if (paragraphs.length >= 4 && temRepertorioFormal) {
    c2 = 200;
  }

  // Penalidade de Competência 3 (Projeto de Texto)
  if (paragraphs.length <= 1 || desviosCount >= 4) {
    c3 = 80; // Projeto de texto rudimentar
  } else if (paragraphs.length < 3) {
    c3 = 120;
  } else {
    c3 = 160;
  }

  // Penalidade de Competência 4 (Coesão)
  if (lowerText.includes('ai ') || desviosCount >= 3 || paragraphs.length <= 1) {
    c4 = 40; // Coesão precária / oralidade
  } else if (paragraphs.length < 3) {
    c4 = 120;
  }

  // Penalidade de Competência 5 (Proposta de Intervenção)
  const temAgenteClaro = /ministério|governo federal|secretaria|poder público/i.test(texto);
  const temMeioClaro = /por meio de|mediante|através de|com o objetivo/i.test(texto);
  if (!temAgenteClaro || !temMeioClaro) {
    c5 = 80; // Proposta muito vaga ou incompleta
  } else {
    c5 = 120;
  }

  const nota_geral = c1 + c2 + c3 + c4 + c5;

  return {
    id: gerarId('cor'),
    redacao_id: gerarId('red'),
    anulada: false,
    motivo_anulacao: null,
    nota_geral,
    competencias: [
      {
        numero: 1,
        nome: 'Competência I - Norma Culta',
        descricao_curta: 'Estrutura sintática e convenções gramaticais',
        nota: c1,
        nivel: Math.round(c1 / 40),
        comentario:
          c1 <= 40
            ? 'Presença recorrente de desvios graves de concordância nominal e verbal, ausência de pontuação adequada e muitas marcas da linguagem oral (ex: "pra", "pro", "sem estuda", "essas pessoa").'
            : 'Apresenta alguns desvios gramaticais e de pontuação que necessitam de revisão.',
        pontos_fortes: [],
        pontos_melhoria: ['Eliminar gírias e marcas de oralidade', 'Revisar regras de concordância e terminação de verbos (-r)'],
      },
      {
        numero: 2,
        nome: 'Competência II - Compreensão do Tema e Repertório',
        descricao_curta: 'Tipo dissertativo-argumentativo e repertório',
        nota: c2,
        nivel: Math.round(c2 / 40),
        comentario:
          paragraphs.length <= 1
            ? 'O texto foi redigido em bloco único (monobloco), sem divisão estrutural de parágrafos, e carece de repertório sociocultural legitimado (filósofos, leis, dados).'
            : 'O tema foi abordado, mas é fundamental enriquecer a argumentação com repertórios legitimados.',
        pontos_fortes: ['Compreendeu o tema central'],
        pontos_melhoria: ['Dividir o texto obrigatoriamente em 4 parágrafos', 'Inserir referências constitucionais ou sociológicas'],
      },
      {
        numero: 3,
        nome: 'Competência III - Projeto de Texto e Argumentação',
        descricao_curta: 'Organização, consistência e estratégia argumentativa',
        nota: c3,
        nivel: Math.round(c3 / 40),
        comentario:
          c3 <= 80
            ? 'Projeto de texto com falhas graves de progressão e defesa de ponto de vista desorganizada, com argumentos circulares e sem aprofundamento.'
            : 'Argumentação precisa de maior detalhamento das causas e consequências do problema.',
        pontos_fortes: [],
        pontos_melhoria: ['Elaborar uma tese clara na introdução', 'Desenvolver argumentos com base em causas e efeitos estruturados'],
      },
      {
        numero: 4,
        nome: 'Competência IV - Coesão Textual',
        descricao_curta: 'Mecanismos de coesão inter e intraparágrafos',
        nota: c4,
        nivel: Math.round(c4 / 40),
        comentario:
          c4 <= 40
            ? 'Uso inadequado de marcadores orais (como "ai") no lugar de conectivos formais, com repetições constantes de palavras e períodos truncados sem pontuação.'
            : 'Necessidade de variar o repertório de operadores argumentativos.',
        pontos_fortes: [],
        pontos_melhoria: ['Substituir "ai" por conectivos como "Nesse sentido", "Ademais", "Portanto"', 'Usar pontuação para separar as orações'],
      },
      {
        numero: 5,
        nome: 'Competência V - Proposta de Intervenção',
        descricao_curta: '5 elementos válidos respeitando os direitos humanos',
        nota: c5,
        nivel: Math.round(c5 / 40),
        comentario:
          c5 <= 80
            ? 'A proposta de intervenção apresentada é genérica ("o governo devia se esforçar mais"). Faltam detalhamento, meio de execução e agente específico.'
            : 'Proposta articulada, mas precisa dos 5 elementos completos da matriz do ENEM.',
        pontos_fortes: ['Demonstrou intenção de resolver o problema'],
        pontos_melhoria: ['Especificar os 5 elementos: Agente + Ação + Modo/Meio + Efeito + Detalhamento'],
      },
    ],
    erros,
    versao_reescrita: `Em conformidade com a Constituição Federal de 1988, o acesso à cidadania plena constitui um direito inalienável de todo brasileiro. Não obstante essa garantia jurídica, a persistência da invisibilidade provocada pela ausência de certidão de nascimento afasta milhões de indivíduos do exercício pleno de seus direitos fundamentais. Nesse contexto, torna-se imperativo analisar a inércia governamental e os entraves socioespaciais que perpetuam esse cenário excludente.

Em primeira análise, cabe destacar que a falta de registro civil impede o ingresso formal na educação, na saúde e no mercado de trabalho. De acordo com o sociólogo Boaventura de Sousa Santos, para que os direitos humanos sejam universais, é preciso garantir as condições materiais de sua efetivação. Contudo, a distância geográfica entre populações vulneráveis e os cartórios cartoriais tradicionais cristaliza a marginalização histórica dos estratos mais pobres.

Ademais, a ausência de documentação retroalimenta o ciclo da miséria e da vulnerabilidade social. Sem o registro, o cidadão torna-se incapaz de usufruir de programas de assistência social ou de abrir contas bancárias, permanecendo invisível aos olhos do Estado. Essa situação configura uma grave violência institucional que priva o indivíduo de sua própria identidade jurídica.

Portanto, medidas urgentes são necessárias para erradicar a falta de registro no país. Para tanto, cabe ao Ministério da Justiça, em parceria com as prefeituras municipais e os cartórios civis, instituir caravanas itinerantes de documentação gratuita em regiões periféricas e rurais, por meio de unidades móveis e mutirões de atendimento comunitário. Tal ação tem por finalidade democratizar a emissão da certidão de nascimento. Somente assim, o Brasil garantirá cidadania e dignidade para toda a população.`,
    feedback_pedagogico: `Atenção: sua redação precisa de uma reformulação completa para atender ao padrão exigido pelo ENEM. 
Principais pontos de urgência:
1. NUNCA escreva o texto em um único bloco contínuo. Divida em 4 parágrafos (Introdução, D1, D2, Conclusão).
2. Elimine termos de conversa falada ("ai", "pra", "pro", "a gente") e use a pontuação correta (vírgulas e pontos finais).
3. Corrija a concordância ("essas pessoas", "muitas pessoas nascem", "sem estudar").
4. Consulte a "Versão Reescrita (Padrão 1000)" para aprender a estrutura formal ideal!`,
    pontos_positivos: [
      'Você compreendeu a importância do tema do registro civil e da cidadania.',
    ],
    proximos_passos: [
      'Praticar a estrutura em 4 parágrafos separados',
      'Fazer exercícios de concordância nominal e verbal',
      'Substituir palavras informais por conectivos formais da norma padrão',
      'Estudar o modelo dos 5 elementos da proposta de intervenção',
    ],
    tempo_analise_ms: 1100,
    created_at: new Date().toISOString(),
  };
}
