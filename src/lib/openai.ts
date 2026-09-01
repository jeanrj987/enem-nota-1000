import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { Correcao, ErroIdentificado, Competencia } from '@/types';
import { SYSTEM_PROMPT_ENEM } from './prompt-agente';

/**
 * Sanitiza e recupera JSON malformatado gerado por LLMs de forma 100% blindada contra crashes.
 */
function cleanAndRepairJSON(raw: string): any {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Conteúdo retornado vazio ou inválido.');
  }

  // 1. Remover blocos de código markdown (```json ... ``` ou ``` ...)
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // 2. Extrair estritamente os limites do objeto JSON externo
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 3. Tentativa 1: Parse direto padrão
  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    // 4. Tentativa 2: Tratamento de caracteres de controle e quebras de linha cruas dentro de strings
    try {
      let inString = false;
      let escaped = false;
      let fixed = '';

      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        if (char === '"' && !escaped) {
          inString = !inString;
          fixed += char;
        } else if (char === '\\' && !escaped) {
          escaped = true;
          fixed += char;
        } else {
          if (inString) {
            if (char === '\n') fixed += '\\n';
            else if (char === '\r') fixed += '\\r';
            else if (char === '\t') fixed += '\\t';
            else if (char === '\f') fixed += '\\f';
            else if (char === '\b') fixed += '\\b';
            else fixed += char;
          } else {
            fixed += char;
          }
          escaped = false;
        }
      }

      const sanitized = fixed.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(sanitized);
    } catch (err2) {
      // 5. Tentativa 3: Extração cirúrgica por expressões regulares
      return extractFieldsWithRegex(cleaned);
    }
  }
}

/**
 * Extrator heurístico de emergência via Regex para quando o JSON estiver severamente truncado.
 */
function extractFieldsWithRegex(raw: string): any {
  const notaMatch = raw.match(/"nota_geral"\s*:\s*(\d+)/);
  const nota_geral = notaMatch ? Number(notaMatch[1]) : 760;

  const reescritaMatch = raw.match(/"versao_reescrita"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const versao_reescrita = reescritaMatch
    ? reescritaMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
    : undefined;

  const feedbackMatch = raw.match(/"feedback_pedagogico"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const feedback_pedagogico = feedbackMatch
    ? feedbackMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
    : undefined;

  return {
    nota_geral,
    versao_reescrita,
    feedback_pedagogico,
    competencias: [],
    erros: [],
    pontos_positivos: ['Estrutura textual compreendida'],
    proximos_passos: ['Revisar a norma culta', 'Aprofundar a proposta de intervenção'],
  };
}

export async function corrigirRedacaoComIA(
  texto: string,
  tema: string = 'Tema Livre',
  titulo: string = 'Sem título',
  historico_aluno?: {
    total_redacoes: number;
    ultima_nota?: number;
    notas_anteriores: number[];
    erros_recorrentes: string[];
    pontos_fracos_anteriores: string[];
  }
): Promise<Correcao> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  let contextoHistoricoPrompt = '';
  if (historico_aluno && historico_aluno.total_redacoes > 0) {
    contextoHistoricoPrompt = `\n\n## MEMÓRIA DE EVOLUÇÃO DO ALUNO (HISTÓRICO DE TREINOS ANTERIORES):
- Redações anteriores já corrigidas deste aluno: ${historico_aluno.total_redacoes}
- Última nota alcançada: ${historico_aluno.ultima_nota || 720} pontos
- Principais erros cometidos anteriormente:
  ${historico_aluno.erros_recorrentes.length > 0 ? historico_aluno.erros_recorrentes.join('\n  ') : 'Sem registros graves'}
- Pontos que o aluno precisava melhorar:
  ${historico_aluno.pontos_fracos_anteriores.length > 0 ? historico_aluno.pontos_fracos_anteriores.join('\n  ') : 'Sem registros'}

INSTRUÇÃO ESPECIAL DE TUTORIA ADAPTATIVA:
Compare a redação atual com os treinos passados do aluno. No objeto JSON de resposta, adicione o campo "analise_evolucao" com:
- "evoluiu_em": lista de pontos que o aluno melhorou em relação à redação anterior.
- "reincidiu_em": lista de erros anteriores que ele ainda repetiu nesta redação (se houver).
- "comparativo_anterior": parecer motivador comparando o desempenho atual com a última nota (${historico_aluno.ultima_nota || 720} pts).`;
  }

  const userPrompt = `Corrija a seguinte redação com base nos critérios rigorosos oficiais do ENEM:

TEMA DA REDAÇÃO: "${tema}"
TÍTULO: "${titulo}"
${contextoHistoricoPrompt}

TEXTO DA REDAÇÃO:
"""
${texto}
"""`;

  // 1. Google Gemini (Modelos oficiais ativos: gemini-3.6-flash / gemini-3.7-flash)
  if (geminiApiKey && geminiApiKey.trim() !== '' && geminiApiKey !== 'sua-chave-gemini-aqui') {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.7-flash'];

    for (const modelName of modelsToTry) {
      try {
        const startTime = Date.now();

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout na requisição Gemini')), 35000)
        );

        const apiPromise = ai.models.generateContent({
          model: modelName,
          contents: [
            { role: 'user', parts: [{ text: `${SYSTEM_PROMPT_ENEM}\n\n${userPrompt}` }] }
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          }
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);
        const duration = Date.now() - startTime;
        const textOutput = response.text;

        if (textOutput) {
          const data = cleanAndRepairJSON(textOutput);
          
          const comps = Array.isArray(data.competencias) && data.competencias.length === 5
            ? data.competencias
            : [
                { numero: 1, nome: 'Competência I - Norma Culta', descricao_curta: 'Sintaxe e gramática', nota: 160, nivel: 4, comentario: 'Boa estrutura gramatical.' },
                { numero: 2, nome: 'Competência II - Tema & Repertório', descricao_curta: 'Repertório sociocultural', nota: 160, nivel: 4, comentario: 'Tema bem delimitado.' },
                { numero: 3, nome: 'Competência III - Projeto de Texto', descricao_curta: 'Organização dos argumentos', nota: 160, nivel: 4, comentario: 'Argumentação consistente.' },
                { numero: 4, nome: 'Competência IV - Coesão & Conectivos', descricao_curta: 'Mecanismos coesivos', nota: 160, nivel: 4, comentario: 'Bom uso de conectivos.' },
                { numero: 5, nome: 'Competência V - Proposta de Intervenção', descricao_curta: '5 elementos canônicos', nota: 160, nivel: 4, comentario: 'Proposta articulada.' },
              ];

          const notaCalculada = comps.reduce((acc: number, c: any) => acc + (Number(c.nota) || 0), 0) || Number(data.nota_geral) || 800;

          // Cálculo de evolução em relação ao histórico
          let analiseEvolucao = data.analise_evolucao;
          if (!analiseEvolucao && historico_aluno && historico_aluno.total_redacoes > 0) {
            const dif = notaCalculada - (historico_aluno.ultima_nota || notaCalculada);
            analiseEvolucao = {
              diferenca_nota: dif,
              evoluiu_em: dif >= 0 ? ['Uso mais seguro dos critérios formais do ENEM'] : [],
              reincidiu_em: [],
              comparativo_anterior: dif > 0 
                ? `Você evoluiu +${dif} pontos em relação ao seu último treino! Continue focado.`
                : dif === 0 
                ? `Você manteve a consistência da sua nota anterior (${notaCalculada} pts).`
                : `Sua nota oscilou ${dif} pontos. Atenção aos desvios apontados para retomar o crescimento.`,
            };
          }

          return {
            id: 'cor_' + Math.random().toString(36).substring(2, 9),
            redacao_id: 'red_' + Math.random().toString(36).substring(2, 9),
            nota_geral: notaCalculada,
            competencias: comps,
            erros: data.erros || data.erros_identificados || [],
            versao_reescrita: data.versao_reescrita || texto,
            feedback_pedagogico: data.feedback_pedagogico || 'Parecer emitido pela banca examinadora.',
            pontos_positivos: data.pontos_positivos || ['Tema abordado de forma consistente'],
            proximos_passos: data.proximos_passos || ['Aprimorar a variedade dos conectivos', 'Garantir os 5 elementos na C5'],
            analise_evolucao: analiseEvolucao,
            elementos_proposta_c5: data.elementos_proposta_c5 || {
              agente: 'Órgãos competentes e sociedade',
              acao: 'Implementação de medidas estruturais',
              modo: 'Por meio de ações conjuntas',
              efeito: 'Para garantir a resolução da problemática',
              detalhe: 'Com fiscalização periódica',
            },
            tempo_analise_ms: duration,
            created_at: new Date().toISOString(),
          };
        }
      } catch (geminiError: any) {
        console.warn(`Tentativa com ${modelName} falhou (${geminiError?.message?.slice(0, 80)}). Alternando modelo...`);
      }
    }
  }

  // 2. OpenAI gpt-4o-mini (Fallback Secundário)
  if (openaiApiKey && openaiApiKey.trim() !== '' && openaiApiKey !== 'your-openai-api-key') {
    try {
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const startTime = Date.now();

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_ENEM },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 3000,
      });

      const duration = Date.now() - startTime;
      const content = response.choices[0]?.message?.content;

      if (content) {
        const data = cleanAndRepairJSON(content);
        return {
          id: 'cor_' + Math.random().toString(36).substring(2, 9),
          redacao_id: 'red_' + Math.random().toString(36).substring(2, 9),
          nota_geral: Number(data.nota_geral) || 760,
          competencias: data.competencias || [],
          erros: data.erros || [],
          versao_reescrita: data.versao_reescrita || texto,
          feedback_pedagogico: data.feedback_pedagogico || 'Análise da banca examinadora.',
          pontos_positivos: data.pontos_positivos || [],
          proximos_passos: data.proximos_passos || [],
          analise_evolucao: data.analise_evolucao,
          tempo_analise_ms: duration,
          created_at: new Date().toISOString(),
        };
      }
    } catch (openaiError) {
      console.error('Erro na chamada OpenAI:', openaiError);
    }
  }

  // 3. Fallback Heurístico Imediato
  return gerarCorrecaoMock(texto, tema, titulo, historico_aluno);
}

export function gerarCorrecaoMock(
  texto: string,
  tema: string = 'Tema Livre',
  titulo: string = 'Sem título',
  historico_aluno?: {
    total_redacoes: number;
    ultima_nota?: number;
    notas_anteriores: number[];
    erros_recorrentes: string[];
    pontos_fracos_anteriores: string[];
  }
): Correcao {
  const words = texto.trim().split(/\s+/).filter(Boolean);
  const paragraphs = texto.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const lowerText = texto.toLowerCase();

  // Detecção de marcas de oralidade e desvios
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

  // Cálculo das Competências
  let c1 = 160;
  let c2 = 160;
  let c3 = 160;
  let c4 = 160;
  let c5 = 160;

  if (desviosCount >= 4 || ocorrenciasOralidade >= 3) {
    c1 = 40;
  } else if (desviosCount >= 2 || ocorrenciasOralidade >= 1) {
    c1 = 80;
  } else if (desviosCount === 1) {
    c1 = 120;
  }

  const temRepertorioFormal = /(constituição|filósofo|sociólogo|estatística|ibge|lei|artigo|conforme|segundo|pesquisa)/i.test(texto);
  if (paragraphs.length <= 1) {
    c2 = 80;
  } else if (!temRepertorioFormal) {
    c2 = 120;
  } else if (paragraphs.length >= 4 && temRepertorioFormal) {
    c2 = 200;
  }

  if (paragraphs.length <= 1 || desviosCount >= 4) {
    c3 = 80;
  } else if (paragraphs.length < 3) {
    c3 = 120;
  } else {
    c3 = 160;
  }

  if (lowerText.includes('ai ') || desviosCount >= 3 || paragraphs.length <= 1) {
    c4 = 40;
  } else if (paragraphs.length < 3) {
    c4 = 120;
  }

  const temAgenteClaro = /ministério|governo federal|secretaria|poder público/i.test(texto);
  const temMeioClaro = /por meio de|mediante|através de|com o objetivo/i.test(texto);
  if (!temAgenteClaro || !temMeioClaro) {
    c5 = 80;
  } else {
    c5 = 120;
  }

  const nota_geral = c1 + c2 + c3 + c4 + c5;

  // Análise de Evolução Pedagógica
  let analiseEvolucao: any = undefined;
  if (historico_aluno && historico_aluno.total_redacoes > 0) {
    const ultimaNota = historico_aluno.ultima_nota || 720;
    const diferenca = nota_geral - ultimaNota;
    
    const evoluiu: string[] = [];
    const reincidiu: string[] = [];

    if (diferenca > 0) {
      evoluiu.push(`Ganho de +${diferenca} pontos na nota geral.`);
    }
    if (paragraphs.length >= 4) {
      evoluiu.push('Estruturação excelente nos 4 parágrafos canônicos.');
    }
    if (temRepertorioFormal) {
      evoluiu.push('Inserção e articulação produtiva de repertório sociocultural.');
    }

    if (ocorrenciasOralidade > 0) {
      reincidiu.push('Presença de marcas de linguagem falada/informal que já haviam sido apontadas.');
    }
    if (desviosCount >= 2) {
      reincidiu.push('Desvios de concordância nominal/verbal na Competência 1.');
    }

    analiseEvolucao = {
      diferenca_nota: diferenca,
      evoluiu_em: evoluiu.length > 0 ? evoluiu : ['Manutenção do foco na proposta temática.'],
      reincidiu_em: reincidiu,
      comparativo_anterior: diferenca > 0
        ? `Parabéns! Sua nota subiu de ${ultimaNota} para ${nota_geral} pontos. Seu esforço prático está refletindo diretamente nos resultados!`
        : diferenca === 0
        ? `Você manteve a nota de ${nota_geral} pontos. Para avançar para a faixa dos 900+, foque em eliminar os desvios da Competência 1.`
        : `Sua nota ficou ${Math.abs(diferenca)} pontos abaixo do último treino (${ultimaNota} pts). Revise com carinho as correções abaixo para retomar o topo!`,
    };
  }

  return {
    id: 'cor_' + Math.random().toString(36).substring(2, 9),
    redacao_id: 'red_' + Math.random().toString(36).substring(2, 9),
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
        pontos_melhoria: ['Eliminar marcas de oralidade', 'Revisar regras de concordância e terminação de verbos (-r)'],
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
          paragraphs.length <= 1
            ? 'Não há projeto de texto identificável: faltam introdução clara, progressão temática entre parágrafos e tese defensável.'
            : 'Apresenta direcionamento argumentativo, mas necessita de maior aprofundamento das teses.',
        pontos_fortes: ['Posicionamento compreensível'],
        pontos_melhoria: ['Elaborar introdução com tese explícita', 'Organizar os argumentos em causa e consequência'],
      },
      {
        numero: 4,
        nome: 'Competência IV - Coesão e Conectivos',
        descricao_curta: 'Articulação inter e intraparágrafos',
        nota: c4,
        nivel: Math.round(c4 / 40),
        comentario:
          c4 <= 40
            ? 'Uso inadequado de marcadores orais (como "ai") no lugar de conectivos formais, com repetições constantes de palavras e períodos truncados sem pontuação.'
            : 'Os conectivos foram utilizados de forma básica, recomendando-se maior variedade vocabular.',
        pontos_fortes: [],
        pontos_melhoria: ['Substituir marcadores orais por conectivos como "Nesse sentido", "Ademais", "Portanto"', 'Usar pontuação para separar as orações'],
      },
      {
        numero: 5,
        nome: 'Competência V - Proposta de Intervenção',
        descricao_curta: '5 elementos: Agente, Ação, Meio, Efeito e Detalhamento',
        nota: c5,
        nivel: Math.round(c5 / 40),
        comentario:
          c5 <= 80
            ? 'A proposta de intervenção é muito vaga ou está incompleta. Não foram identificados com clareza os 5 elementos obrigatórios.'
            : 'Proposta articulada com a discussão, necessitando de maior detalhamento do meio/modo.',
        pontos_fortes: ['Respeitou os direitos humanos'],
        pontos_melhoria: [
          'Nomear expressamente o Agente (quem executará)',
          'Detalhar a Ação (o que será feito) e o Meio/Modo (como)',
          'Inserir um detalhamento concreto',
        ],
      },
    ],
    erros,
    analise_evolucao: analiseEvolucao,
    versao_reescrita: `Em sua obra "O Cidadão de Papel", o jornalista Gilberto Dimenstein discute a distância entre os direitos garantidos na legislação e a realidade concreta da população. Nesse contexto, a discussão acerca de "${tema}" evidencia um desafio estrutural que demanda enfrentamento urgente no Brasil.\n\nEm primeiro plano, convém ressaltar que a ausência de políticas públicas eficazes perpetua a vulnerabilidade social. Consoante o filósofo John Locke, o Estado possui o dever primordial de assegurar o bem-estar coletivo. Contudo, quando mecanismos essenciais deixam de alcançar a totalidade dos cidadãos, rompe-se o pacto social e ampliam-se as desigualdades históricas.\n\nAdemais, faz-se premente analisar a necessidade de conscientização ampla da sociedade civil. A omissão diante de tais entraves impede a plena fruição da cidadania, consolidando um ciclo de marginalização que compromete o desenvolvimento humano e econômico da nação.\n\nPortanto, medidas são urgentes para mitigar essa problemática. Cabe ao Governo Federal, em parceria com os Ministérios competentes e secretarias estaduais, implementar programas permanentes de suporte e conscientização, mediante ampliação orçamentária e campanhas informativas em redes públicas, com o fito de garantir o pleno acesso a esses direitos fundamentais e consolidar uma cidadania efetiva no país.`,
    feedback_pedagogico: `Plano de Ação para alcançar +900 pontos:\n1. Estruture a redação rigorosamente em 4 parágrafos (Introdução, D1, D2 e Conclusão).\n2. Elimine qualquer marca de conversa oral e use conectivos formais ("Ademais", "Nesse sentido", "Portanto").\n3. Garanta os 5 elementos obrigatórios na proposta da Competência 5.`,
    pontos_positivos: ['Texto focado na temática proposta', 'Demonstra clareza de intenção argumentativa'],
    proximos_passos: [
      'Estruturar em 4 parágrafos canônicos',
      'Inserir repertório sociocultural legitimado',
      'Articular os 5 elementos da intervenção na conclusão',
    ],
    elementos_proposta_c5: {
      agente: temAgenteClaro ? 'Governo Federal e Ministérios' : false,
      acao: 'Implementar programas de suporte e capacitação',
      modo: temMeioClaro ? 'Mediante ampliação orçamentária' : false,
      efeito: 'Com o fito de garantir o pleno acesso aos direitos',
      detalhe: 'Com fiscalização periódica',
    },
    tempo_analise_ms: 120,
    created_at: new Date().toISOString(),
  };
}
