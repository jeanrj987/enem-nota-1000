/**
 * Identificação do controlador dos dados e do encarregado (DPO), exigidas
 * pela LGPD (Art. 9º, I e Art. 41).
 *
 * Estes valores são deixados em branco de propósito: são dados reais de
 * quem responde pelo tratamento, e inventá-los numa política de privacidade
 * seria pior do que não ter documento nenhum — cria uma declaração falsa
 * perante o titular e perante a ANPD.
 *
 * PREENCHER ANTES DE ABRIR PARA TRÁFEGO REAL. Enquanto estiverem vazios, as
 * páginas legais exibem um aviso visível de documento incompleto.
 */

/**
 * **Controlador pode ser pessoa física.** A LGPD define controlador como
 * "pessoa natural ou jurídica" (Art. 5º, VI) — CNPJ não é requisito. O que a
 * lei exige é *identificação* e um canal de contato, não personalidade
 * jurídica.
 */
export type TipoControlador = 'PF' | 'PJ';

export const CONTROLADOR = {
  tipo: 'PF' as TipoControlador,

  /** Nome completo (PF) ou razão social (PJ). */
  nome: '',

  /**
   * CNPJ, apenas quando `tipo === 'PJ'`. Em PF fica vazio.
   *
   * NUNCA colocar CPF aqui, nem em nenhum outro campo publicado. A LGPD não
   * exige o número do documento do controlador, e expor um CPF numa página
   * pública e indexável é convite a fraude — é o erro clássico de quem
   * opera como PF e assume que "PJ põe CNPJ, então PF põe CPF". Nome
   * completo mais um canal de contato bastam para identificar.
   */
  cnpj: '',

  /**
   * Endereço de contato. Em PF, **não use o endereço residencial**: a
   * página é pública. Cidade/estado já serve para localizar o controlador,
   * e o contato de verdade acontece pelo e-mail.
   */
  endereco: '',

  emailContato: '',

  /**
   * Encarregado pelo tratamento de dados (DPO), Art. 41 da LGPD.
   *
   * Operação de pequeno porte não é obrigada a *nomear* um encarregado
   * (Resolução CD/ANPD nº 2/2022), mas continua obrigada a oferecer um
   * canal para o titular exercer os direitos dele. Se não houver encarregado
   * nomeado, `emailContato` acima é esse canal e a página o apresenta como
   * tal — o que não pode é a pessoa não ter para onde escrever.
   */
  encarregadoNome: '',
  encarregadoEmail: '',
};

/**
 * Versão do texto legal em vigor. Muda sempre que o conteúdo material da
 * política ou dos termos mudar — é essa string que fica gravada no log de
 * consentimento, e é ela que permite dizer, depois, sobre QUAL texto a
 * pessoa concordou.
 */
export const VERSAO_DOCUMENTOS_LEGAIS = '2026-09-18';

/**
 * O mínimo para a política parar de se declarar incompleta.
 *
 * Não é "todo campo preenchido": `cnpj` é legitimamente vazio em PF, e
 * encarregado nomeado é opcional em operação de pequeno porte. O que não
 * pode faltar é quem responde (`nome`) e para onde o titular escreve
 * (`emailContato`) — sem esses dois o documento não identifica ninguém.
 */
export function dadosDoControladorCompletos(): boolean {
  const temIdentificacao = CONTROLADOR.nome.trim() !== '';
  const temCanalDeContato =
    CONTROLADOR.emailContato.trim() !== '' || CONTROLADOR.encarregadoEmail.trim() !== '';
  const cnpjCoerente = CONTROLADOR.tipo === 'PJ' ? CONTROLADOR.cnpj.trim() !== '' : true;
  return temIdentificacao && temCanalDeContato && cnpjCoerente;
}

/** Como o controlador se apresenta na política, conforme PF ou PJ. */
export function identificacaoDoControlador(): string | null {
  if (!CONTROLADOR.nome.trim()) return null;

  const partes = [CONTROLADOR.nome.trim()];
  if (CONTROLADOR.tipo === 'PJ' && CONTROLADOR.cnpj.trim()) {
    partes.push(`inscrita no CNPJ ${CONTROLADOR.cnpj.trim()}`);
  }
  if (CONTROLADOR.endereco.trim()) {
    partes.push(CONTROLADOR.tipo === 'PJ' ? `com sede em ${CONTROLADOR.endereco.trim()}` : CONTROLADOR.endereco.trim());
  }
  return `${partes.join(', ')}.`;
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
    // Era "Stripe" até 18/09. O Stripe foi removido do projeto no ADR 028 e
    // substituído pela Kiwify — a política declarava um subprocessador que
    // não existe mais e omitia o que de fato recebe os dados de cobrança.
    nome: 'Kiwify',
    finalidade: 'Processamento de pagamento',
    dados: 'E-mail e dados de cobrança (o cartão nunca passa por nós)',
    pais: 'Brasil',
  },
  {
    nome: 'Vercel',
    finalidade: 'Hospedagem da aplicação',
    dados: 'Registros de acesso, incluindo endereço IP',
    pais: 'Estados Unidos',
  },
  {
    nome: 'Meta (Facebook/Instagram)',
    finalidade: 'Medição de anúncios e atribuição de campanha',
    dados:
      'Identificadores de navegador e de clique em anúncio (cookies _fbp e _fbc), endereço IP e e-mail criptografado (SHA-256) nas confirmações de compra',
    pais: 'Estados Unidos',
  },
  {
    nome: 'Google (Analytics)',
    finalidade: 'Medição de uso do site',
    dados: 'Identificador de navegador, páginas visitadas e endereço IP',
    pais: 'Estados Unidos',
  },
] as const;
