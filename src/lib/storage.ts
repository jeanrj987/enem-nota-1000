import { Redacao, Correcao, HistoricoItem, EstatisticasUsuario, TemaRedacao, UsuarioSessao, RascunhoRedacao } from '@/types';
export type { UsuarioSessao, RascunhoRedacao };
import {
  isSupabaseConfigured,
  salvarRedacaoSupabase,
  excluirRedacaoSupabase,
  buscarRedacoesSupabase,
  salvarUsuarioSupabase,
  salvarRascunhoSupabase,
} from '@/lib/supabase';

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
    titulo: 'Impactos da automação e inovação tecnológica no mercado de trabalho brasileiro',
    origem: 'Tema Inédito',
    ano: 2025,
    descricao: 'A rápida evolução das tecnologias de automação digital traz ganhos de produtividade, mas também desafios de requalificação profissional e substituição de postos de trabalho.',
  },
  {
    id: 'enem-inedito-2',
    titulo: 'Caminhos para combater o analfabetismo funcional e promover o letramento digital',
    origem: 'Simulado Nacional',
    ano: 2025,
    descricao: 'A democratização dos dispositivos digitais não foi acompanhada pelo letramento crítico e pela interpretação textual adequada da população.',
  }
];

export interface CursoSisu {
  id: string;
  nome: string;
  universidade: string;
  campus: string;
  corte_geral: number;
  corte_redacao_recomendado: number;
  peso_redacao: number;
  dificuldade: 'Extrema' | 'Alta' | 'Média';
}

export const LISTA_CURSOS_SISU: CursoSisu[] = [
  {
    id: 'med-usp',
    nome: 'Medicina',
    universidade: 'USP (Pinheiros)',
    campus: 'São Paulo - SP',
    corte_geral: 825.4,
    corte_redacao_recomendado: 960,
    peso_redacao: 3,
    dificuldade: 'Extrema',
  },
  {
    id: 'med-ufrj',
    nome: 'Medicina',
    universidade: 'UFRJ',
    campus: 'Rio de Janeiro - RJ',
    corte_geral: 818.9,
    corte_redacao_recomendado: 960,
    peso_redacao: 4,
    dificuldade: 'Extrema',
  },
  {
    id: 'dir-ufmg',
    nome: 'Direito',
    universidade: 'UFMG',
    campus: 'Belo Horizonte - MG',
    corte_geral: 768.2,
    corte_redacao_recomendado: 920,
    peso_redacao: 3,
    dificuldade: 'Alta',
  },
  {
    id: 'comp-usp',
    nome: 'Ciência da Computação',
    universidade: 'USP',
    campus: 'São Carlos - SP',
    corte_geral: 792.0,
    corte_redacao_recomendado: 920,
    peso_redacao: 2,
    dificuldade: 'Alta',
  },
  {
    id: 'psi-ufpe',
    nome: 'Psicologia',
    universidade: 'UFPE',
    campus: 'Recife - PE',
    corte_geral: 742.5,
    corte_redacao_recomendado: 880,
    peso_redacao: 2,
    dificuldade: 'Média',
  },
  {
    id: 'adm-unb',
    nome: 'Administração',
    universidade: 'UnB',
    campus: 'Brasília - DF',
    corte_geral: 720.0,
    corte_redacao_recomendado: 840,
    peso_redacao: 2,
    dificuldade: 'Média',
  },
];

// Base limpa e zerada
export const MOCK_REDACOES_INICIAIS: Redacao[] = [];

const STORAGE_KEY_REDACOES = 'enem_ai_redacoes_v3';
const STORAGE_KEY_RASCUNHO = 'enem_rascunho_temp_v1';
const STORAGE_KEY_USUARIO = 'enem_usuario_sessao_v1';

export function getRedacoesSalvas(): Redacao[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REDACOES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REDACOES, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function salvarRedacao(redacao: Redacao): void {
  if (typeof window === 'undefined') return;
  try {
    const atuais = getRedacoesSalvas();
    const index = atuais.findIndex(r => r.id === redacao.id);
    let novas: Redacao[];
    if (index >= 0) {
      novas = [...atuais];
      novas[index] = redacao;
    } else {
      novas = [redacao, ...atuais];
    }
    localStorage.setItem(STORAGE_KEY_REDACOES, JSON.stringify(novas));

    // Sincronização em nuvem se o Supabase estiver configurado
    if (isSupabaseConfigured) {
      const usuario = getUsuarioAtual();
      salvarRedacaoSupabase(redacao, usuario?.id).catch(err => {
        console.warn('[Storage] Falha ao sincronizar redação com Supabase:', err);
      });
    }
  } catch (err) {
    console.error('Erro ao salvar redação:', err);
  }
}

export function getRedacaoPorId(id: string): Redacao | undefined {
  const redacoes = getRedacoesSalvas();
  return redacoes.find(r => r.id === id);
}

export const buscarRedacaoPorId = getRedacaoPorId;

export function excluirRedacao(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const atuais = getRedacoesSalvas();
    const filtradas = atuais.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY_REDACOES, JSON.stringify(filtradas));

    if (isSupabaseConfigured) {
      excluirRedacaoSupabase(id).catch(err => {
        console.warn('[Storage] Falha ao excluir do Supabase:', err);
      });
    }
  } catch (err) {
    console.error('Erro ao excluir redação:', err);
  }
}

export function limparTodasRedacoes(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_REDACOES);
    localStorage.setItem(STORAGE_KEY_REDACOES, JSON.stringify([]));
  } catch (err) {
    console.error('Erro ao limpar redações:', err);
  }
}

export function limparTudo(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_REDACOES);
    localStorage.removeItem(STORAGE_KEY_RASCUNHO);
    localStorage.removeItem(STORAGE_KEY_USUARIO);
    localStorage.removeItem('enem_ai_redacoes_v1');
    localStorage.removeItem('enem_ai_redacoes_v2');
    localStorage.setItem(STORAGE_KEY_REDACOES, JSON.stringify([]));
  } catch (err) {
    console.error('Erro ao limpar todos os dados:', err);
  }
}

// Auto-Save de Rascunhos

export function salvarRascunho(rascunho: RascunhoRedacao): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_RASCUNHO, JSON.stringify(rascunho));

    if (isSupabaseConfigured) {
      const usuario = getUsuarioAtual();
      salvarRascunhoSupabase(rascunho, usuario?.id).catch(() => {});
    }
  } catch {}
}

export function obterRascunho(): RascunhoRedacao | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RASCUNHO);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function limparRascunho(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_RASCUNHO);
  } catch {}
}

/**
 * Sincroniza redações salvas localmente com a nuvem (Supabase).
 */
export async function sincronizarComSupabase(): Promise<Redacao[]> {
  if (typeof window === 'undefined' || !isSupabaseConfigured) {
    return getRedacoesSalvas();
  }

  try {
    const usuario = getUsuarioAtual();
    const remotas = await buscarRedacoesSupabase(usuario?.id);
    if (remotas && remotas.length > 0) {
      const locais = getRedacoesSalvas();
      const mapa = new Map<string, Redacao>();

      remotas.forEach(r => mapa.set(r.id, r));
      locais.forEach(l => {
        if (!mapa.has(l.id)) {
          mapa.set(l.id, l);
          salvarRedacaoSupabase(l, usuario?.id).catch(() => {});
        }
      });

      const mescladas = Array.from(mapa.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      localStorage.setItem(STORAGE_KEY_REDACOES, JSON.stringify(mescladas));
      return mescladas;
    }
    return getRedacoesSalvas();
  } catch (err) {
    console.error('Erro ao sincronizar com Supabase:', err);
    return getRedacoesSalvas();
  }
}

export function calcularEstatisticas(redacoes?: Redacao[]): EstatisticasUsuario {
  const lista = redacoes !== undefined ? redacoes : getRedacoesSalvas();
  const corrigidas = lista.filter(r => r.correcao && r.status === 'corrigida');

  if (corrigidas.length === 0) {
    return {
      total_redacoes: 0,
      media_geral: 0,
      maior_nota: 0,
      ultima_nota: 0,
      evolucao_percentual: 0,
      competencia_forte: {
        numero: 1,
        nome: 'Competência I (Norma Culta)',
        media: 0,
      },
      competencia_atencao: {
        numero: 5,
        nome: 'Competência V (Proposta de Intervenção)',
        media: 0,
      },
    };
  }

  const notasGerais = corrigidas.map(r => r.correcao!.nota_geral);
  const total = corrigidas.length;
  const soma = notasGerais.reduce((acc, curr) => acc + curr, 0);
  const media_geral = Math.round(soma / total);
  const maior_nota = Math.max(...notasGerais);
  const ultima_nota = corrigidas[0].correcao!.nota_geral;

  let evolucao_percentual = 0;
  if (total >= 2) {
    const primeira = corrigidas[total - 1].correcao!.nota_geral;
    if (primeira > 0) {
      evolucao_percentual = Math.round(((ultima_nota - primeira) / primeira) * 100);
    }
  }

  const somaCompetencias: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const nomesCompetencias: { [key: number]: string } = {
    1: 'Competência I (Norma Culta)',
    2: 'Competência II (Compreensão do Tema)',
    3: 'Competência III (Argumentação)',
    4: 'Competência IV (Coesão Textual)',
    5: 'Competência V (Proposta de Intervenção)',
  };

  corrigidas.forEach(r => {
    r.correcao!.competencias.forEach(comp => {
      somaCompetencias[comp.numero] = (somaCompetencias[comp.numero] || 0) + comp.nota;
    });
  });

  const mediasComp = Object.entries(somaCompetencias).map(([numStr, somaComp]) => {
    const num = parseInt(numStr, 10) as 1 | 2 | 3 | 4 | 5;
    return {
      numero: num,
      nome: nomesCompetencias[num],
      media: Math.round(somaComp / total),
    };
  });

  mediasComp.sort((a, b) => b.media - a.media);
  const competencia_forte = mediasComp[0];
  const competencia_atencao = mediasComp[mediasComp.length - 1];

  return {
    total_redacoes: total,
    media_geral,
    maior_nota,
    ultima_nota,
    evolucao_percentual,
    competencia_forte,
    competencia_atencao,
  };
}

export function gerarHistoricoGraficos(redacoes?: Redacao[]): HistoricoItem[] {
  const lista = redacoes !== undefined ? redacoes : getRedacoesSalvas();
  const corrigidas = lista.filter(r => r.correcao && r.status === 'corrigida');

  const ordenadas = [...corrigidas].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return ordenadas.map((r, index) => {
    const c = r.correcao!;
    const getCompNota = (num: number) => c.competencias.find(comp => comp.numero === num)?.nota || 0;

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

export function calcularStreakEstudos(redacoes?: Redacao[]): number {
  const lista = redacoes !== undefined ? redacoes : getRedacoesSalvas();
  if (lista.length === 0) return 0;
  return Math.min(lista.length, 7);
}

export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  desbloqueada: boolean;
}

export function obterConquistasUsuario(redacoes?: Redacao[]): Conquista[] {
  const lista = redacoes !== undefined ? redacoes : getRedacoesSalvas();
  const total = lista.length;

  return [
    {
      id: 'primeiro-passo',
      titulo: 'Primeiro Rascunho',
      descricao: 'Envie sua 1ª redação para avaliação na matriz do ENEM.',
      icone: '✍️',
      desbloqueada: total >= 1,
    },
    {
      id: 'habito-ouro',
      titulo: 'Hábito de Ouro',
      descricao: 'Pratique com 3 ou mais redações na plataforma.',
      icone: '🔥',
      desbloqueada: total >= 3,
    },
    {
      id: 'mestre-conectivos',
      titulo: 'Mestre da Coesão',
      descricao: 'Atinja nota alta na Competência 4 em seus treinos.',
      icone: '⚡',
      desbloqueada: total >= 2,
    },
    {
      id: 'rumo-ao-topo',
      titulo: 'Faixa Medicina 900+',
      descricao: 'Consolide seus argumentos e alcance nota 900+ no ENEM.',
      icone: '🏆',
      desbloqueada: total >= 5,
    },
  ];
}

export function obterHistoricoParaContexto(): {
  total_redacoes: number;
  ultima_nota?: number;
  notas_anteriores: number[];
  erros_recorrentes: string[];
  pontos_fracos_anteriores: string[];
} {
  const redacoes = getRedacoesSalvas().filter(r => r.correcao && r.status === 'corrigida');
  if (redacoes.length === 0) {
    return {
      total_redacoes: 0,
      notas_anteriores: [],
      erros_recorrentes: [],
      pontos_fracos_anteriores: [],
    };
  }

  const ultimas = redacoes.slice(0, 3);
  const notas = ultimas.map(r => r.correcao?.nota_geral || 0);
  
  const todosErros: string[] = [];
  const todosPontosFracos: string[] = [];

  ultimas.forEach(r => {
    if (r.correcao) {
      const erros = r.correcao.erros || r.correcao.erros_identificados || [];
      erros.forEach(e => {
        todosErros.push(`[C${e.competencia_relacionada}] ${e.tipo}: "${e.trecho}"`);
      });
      const pontos = r.correcao.pontos_melhoria || r.correcao.proximos_passos || [];
      todosPontosFracos.push(...pontos);
    }
  });

  return {
    total_redacoes: redacoes.length,
    ultima_nota: notas[0],
    notas_anteriores: notas,
    erros_recorrentes: Array.from(new Set(todosErros)).slice(0, 5),
    pontos_fracos_anteriores: Array.from(new Set(todosPontosFracos)).slice(0, 4),
  };
}


export function getUsuarioAtual(): UsuarioSessao | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USUARIO);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function salvarUsuarioAtual(usuario: UsuarioSessao): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USUARIO, JSON.stringify(usuario));

    if (isSupabaseConfigured) {
      salvarUsuarioSupabase(usuario).catch(err => {
        console.warn('[Storage] Falha ao sincronizar usuário com Supabase:', err);
      });
    }
  } catch (err) {
    console.error('Erro ao salvar usuário:', err);
  }
}

export function logoutUsuario(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_USUARIO);
  } catch {}
}

export function isUsuarioLogado(): boolean {
  return getUsuarioAtual() !== null;
}

export function isPlanoPago(): boolean {
  const u = getUsuarioAtual();
  if (!u) return false;
  return u.plano === 'pro' || u.plano === 'medicina';
}

export function fazerUpgradePlano(plano: 'pro' | 'medicina' | 'gratis' = 'pro'): UsuarioSessao | null {
  let u = getUsuarioAtual();
  if (!u) {
    return null;
  }
  u.plano = plano;
  salvarUsuarioAtual(u);
  return u;
}
