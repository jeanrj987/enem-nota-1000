/**
 * Leitura de resposta JSON que não confia no corpo.
 *
 * `await res.json()` direto é uma armadilha em produção. Ele só é seguro
 * enquanto quem responde é a nossa rota; nem sempre é. Corpo acima do teto da
 * plataforma, timeout do gateway, deploy no ar no instante da requisição,
 * página de erro do próprio Next — em todos esses casos o corpo é HTML ou
 * texto puro, o parse quebra, e o `Error` que sobe carrega a mensagem crua do
 * motor JavaScript. No V8 é "Unexpected token '<'"; no WebKit (Safari e
 * qualquer navegador no iOS, que usa o mesmo motor por baixo) é
 * **"The string did not match the expected pattern"**.
 *
 * Como as telas mostram `err.message` direto para o usuário, essa frase
 * chegou à pessoa que tentou importar um arquivo — sem dizer o que houve nem
 * o que fazer. O que este módulo faz é trocar a mensagem do motor por uma que
 * descreve a situação real, deduzida do status HTTP.
 */

const MENSAGEM_POR_STATUS: Record<number, string> = {
  401: 'Sua sessão expirou. Entre de novo para continuar.',
  413: 'O arquivo é grande demais para o envio. Tente um arquivo menor ou cole o texto direto na área de produção textual.',
  429: 'Você fez muitos envios em pouco tempo. Espere alguns minutos e tente de novo.',
  502: 'O servidor não respondeu. Tente de novo em alguns instantes.',
  503: 'O serviço está indisponível no momento. Tente de novo em alguns instantes.',
  504: 'O processamento demorou mais do que o servidor permite. Se for um arquivo grande, tente um menor ou cole o texto direto na área de produção textual.',
};

const MENSAGEM_PADRAO =
  'Não conseguimos completar a operação. Tente de novo em alguns instantes.';

/**
 * Devolve o corpo já parseado. Quando o corpo não é JSON, lança um `Error`
 * com mensagem legível em vez de deixar o `SyntaxError` do motor vazar.
 *
 * O chamador continua responsável por checar `resposta.ok` e ler o campo de
 * erro da nossa API — isto aqui só garante que existe um objeto para ler.
 */
export async function lerRespostaJson<T>(resposta: Response): Promise<T> {
  const corpo = await resposta.text();

  try {
    return JSON.parse(corpo) as T;
  } catch {
    // Sem log não há como distinguir "gateway devolveu HTML" de "a rota
    // devolveu JSON malformado" quando alguém reportar o erro. O trecho é
    // curto de propósito: corpo de erro de gateway costuma ser uma página
    // inteira e não vale despejá-la no console do aluno.
    console.error('Resposta não-JSON de %s (status %d): %s', resposta.url, resposta.status, corpo.slice(0, 200));
    throw new Error(MENSAGEM_POR_STATUS[resposta.status] ?? MENSAGEM_PADRAO);
  }
}
