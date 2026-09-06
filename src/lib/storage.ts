import { Redacao, Correcao, HistoricoItem, EstatisticasUsuario, TemaRedacao } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

async function getUserId(): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export const TEMAS_ENEM_SUGERIDOS: TemaRedacao[] = [
  {
    id: 'enem-2024',
    titulo: 'Desafios para a valorização da herança africana no Brasil',
    origem: 'ENEM Oficial',
    ano: 2024,
    descricao: 'A matriz cultural e histórica brasileira possui profunda raiz africana, contudo persistem barreiras no reconhecimento e na preservação dessa herança.',
    textos_motivadores: [
      {
        titulo: 'Texto I - O legado ancestral',
        conteudo: 'A contribuição africana para a formação do Brasil ultrapassa o aspecto cultural e artístico, estruturando saberes tecnológicos, gastronômicos e de organização social que merecem salvaguarda institucional.',
        fonte: 'Fundação Palmares / IPHAN'
      },
      {
        titulo: 'Texto II - Desafios contemporâneos',
        conteudo: 'Apesar de avanços legislativos como a Lei 10.639/03, o currículo escolar brasileiro ainda enfrenta desafios na plena implementação da história e cultura afro-brasileira nas salas de aula.',
        fonte: 'MEC / Censo Escolar'
      }
    ]
  },
  {
    id: 'enem-2023',
    titulo: 'Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil',
    origem: 'ENEM Oficial',
    ano: 2023,
    descricao: 'A falta de documentação básica impede milhões de brasileiros de usufruírem de seus direitos fundamentais garantidos pela Constituição de 1988.',
    textos_motivadores: [
      {
        titulo: 'Texto I - O direito a existir perante a lei',
        conteudo: 'A certidão de nascimento é o primeiro passo para o exercício pleno da cidadania, permitindo matrícula escolar, vacinação e benefícios sociais.',
        fonte: 'IBGE / Arpen-Brasil'
      }
    ]
  },
  {
    id: 'enem-inedito-1',
    titulo: 'Impactos e regulamentação da Inteligência Artificial no mercado de trabalho brasileiro',
    origem: 'Tema Inédito',
    ano: 2025,
    descricao: 'A rápida evolução dos modelos de IA generativa traz ganhos de produtividade, mas também desafios éticos, de requalificação profissional e substituição de postos de trabalho.',
  },
  {
    id: 'enem-inedito-2',
    titulo: 'Caminhos para combater o analfabetismo funcional e promover o letramento digital',
    origem: 'Simulado Nacional',
    ano: 2025,
    descricao: 'A democratização dos dispositivos digitais não foi acompanhada pelo letramento crítico e pela interpretação textual adequada da população.',
  }
];

export const MOCK_REDACOES_INICIAIS: Redacao[] = [
  {
    id: 'red_demo_1',
    titulo: 'A urgência da preservação da memória e ancestralidade afro-brasileira',
    tema: 'Desafios para a valorização da herança africana no Brasil',
    texto: `Em sua obra "O Povo Brasileiro", o antropólogo Darcy Ribeiro destaca a matriz africana como elemento fundante da identidade nacional, cuja riqueza perpassa a língua, a culinária e a religiosidade. Não obstante essa relevância incontestável, observa-se no Brasil contemporâneo uma persistente desvalorização da herança africana, reflexo de um racismo estrutural enraizado. Nesse contexto, torna-se imperativo analisar tanto a ineficácia na aplicação de diretrizes educacionais quanto a estigmatização cultural que marginaliza essas manifestações.

Em primeiro plano, cabe ressaltar que a Lei 10.639 de 2003, que torna obrigatório o ensino da história e cultura afro-brasileira nas escolas, enfrenta entraves crônicos de implementação. De acordo com o filósofo Immanuel Kant, o ser humano é aquilo que a educação faz dele. Contudo, a ausência de formação continuada de professores e a escassez de material pedagógico atualizado perpetuam uma abordagem eurocêntrica no ambiente escolar, invisibilizando séculos de resistência e protagonismo negro. Desse modo, a falta de instrução formal adequada impede a desconstrução de preconceitos desde a infância.

Ademais, a estigmatização de manifestações culturais e religiosas de matriz africana evidencia a perpetuação da violência simbólica descrita pelo sociólogo Pierre Bourdieu. Frequentemente, terreiros e festividades tradicionais são alvos de intolerância e vandalismo, impulsionados pela disseminação de discursos de ódio e desinformação. Tal hostilidade cerceia o livre exercício da fé e a ocupação dos espaços públicos, rebaixando saberes ancestrais a estereótipos pejorativos que violam a dignidade humana.

Portanto, medidas urgentes são necessárias para mitigar esse panorama excludente. Para tanto, cabe ao Ministério da Educação, em parceria com o Ministério da Igualdade Racial, implementar programas de formação continuada e fiscalização da Lei 10.639 nas redes de ensino básica e superior, por meio de oficinas pedagógicas e distribuição de acervo literário afrocentrado. Tal ação tem por finalidade fomentar o pensamento crítico e o respeito à pluralidade étnica. Somente assim, o Brasil poderá honrar plenamente suas raízes e concretizar a equidade cidadã sonhada por Darcy Ribeiro.`,
    palavras_count: 342,
    linhas_count: 30,
    status: 'corrigida',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    correcao: {
      id: 'cor_demo_1',
      redacao_id: 'red_demo_1',
      anulada: false,
      motivo_anulacao: null,
      nota_geral: 960,
      competencias: [
        {
          numero: 1,
          nome: 'Competência I - Norma Culta',
          descricao_curta: 'Estrutura sintática e convenções gramaticais',
          nota: 200,
          nivel: 5,
          comentario: 'Excelente estrutura sintática, períodos bem pontuados, vocabulário culto e ausência de desvios gramaticais expressivos.',
          pontos_fortes: ['Excelente variedade vocabular', 'Sintaxe complexa e precisa'],
          pontos_melhoria: ['Manter a precisão nos adjuntos']
        },
        {
          numero: 2,
          nome: 'Competência II - Compreensão do Tema e Repertório',
          descricao_curta: 'Adequação ao gênero dissertativo e repertório sociocultural',
          nota: 200,
          nivel: 5,
          comentario: 'Repertório sociocultural altamente produtivo e legitimado (Darcy Ribeiro, Kant e Bourdieu), plenamente articulado com a tese.',
          pontos_fortes: ['Citações legitimadas e bem articuladas', 'Defesa de tese clara'],
          pontos_melhoria: []
        },
        {
          numero: 3,
          nome: 'Competência III - Projeto de Texto e Argumentação',
          descricao_curta: 'Organização, consistência e estratégia argumentativa',
          nota: 160,
          nivel: 4,
          comentario: 'Projeto de texto consistente e estratégico. Poderia haver um pequeno aprofundamento adicional das consequências no D2.',
          pontos_fortes: ['Progressão lógica e coerente', 'Autoria evidente'],
          pontos_melhoria: ['Aprofundar a relação de causa e efeito no segundo desenvolvimento']
        },
        {
          numero: 4,
          nome: 'Competência IV - Coesão Textual',
          descricao_curta: 'Mecanismos de coesão inter e intraparágrafos',
          nota: 200,
          nivel: 5,
          comentario: 'Uso impecável de conectivos interparágrafos ("Em primeiro plano", "Ademais", "Portanto") e intraparágrafos sem repetições.',
          pontos_fortes: ['Rico repertório coesivo', 'Excelente encadeamento de orações'],
          pontos_melhoria: []
        },
        {
          numero: 5,
          nome: 'Competência V - Proposta de Intervenção',
          descricao_curta: '5 elementos válidos respeitando os direitos humanos',
          nota: 200,
          nivel: 5,
          comentario: 'Proposta completa com todos os 5 elementos: Agente (Ministério da Educação e da Igualdade Racial), Ação (implementar formação e fiscalização), Meio (oficinas e distribuição de acervo), Efeito (fomentar pensamento crítico) e Detalhamento da ação.',
          pontos_fortes: ['5 elementos perfeitamente identificáveis', 'Respeito aos Direitos Humanos'],
          pontos_melhoria: []
        }
      ],
      erros: [
        {
          id: 'err_d1',
          trecho: 'ensino básica e superior',
          tipo: 'concordancia',
          correcao: 'ensino básico e superior',
          explicacao: 'A palavra "ensino" é substantivo masculino; portanto, os adjetivos que a qualificam devem flexionar no masculino singular.',
          competencia_relacionada: 1
        }
      ],
      versao_reescrita: 'Texto já em nível de excelência para a nota 1000, necessitando apenas de ajuste pontual de concordância na conclusão.',
      feedback_pedagogico: 'Redação exemplar! Sua capacidade de articular repertórios com os problemas reais do país é formidável. Mantenha essa precisão na proposta de intervenção para os próximos treinos.',
      pontos_positivos: [
        'Excelente repertório filosófico e sociológico',
        'Estrutura em 4 parágrafos canônica e fluida',
        'Proposta de intervenção completa com os 5 elementos'
      ],
      proximos_passos: [
        'Continuar cronômetro de 60 minutos por redação para simular o dia da prova',
        'Explorar temas voltados à tecnologia e meio ambiente'
      ],
      tempo_analise_ms: 1450,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
];

const STORAGE_KEY_REDACOES = 'enem_ai_redacoes_v1';

function getRedacoesSalvasLocal(): Redacao[] {
  if (typeof window === 'undefined') return MOCK_REDACOES_INICIAIS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REDACOES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REDACOES, JSON.stringify(MOCK_REDACOES_INICIAIS));
      return MOCK_REDACOES_INICIAIS;
    }
    return JSON.parse(raw);
  } catch {
    return MOCK_REDACOES_INICIAIS;
  }
}

interface RedacaoRow {
  id: string;
  titulo: string;
  tema: string;
  texto: string;
  palavras_count: number;
  linhas_count: number;
  status: Redacao['status'];
  total_erros: number | null;
  anulada: boolean | null;
  created_at: string;
}

/** A correção vem de `correcoes`, tabela cuja RLS exige assinatura ativa.
 * Quando o usuário não tem plano, a consulta simplesmente não devolve a
 * linha — não é uma decisão de interface, é o banco negando. */
function linhaParaRedacao(row: RedacaoRow, correcao?: Correcao): Redacao {
  return {
    id: row.id,
    titulo: row.titulo,
    tema: row.tema,
    texto: row.texto,
    palavras_count: row.palavras_count,
    linhas_count: row.linhas_count,
    status: row.status,
    created_at: row.created_at,
    correcao,
    chamariz: correcao
      ? undefined
      : { total_erros: row.total_erros ?? 0, anulada: row.anulada ?? false },
  };
}

/**
 * Busca o histórico de redações. Usa Supabase (persistência real, vinculada
 * ao usuário autenticado) quando configurado e logado; cai para
 * localStorage em caso de ausência de configuração, usuário deslogado ou
 * falha de rede, para nunca travar a experiência do usuário.
 */
export async function getRedacoesSalvas(): Promise<Redacao[]> {
  const userId = await getUserId();
  if (isSupabaseConfigured && supabase && userId) {
    const { data, error } = await supabase
      .from('redacoes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const { data: correcoes } = await supabase
        .from('correcoes')
        .select('redacao_id, dados')
        .eq('user_id', userId);

      const porRedacao = new Map<string, Correcao>(
        (correcoes ?? []).map((c) => [c.redacao_id as string, c.dados as Correcao])
      );

      return data.map((row) => linhaParaRedacao(row, porRedacao.get(row.id)));
    }
    console.error('Erro ao buscar redações no Supabase, usando localStorage:', error);
  }

  return getRedacoesSalvasLocal();
}

export async function buscarRedacaoPorId(id: string): Promise<Redacao | undefined> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('redacoes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      // Sem assinatura ativa, a RLS de `correcoes` não devolve nada aqui e a
      // redação volta apenas com o chamariz.
      const { data: correcao } = await supabase
        .from('correcoes')
        .select('dados')
        .eq('redacao_id', id)
        .maybeSingle();

      return linhaParaRedacao(data, (correcao?.dados as Correcao) ?? undefined);
    }
    if (error) console.error('Erro ao buscar redação no Supabase, tentando localStorage:', error);
  }

  const redacoes = getRedacoesSalvasLocal();
  return redacoes.find((r) => r.id === id);
}

export function calcularEstatisticas(redacoes: Redacao[]): EstatisticasUsuario {
  const corrigidas = redacoes.filter(r => r.correcao && r.status === 'corrigida');
  
  if (corrigidas.length === 0) {
    return {
      total_redacoes: 0,
      media_geral: 0,
      maior_nota: 0,
      ultima_nota: 0,
      evolucao_percentual: 0,
      competencia_forte: { numero: 1, nome: 'Competência I', media: 0 },
      competencia_atencao: { numero: 5, nome: 'Competência V', media: 0 },
    };
  }

  const notas = corrigidas.map(r => r.correcao!.nota_geral);
  const media_geral = Math.round(notas.reduce((a, b) => a + b, 0) / notas.length);
  const maior_nota = Math.max(...notas);
  const ultima_nota = corrigidas[0].correcao!.nota_geral;

  // Calculo de médias por competência
  const compSomas: Record<number, { soma: number; count: number; nome: string }> = {
    1: { soma: 0, count: 0, nome: 'Competência I (Norma Culta)' },
    2: { soma: 0, count: 0, nome: 'Competência II (Tema e Repertório)' },
    3: { soma: 0, count: 0, nome: 'Competência III (Argumentação)' },
    4: { soma: 0, count: 0, nome: 'Competência IV (Coesão)' },
    5: { soma: 0, count: 0, nome: 'Competência V (Proposta de Intervenção)' },
  };

  corrigidas.forEach(r => {
    r.correcao?.competencias.forEach(c => {
      if (compSomas[c.numero]) {
        compSomas[c.numero].soma += c.nota;
        compSomas[c.numero].count += 1;
      }
    });
  });

  const compMedias = Object.entries(compSomas).map(([num, data]) => ({
    numero: Number(num) as 1 | 2 | 3 | 4 | 5,
    nome: data.nome,
    media: data.count > 0 ? Math.round(data.soma / data.count) : 0,
  }));

  compMedias.sort((a, b) => b.media - a.media);

  return {
    total_redacoes: corrigidas.length,
    media_geral,
    maior_nota,
    ultima_nota,
    evolucao_percentual: corrigidas.length > 1 ? Math.round(((ultima_nota - notas[notas.length - 1]) / 1000) * 100) : 12,
    competencia_forte: compMedias[0] || { numero: 1, nome: 'Competência I', media: 200 },
    competencia_atencao: compMedias[compMedias.length - 1] || { numero: 5, nome: 'Competência V', media: 160 },
  };
}

export function gerarHistoricoGraficos(redacoes: Redacao[]): HistoricoItem[] {
  const corrigidas = redacoes.filter(r => r.correcao && r.status === 'corrigida');
  
  // Ordena da mais antiga para a mais recente para o gráfico temporal
  const ordenadas = [...corrigidas].reverse();

  return ordenadas.map((r, index) => {
    const c = r.correcao!;
    const getCompNota = (num: number) => c.competencias.find(comp => comp.numero === num)?.nota || 160;

    return {
      id: r.id,
      redacao_id: r.id,
      titulo: r.titulo || `Redação ${index + 1}`,
      tema: r.tema,
      data: new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      nota_geral: c.nota_geral,
      c1: getCompNota(1),
      c2: getCompNota(2),
      c3: getCompNota(3),
      c4: getCompNota(4),
      c5: getCompNota(5),
    };
  });
}
