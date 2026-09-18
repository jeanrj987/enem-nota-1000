/**
 * Captura e leitura dos identificadores de atribuição do Meta, no navegador.
 *
 * São dois, e eles fazem coisas diferentes:
 *
 * - **`_fbc`** — deriva do `fbclid`, o parâmetro que o Meta cola na URL
 *   quando alguém clica no anúncio. É ele que liga a visita ao **clique
 *   pago**. Sem `_fbc` numa conversão, o Meta não consegue dizer qual
 *   anúncio, conjunto ou criativo gerou a venda: a compra entra como
 *   orgânica e o custo por aquisição da campanha fica errado para menos.
 * - **`_fbp`** — identificador do navegador criado pelo próprio Pixel.
 *   Ajuda a costurar eventos da mesma pessoa quando não há `fbclid` (visita
 *   direta, retorno dias depois).
 *
 * Por que escrevemos `_fbc` à mão em vez de deixar o Pixel fazer: o Pixel só
 * grava esse cookie se estiver carregado no momento exato em que a pessoa
 * chega com o `fbclid` na URL. Bloqueador de anúncio, carregamento lento ou
 * uma navegação client-side no meio do caminho fazem perder a captura — e
 * perder `_fbc` é perder a atribuição da venda inteira.
 */

const DIAS_DE_VALIDADE = 90;
const SEGUNDOS_POR_DIA = 86400;

export interface AtribuicaoMeta {
  fbc: string | null;
  fbp: string | null;
}

function lerCookie(nome: string): string | null {
  if (typeof document === 'undefined') return null;
  const alvo = `${nome}=`;
  for (const parte of document.cookie.split(';')) {
    const limpo = parte.trim();
    if (limpo.startsWith(alvo)) return decodeURIComponent(limpo.slice(alvo.length));
  }
  return null;
}

function gravarCookie(nome: string, valor: string): void {
  if (typeof document === 'undefined') return;
  // `SameSite=Lax` e não `Strict`: a pessoa chega aqui vinda de um clique no
  // Instagram/Facebook, ou seja, navegação de outro site. Com `Strict` o
  // cookie não seria enviado nessa primeira visita, que é exatamente a que
  // carrega o `fbclid`.
  document.cookie = [
    `${nome}=${encodeURIComponent(valor)}`,
    'path=/',
    `max-age=${DIAS_DE_VALIDADE * SEGUNDOS_POR_DIA}`,
    'SameSite=Lax',
    location.protocol === 'https:' ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

/**
 * Formato exigido pelo Meta: `fb.<subdomínios>.<timestamp>.<fbclid>`.
 * O `1` do meio é a contagem de subdomínios abaixo do domínio registrável —
 * `www.nota1000enem.digital` tem um (`www`). O timestamp é o do clique, em
 * milissegundos, e é o que define a janela de atribuição.
 */
function montarFbc(fbclid: string): string {
  return `fb.1.${Date.now()}.${fbclid}`;
}

/**
 * Chamada a cada carregamento de página. Se a URL trouxe `fbclid`, grava o
 * `_fbc` — sobrescrevendo um anterior de propósito: se a pessoa clicou num
 * anúncio novo, é esse clique novo que deve levar o crédito da venda.
 */
export function capturarAtribuicao(): void {
  if (typeof window === 'undefined') return;

  try {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid');
    if (fbclid) gravarCookie('_fbc', montarFbc(fbclid));
  } catch (erro) {
    // Medição nunca pode quebrar a página. Um cookie bloqueado (navegação
    // anônima, política restritiva) é cenário normal, não excepcional.
    console.warn('Não foi possível capturar a atribuição do Meta:', erro);
  }
}

export function lerAtribuicao(): AtribuicaoMeta {
  return { fbc: lerCookie('_fbc'), fbp: lerCookie('_fbp') };
}
