export type CompetenciaNumero = 1 | 2 | 3 | 4 | 5;

export type TipoErro =
  | 'gramatica'
  | 'pontuacao'
  | 'ortografia'
  | 'coesao'
  | 'vocabulario'
  | 'regencia'
  | 'concordancia'
  | 'argumentacao'
  | 'proposta_intervencao'
  | 'outro';

export interface ElementosC5 {
  agente: boolean;
  acao: boolean;
  meio: boolean;
  efeito: boolean;
  detalhamento: boolean;
}

export interface HabilidadesC1 {
  ortografia_e_acentuacao: boolean;
  concordancia_e_regencia: boolean;
  pontuacao_adequada: boolean;
  registro_formal_sem_oralidade: boolean;
}

export interface HabilidadesC3 {
  tese_clara: boolean;
  argumentos_bem_selecionados: boolean;
  progressao_logica: boolean;
  conclusao_articulada: boolean;
}

export interface HabilidadesC4 {
  conectivos_interparagrafos: boolean;
  conectivos_intraparagrafos_variados: boolean;
  ausencia_repeticao_excessiva: boolean;
  ausencia_marcadores_orais: boolean;
}

export interface Competencia {
  numero: CompetenciaNumero;
  nome: string;
  descricao_curta: string;
  nota: number; // 0, 40, 80, 120, 160, 200
  nivel: number; // 0 a 5
  comentario: string;
  pontos_fortes?: string[];
  pontos_melhoria?: string[];
  habilidades_c1?: HabilidadesC1; // preenchido apenas na Competência 1
  habilidades_c3?: HabilidadesC3; // preenchido apenas na Competência 3
  habilidades_c4?: HabilidadesC4; // preenchido apenas na Competência 4
  elementos_c5?: ElementosC5; // preenchido apenas na Competência 5
}

export interface ErroIdentificado {
  id: string;
  trecho: string;
  tipo: TipoErro;
  correcao: string;
  explicacao: string;
  competencia_relacionada: CompetenciaNumero;
}

export interface ReconciliacaoInfo {
  notasIndividuais: number[]; // nota_geral de cada correção independente realizada
  divergencia: number; // diferença entre as duas notas usadas na média final
  terceiraCorrecaoAcionada: boolean; // true se a divergência exigiu uma 3ª correção de arbitragem
  correcaoUnica: boolean; // true se só 1 correção pôde ser usada (a outra falhou)
  divergenciaDeAnulacao?: boolean; // true se as correções discordaram sobre anulação total
}

export interface Correcao {
  id: string;
  redacao_id: string;
  anulada: boolean;
  motivo_anulacao: string | null;
  nota_geral: number; // 0 a 1000
  competencias: Competencia[];
  erros: ErroIdentificado[];
  versao_reescrita: string;
  feedback_pedagogico: string;
  pontos_positivos: string[];
  proximos_passos: string[];
  tempo_analise_ms?: number;
  created_at: string;
  reconciliacao?: ReconciliacaoInfo; // presente quando a nota vem de dupla correção
}

export interface Redacao {
  id: string;
  user_id?: string;
  titulo: string;
  tema: string;
  texto: string;
  palavras_count: number;
  linhas_count: number;
  status: 'pendente' | 'corrigindo' | 'corrigida' | 'erro';
  created_at: string;
  correcao?: Correcao;
}

export interface TemaRedacao {
  id: string;
  titulo: string;
  ano?: number;
  origem: 'ENEM Oficial' | 'Tema Inédito' | 'Simulado Nacional';
  descricao: string;
  textos_motivadores?: {
    titulo: string;
    conteudo: string;
    fonte?: string;
  }[];
}

export interface HistoricoItem {
  id: string;
  redacao_id: string;
  titulo: string;
  tema: string;
  data: string;
  nota_geral: number;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
}

export interface EstatisticasUsuario {
  total_redacoes: number;
  media_geral: number;
  maior_nota: number;
  ultima_nota: number;
  evolucao_percentual: number;
  competencia_forte: { numero: CompetenciaNumero; nome: string; media: number };
  competencia_atencao: { numero: CompetenciaNumero; nome: string; media: number };
}
