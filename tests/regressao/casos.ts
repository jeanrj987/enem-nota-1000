/**
 * Casos de regressão: redações reais testadas manualmente durante o
 * desenvolvimento (04/09/2026), cuja correção da IA foi analisada e confirmada
 * como corretamente calibrada contra a matriz oficial do ENEM.
 *
 * Diferente de tests/../src/lib/calibracao/fixtures.ts (que tem nota OFICIAL
 * de banca/corretor humano para medir acurácia), estes casos NÃO têm gabarito
 * oficial — o que está "travado" aqui é que a resposta da IA respeita as
 * regras de negócio que o validador impõe (soma bate, teto de C2 em monobloco,
 * anulação consistente). Servem para garantir que uma mudança futura no prompt
 * ou no validador não quebre silenciosamente um comportamento já verificado.
 *
 * Os campos `versao_reescrita`, `feedback_pedagogico`, `pontos_positivos` e
 * `proximos_passos` são placeholders nos casos em que a resposta completa da
 * API não foi capturada (só a nota e os comentários foram registrados) — isso
 * não compromete os testes, que verificam as REGRAS estruturais, não o texto
 * pedagógico.
 */
import type { CorrecaoIA } from '@/lib/correcao-schema';

export interface CasoRegressao {
  id: string;
  descricao: string;
  data: string;
  texto: string;
  tema: string;
  respostaModelo: CorrecaoIA;
  camposCompletos: boolean;
}

export const CASOS_REGRESSAO: CasoRegressao[] = [
  {
    id: 'fuga_tema_2026_09_04',
    descricao:
      'Redação sobre "trabalho de cuidado da mulher" submetida com o tema "herança africana" selecionado — fuga total ao tema. Resposta real capturada via chamada direta à API.',
    data: '2026-09-04',
    tema: 'Desafios para a valorização da herança africana no Brasil',
    texto: `O trabalho de cuidado realizado pela mulher é muito invisível na sociedade brasileira. As mulheres acordam cedo, fazem comida, limpam a casa, cuidam dos filhos e dos idosos, e ninguém ve isso como trabalho de verdade. Isso é um problema muito grande.
A mulher sempre foi a responsável pela casa e pelos filhos, desde os tempos antigos. Na minha opinião, isso é uma injustiça porque a mulher trabalha muito e não ganha nada por isso. O trabalho doméstico não é valorizado e nem é contado na economia do país. As mulheres fazem tudo isso de graça enquanto os homens vão trabalhar fora e não ajudam em nada.
Além disso, tem a questão do tempo. A mulher que trabalha fora também tem que cuidar da casa quando chega, ai ela fica cansada e estressada. Isso prejudica a saúde dela e também a carreira. Muitas mulheres não conseguem crescer no trabalho porque precisam cuidar dos filhos e não tem com quem deixar.
Portanto, precisamos fazer alguma coisa sobre isso. O governo deveria dar mais valor para esse trabalho e as pessoas deveriam respeitar mais as mulheres. Também os homens deveriam ajudar mais em casa. Se todo mundo ajudar, vai ficar tudo melhor para todos.`,
    camposCompletos: false,
    respostaModelo: {
      anulada: true,
      motivo_anulacao:
        "Fuga total ao tema. A redação desenvolveu integralmente o tema sobre 'O trabalho de cuidado realizado pela mulher no Brasil' (tema do ENEM 2023), sem mencionar ou relacionar em nenhum momento o assunto proposto pela banca: 'Desafios para a valorização da herança africana no Brasil'. Segundo a matriz do INEP, o desenvolvimento de assunto totalmente diverso anula o texto por completo, atribuindo nota zero a todas as competências.",
      nota_geral: 0,
      competencias: [1, 2, 3, 4, 5].map((numero) => ({
        numero: numero as 1 | 2 | 3 | 4 | 5,
        nome: `Competência ${numero}`,
        descricao_curta: 'x',
        nota: 0,
        nivel: 0,
        comentario: 'Redação anulada por fuga total ao tema — ver motivo_anulacao.',
        pontos_fortes: [],
        pontos_melhoria: [],
      })),
      erros: [],
      versao_reescrita: '[placeholder — não capturado na resposta original]',
      feedback_pedagogico: '[placeholder — não capturado na resposta original]',
      pontos_positivos: [],
      proximos_passos: [],
    },
  },
  {
    id: 'monobloco_sem_paragrafo_2026_09_04',
    descricao:
      'Mesma redação sobre herança africana, entregue de propósito em bloco único (sem quebra de parágrafo). Resposta real capturada via chamada direta à API.',
    data: '2026-09-04',
    tema: 'Desafios para a valorização da herança africana no Brasil',
    texto: `A herança africana é muito importante para o Brasil, mas infelizmente as pessoas não valorizam ela como deveria. Desde os tempos da escravidão, os negros trouxeram muita coisa boa para o nosso país, como a comida, a música, o samba, a capoeira, o candomblé e várias outras coisas. Mas isso tudo é esquecido e desvalorizado pela sociedade brasileira.Na minha opinião, o problema é que o racismo ainda existe muito no Brasil. As pessoas tratam a cultura negra como se fosse inferior. Muita gente faz piada com a religião de matriz africana e com o jeito de vestir e de falar dos negros. Isso é muito errado e deixa as pessoas tristes e magoadas.Além disso, as escolas não ensinam quase nada sobre a história da África e dos negros no Brasil. A gente aprende muito mais sobre a Europa do que sobre o nosso próprio país. Por isso, os jovens crescem sem saber da importância da herança africana e acabam não dando valor para ela. Isso é uma falta de respeito com a nossa história e com os nossos antepassados.Portanto, precisamos fazer alguma coisa sobre isso. O governo deveria investir mais na cultura negra e as escolas deveriam ensinar mais sobre a África. Também as pessoas deveriam ter mais respeito e parar com o preconceito. Se todo mundo fizer a sua parte, ai sim a herança africana vai ser valorizada no Brasil e ninguém vai mais sofrer preconceito por causa da cor da pele ou da religião.`,
    camposCompletos: false,
    respostaModelo: {
      anulada: false,
      motivo_anulacao: null,
      nota_geral: 440,
      competencias: [
        { numero: 1, nome: 'Competência 1', descricao_curta: 'x', nota: 80, nivel: 2, comentario: "Marcas de oralidade ('A gente', 'ai sim').", pontos_fortes: [], pontos_melhoria: [] },
        { numero: 2, nome: 'Competência 2', descricao_curta: 'x', nota: 80, nivel: 2, comentario: 'Teto de 80 aplicado por texto em bloco único (monobloco).', pontos_fortes: [], pontos_melhoria: [] },
        { numero: 3, nome: 'Competência 3', descricao_curta: 'x', nota: 80, nivel: 2, comentario: 'Projeto de texto prejudicado pela ausência de divisão em parágrafos.', pontos_fortes: [], pontos_melhoria: [] },
        { numero: 4, nome: 'Competência 4', descricao_curta: 'x', nota: 80, nivel: 2, comentario: 'Ausência de conectivos interparágrafos por estar em bloco único.', pontos_fortes: [], pontos_melhoria: [] },
        { numero: 5, nome: 'Competência 5', descricao_curta: 'x', nota: 120, nivel: 3, comentario: 'Agente, Ação e Efeito presentes; faltam Meio e Detalhamento.', pontos_fortes: [], pontos_melhoria: [] },
      ],
      erros: [],
      versao_reescrita: '[placeholder — não capturado na resposta original]',
      feedback_pedagogico: '[placeholder — não capturado na resposta original]',
      pontos_positivos: [],
      proximos_passos: [],
    },
  },
  {
    id: 'com_paragrafos_2026_09_04',
    descricao:
      'Mesma redação sobre herança africana, agora com quebras de parágrafo reais (4 parágrafos). Resultado transcrito manualmente da tela pelo usuário — versao_reescrita/feedback_pedagogico não capturados.',
    data: '2026-09-04',
    tema: 'Desafios para a valorização da herança africana no Brasil',
    texto: `A herança africana é muito importante para o Brasil, mas infelizmente as pessoas não valorizam ela como deveria. Desde os tempos da escravidão, os negros trouxeram muita coisa boa para o nosso país, como a comida, a música, o samba, a capoeira, o candomblé e várias outras coisas. Mas isso tudo é esquecido e desvalorizado pela sociedade brasileira.

Na minha opinião, o problema é que o racismo ainda existe muito no Brasil. As pessoas tratam a cultura negra como se fosse inferior. Muita gente faz piada com a religião de matriz africana e com o jeito de vestir e de falar dos negros. Isso é muito errado e deixa as pessoas tristes e magoadas.

Além disso, as escolas não ensinam quase nada sobre a história da África e dos negros no Brasil. A gente aprende muito mais sobre a Europa do que sobre o nosso próprio país. Por isso, os jovens crescem sem saber da importância da herança africana e acabam não dando valor para ela. Isso é uma falta de respeito com a nossa história e com os nossos antepassados.

Portanto, precisamos fazer alguma coisa sobre isso. O governo deveria investir mais na cultura negra e as escolas deveriam ensinar mais sobre a África. Também as pessoas deveriam ter mais respeito e parar com o preconceito. Se todo mundo fizer a sua parte, ai sim a herança africana vai ser valorizada no Brasil e ninguém vai mais sofrer preconceci por causa da cor da pele ou da religião.`,
    camposCompletos: false,
    respostaModelo: {
      anulada: false,
      motivo_anulacao: null,
      nota_geral: 600,
      competencias: [1, 2, 3, 4, 5].map((numero) => ({
        numero: numero as 1 | 2 | 3 | 4 | 5,
        nome: `Competência ${numero}`,
        descricao_curta: 'x',
        nota: 120,
        nivel: 3,
        comentario: 'Domínio mediano, projeto de texto embrionário com D1/D2 reais (o texto agora tem 4 parágrafos de verdade).',
        pontos_fortes: [],
        pontos_melhoria: [],
      })),
      erros: [],
      versao_reescrita: '[placeholder — não capturado na resposta original]',
      feedback_pedagogico: '[placeholder — não capturado na resposta original]',
      pontos_positivos: [],
      proximos_passos: [],
    },
  },
  {
    id: 'sem_proposta_intervencao_2026_09_04',
    descricao:
      'Redação sobre herança africana (monobloco) sem parágrafo de conclusão/proposta de intervenção. Resultado transcrito manualmente da tela pelo usuário.',
    data: '2026-09-04',
    tema: 'Desafios para a valorização da herança africana no Brasil',
    texto: `A herança africana é muito importante para o Brasil, mas infelizmente as pessoas não valorizam ela como deveria. Desde a escravidão, os negros trouxeram muita coisa boa, como a comida, o samba e a capoeira. Mas isso tudo é esquecido pela sociedade.Na minha opinião, o problema é o racismo, que ainda existe muito. As pessoas tratam a cultura negra como se fosse inferior e fazem piada com a religião de matriz africana. Isso é muito errado.Além disso, as escolas não ensinam quase nada sobre a história da África. A gente aprende muito mais sobre a Europa do que sobre o nosso próprio país.`,
    camposCompletos: false,
    respostaModelo: {
      anulada: false,
      motivo_anulacao: null,
      nota_geral: 320,
      competencias: [
        { numero: 1, nome: 'Competência 1', descricao_curta: 'x', nota: 80, nivel: 2, comentario: "Marcas de oralidade ('muita coisa boa', 'A gente aprende').", pontos_fortes: [], pontos_melhoria: [] },
        { numero: 2, nome: 'Competência 2', descricao_curta: 'x', nota: 80, nivel: 2, comentario: 'Teto de 80 aplicado por texto em bloco único (monobloco).', pontos_fortes: [], pontos_melhoria: [] },
        { numero: 3, nome: 'Competência 3', descricao_curta: 'x', nota: 80, nivel: 2, comentario: 'Projeto de texto precário, sem aprofundamento crítico.', pontos_fortes: [], pontos_melhoria: [] },
        { numero: 4, nome: 'Competência 4', descricao_curta: 'x', nota: 80, nivel: 2, comentario: 'Ausência de conectivos interparágrafos por estar em bloco único.', pontos_fortes: [], pontos_melhoria: [] },
        { numero: 5, nome: 'Competência 5', descricao_curta: 'x', nota: 0, nivel: 0, comentario: 'Ausência total de proposta de intervenção — texto termina sem conclusão.', pontos_fortes: [], pontos_melhoria: [] },
      ],
      erros: [],
      versao_reescrita: '[placeholder — não capturado na resposta original]',
      feedback_pedagogico: '[placeholder — não capturado na resposta original]',
      pontos_positivos: [],
      proximos_passos: [],
    },
  },
  {
    id: 'evasao_escolar_proposta_parcial_2026_09_04',
    descricao:
      'Redação sobre evasão escolar, com 4 parágrafos reais e proposta de intervenção com 4 dos 5 elementos (falta Meio/Modo, ou Detalhamento — ambiguidade legítima da matriz). Resultado transcrito manualmente da tela pelo usuário.',
    data: '2026-09-04',
    tema: 'Evasão escolar no Brasil',
    texto: `A educação é um direito de todos e por isso muitas pessoas falam que ela é importante. No Brasil, a evasão escolar é um problema que acontece com muitos jovens que abandonam a escola antes de terminar os estudos. Esse é um assunto que merece atenção.

Primeiramente, muitos jovens saem da escola porque precisam trabalhar. A família não tem dinheiro e o jovem precisa ajudar em casa. Além disso, a escola às vezes não é interessante e os alunos não gostam de ficar lá. Também tem a questão da distância, que dificulta a ida até a escola.

Outro ponto é que o governo não faz muita coisa para resolver. As políticas públicas existem mas não funcionam direito. É preciso que o governo faça alguma coisa para mudar essa situação, porque sem educação o país não se desenvolve.

Portanto, o governo deveria criar projetos para manter os jovens na escola, como dar bolsas para as famílias e melhorar as escolas. Assim, os jovens vão ter mais vontade de estudar e o problema vai diminuir.`,
    camposCompletos: false,
    respostaModelo: {
      anulada: false,
      motivo_anulacao: null,
      nota_geral: 640,
      competencias: [
        { numero: 1, nome: 'Competência 1', descricao_curta: 'x', nota: 120, nivel: 3, comentario: 'Domínio mediano, marcas de oralidade e informalidade pontuais.', pontos_fortes: [], pontos_melhoria: [] },
        { numero: 2, nome: 'Competência 2', descricao_curta: 'x', nota: 120, nivel: 3, comentario: '4 parágrafos reais, tema respeitado, mas sem repertório sociocultural legitimado.', pontos_fortes: [], pontos_melhoria: [] },
        { numero: 3, nome: 'Competência 3', descricao_curta: 'x', nota: 120, nivel: 3, comentario: 'Projeto de texto embrionário, causas listadas sem aprofundamento crítico.', pontos_fortes: [], pontos_melhoria: [] },
        { numero: 4, nome: 'Competência 4', descricao_curta: 'x', nota: 120, nivel: 3, comentario: "Conectivos corretos ('Primeiramente', 'Portanto'), mas transição 'Outro ponto' é inadequada.", pontos_fortes: [], pontos_melhoria: [] },
        { numero: 5, nome: 'Competência 5', descricao_curta: 'x', nota: 160, nivel: 4, comentario: 'Proposta com 4 dos 5 elementos (Agente, Ação, Detalhamento, Efeito); falta Meio/Modo explícito.', pontos_fortes: [], pontos_melhoria: [] },
      ],
      erros: [],
      versao_reescrita: '[placeholder — não capturado na resposta original]',
      feedback_pedagogico:
        "Para subir de 640 para 800+: eliminar gírias ('não funcionam direito', 'faça alguma coisa', 'tem a questão'), incluir repertório sociocultural legitimado (ex: Artigo 205 da Constituição, dados do IBGE), e completar a proposta com o Meio/Modo explícito (usando 'por meio de').",
      pontos_positivos: [],
      proximos_passos: [],
    },
  },
  {
    id: 'evasao_escolar_gravidez_c5_consistente_2026_09_04',
    descricao:
      'Redação que originalmente revelou a inconsistência de C5 (comentário descrevia 4 elementos presentes, mas nota era de 3 elementos). Caso abaixo é a resposta JÁ CORRIGIDA, capturada ao vivo após a implementação da regra elementos_c5 — serve para travar essa regra especificamente.',
    data: '2026-09-04',
    tema: 'Evasão escolar no Brasil',
    texto: `A escola é um lugar importante para a formação das pessoas. No entanto, muitos jovens abandonam a escola todos os anos no Brasil. A evasão escolar é um problema sério que precisa ser discutido pela sociedade.

Um dos motivos da evasão é a gravidez na adolescência. Muitas meninas engravidam e não conseguem continuar estudando. Além disso, o trabalho infantil e a necessidade de ajudar em casa também fazem os jovens desistirem. Além disso, a falta de estrutura das escolas, como a falta de professores, atrapalha o aprendizado.

Outro motivo é que muitos jovens não veem sentido no que estudam. Eles acham que a escola não vai ajudar na vida deles e preferem fazer outras coisas. Isso é um reflexo da desigualdade social, que é um problema antigo do Brasil.

Concluindo, o governo deveria fazer mais pela educação, dando apoio às famílias e melhorando as escolas. Também é importante que a sociedade cobre das autoridades. Assim, os jovens vão permanecer na escola e ter um futuro melhor.`,
    camposCompletos: false,
    respostaModelo: {
      anulada: false,
      motivo_anulacao: null,
      nota_geral: 600,
      competencias: [
        { numero: 1, nome: 'Competência 1', descricao_curta: 'x', nota: 120, nivel: 3, comentario: 'Domínio mediano da norma culta.', pontos_fortes: [], pontos_melhoria: [] },
        { numero: 2, nome: 'Competência 2', descricao_curta: 'x', nota: 120, nivel: 3, comentario: '4 parágrafos reais, sem repertório legitimado.', pontos_fortes: [], pontos_melhoria: [] },
        { numero: 3, nome: 'Competência 3', descricao_curta: 'x', nota: 120, nivel: 3, comentario: 'Causas listadas sem aprofundamento crítico.', pontos_fortes: [], pontos_melhoria: [] },
        { numero: 4, nome: 'Competência 4', descricao_curta: 'x', nota: 120, nivel: 3, comentario: 'Conectivos simples, repertório limitado.', pontos_fortes: [], pontos_melhoria: [] },
        {
          numero: 5,
          nome: 'Competência 5',
          descricao_curta: 'x',
          nota: 120,
          nivel: 3,
          comentario:
            "Sua proposta de intervenção apresenta 3 dos 5 elementos obrigatórios: Agente ('o governo'), Ação ('fazer mais pela educação') e Efeito ('Assim, os jovens vão permanecer na escola e ter um futuro melhor'). Faltaram o Meio/Modo (explicar COMO o governo fará isso de forma prática) e o Detalhamento de algum dos elementos.",
          pontos_fortes: [],
          pontos_melhoria: [],
          elementos_c5: { agente: true, acao: true, meio: false, efeito: true, detalhamento: false },
        },
      ],
      erros: [],
      versao_reescrita: '[placeholder — não capturado na resposta original]',
      feedback_pedagogico: '[placeholder — não capturado na resposta original]',
      pontos_positivos: [],
      proximos_passos: [],
    },
  },
];
