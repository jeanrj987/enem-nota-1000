/**
 * Identificação do controlador dos dados e do encarregado (DPO), exigidas
 * pela LGPD (Art. 9º, I e Art. 41).
 *
 * Estes valores são deixados em branco de propósito: são dados jurídicos
 * reais da empresa, e inventar razão social, CNPJ ou nome de encarregado
 * numa política de privacidade seria pior do que não ter documento nenhum —
 * cria uma declaração falsa perante o titular e perante a ANPD.
 *
 * Enquanto estiverem vazios, as páginas legais exibem um aviso visível de
 * documento incompleto, para que isso não passe despercebido em produção.
 *
 * PREENCHER ANTES DE ABRIR PARA TRÁFEGO REAL.
 */
export const CONTROLADOR = {
  razaoSocial: '',
  cnpj: '',
  endereco: '',
  emailContato: '',
  /** Encarregado pelo tratamento de dados pessoais (DPO), Art. 41 da LGPD. */
  encarregadoNome: '',
  encarregadoEmail: '',
} as const;

/**
 * Versão do texto legal em vigor. Muda sempre que o conteúdo material da
 * política ou dos termos mudar — é essa string que fica gravada no log de
 * consentimento, e é ela que permite dizer, depois, sobre QUAL texto a
 * pessoa concordou.
 */
export const VERSAO_DOCUMENTOS_LEGAIS = '2026-09-08';

export function dadosDoControladorCompletos(): boolean {
  return Object.values(CONTROLADOR).every((v) => v.trim() !== '');
}

/**
 * Terceiros que recebem dado pessoal. Vive aqui, e não solto no texto da
 * política, porque a lista precisa mudar junto com a arquitetura: trocar de
 * provedor de IA sem atualizar a política transforma o documento em
 * declaração falsa.
 */
export const SUBPROCESSADORES = [
  {
    nome: 'OpenAI',
    finalidade: 'Correção automática da redação',
    dados: 'Texto da redação e tema',
    pais: 'Estados Unidos',
  },
  {
    nome: 'Google (Gemini)',
    finalidade: 'Transcrição de redação enviada em PDF sem texto selecionável',
    dados: 'Imagem das páginas do arquivo enviado',
    pais: 'Estados Unidos',
  },
  {
    nome: 'Supabase',
    finalidade: 'Banco de dados, autenticação e armazenamento',
    dados: 'Cadastro, redações, correções e assinaturas',
    pais: 'Estados Unidos',
  },
  {
    nome: 'Stripe',
    finalidade: 'Processamento de pagamento',
    dados: 'E-mail e dados de cobrança (o cartão nunca passa por nós)',
    pais: 'Estados Unidos',
  },
  {
    nome: 'Vercel',
    finalidade: 'Hospedagem da aplicação',
    dados: 'Registros de acesso, incluindo endereço IP',
    pais: 'Estados Unidos',
  },
] as const;
