/**
 * Regras de aceitação do arquivo de redação, num módulo sem dependência
 * nenhuma para poder ser importado dos dois lados: pela tela (`Editor`) antes
 * de subir o arquivo e pela rota (`/api/upload`) depois de recebê-lo.
 *
 * Validar só no servidor parecia suficiente e não é. Quando o corpo da
 * requisição estoura o teto da plataforma de hospedagem, quem responde é a
 * plataforma — antes de a rota ser executada — e a resposta não é o JSON que
 * a tela espera. O resultado, em produção, foi um erro cru de parse chegando
 * ao aluno ("The string did not match the expected pattern", no Safari).
 * Barrar o arquivo grande antes do envio evita a viagem inteira.
 */

/**
 * Teto de tamanho do arquivo enviado.
 *
 * Era 10MB, valor escolhido sem relação com o ambiente de execução. Funções
 * serverless na Vercel recusam corpo de requisição acima de 4,5MB, então um
 * arquivo entre 4,5MB e 10MB nunca alcançava a validação da rota: morria no
 * gateway. 4MB deixa margem para o overhead do `multipart/form-data` e ainda
 * acomoda com folga o caso real — uma redação de 30 linhas em PDF ou .docx
 * raramente passa de algumas centenas de KB.
 */
export const MAX_TAMANHO_ARQUIVO_BYTES = 4 * 1024 * 1024;

/** Formatos com texto extraível. Foto e digitalização ficam de fora por
 *  decisão de produto (ver a nota da landing sobre precisão da nota). */
export const EXTENSOES_ACEITAS = ['.txt', '.pdf', '.docx'] as const;

/** O mesmo conjunto no formato que o atributo `accept` do input espera. */
export const ACCEPT_ARQUIVO = EXTENSOES_ACEITAS.join(',');

const BYTES_POR_MB = 1024 * 1024;

/** Teto em MB, para uso em texto de interface e de erro. */
export function maxTamanhoEmMB(): number {
  return MAX_TAMANHO_ARQUIVO_BYTES / BYTES_POR_MB;
}

export type ResultadoValidacao = { ok: true } | { ok: false; erro: string };

/**
 * Aplica extensão e tamanho. Recebe nome e tamanho soltos em vez de um `File`
 * porque no servidor o objeto é o `File` do FormData e no cliente é o do
 * input — tipos diferentes para os mesmos dois campos.
 */
export function validarArquivo(nome: string, tamanhoBytes: number): ResultadoValidacao {
  const nomeNormalizado = nome.toLowerCase();
  const extensaoAceita = EXTENSOES_ACEITAS.some((ext) => nomeNormalizado.endsWith(ext));

  if (!extensaoAceita) {
    return {
      ok: false,
      erro: `Formato não suportado. Envie um arquivo ${EXTENSOES_ACEITAS.join(', ')}.`,
    };
  }

  if (tamanhoBytes > MAX_TAMANHO_ARQUIVO_BYTES) {
    return {
      ok: false,
      erro: `Arquivo grande demais (limite de ${maxTamanhoEmMB()}MB). Se for um PDF digitalizado, copie e cole o texto na área de produção textual.`,
    };
  }

  return { ok: true };
}
