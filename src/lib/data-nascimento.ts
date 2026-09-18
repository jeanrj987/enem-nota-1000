/**
 * Validação de data de nascimento.
 *
 * Existe porque `<input type="date">` sozinho aceita praticamente qualquer
 * coisa: sem `min`/`max`, o campo engole um ano com cinco dígitos (98534) e
 * o formulário passa. O dado vai para `perfis.data_nascimento` e alimenta a
 * segmentação por idade — um ano absurdo não dá erro em lugar nenhum, só
 * suja a base em silêncio, que é o mesmo tipo de falha que `whatsapp.ts`
 * descreve para número de telefone.
 *
 * Mora em lib, e não dentro do componente, porque o mesmo campo aparece em
 * duas telas (`/auth` no cadastro e `/completar-perfil`). Regra duplicada é
 * regra que um dia diverge.
 */

/** Ninguém vivo nasceu antes disso. Teto generoso de propósito: a régua aqui
 *  é "é uma data plausível para uma pessoa", não "é do nosso público-alvo" —
 *  recusar quem tem 60 anos e quer prestar ENEM seria errado. */
const IDADE_MAXIMA_ANOS = 100;

/** Abaixo disso a pessoa não teria idade para prestar o ENEM sozinha, e o
 *  valor é quase certamente erro de digitação (ano trocado, dia no lugar do
 *  ano). Não é barreira de produto: o ENEM não tem idade mínima, mas quem
 *  tem menos que isso não está criando conta sozinho para treinar redação. */
const IDADE_MINIMA_ANOS = 10;

function apenasData(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function subtraiAnos(d: Date, anos: number): Date {
  return new Date(d.getFullYear() - anos, d.getMonth(), d.getDate());
}

/** Formato que `<input type="date">` exige em `min`/`max`: AAAA-MM-DD. */
function paraValorDeInput(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Data mais antiga aceita — vira o `min` do input. */
export function dataNascimentoMinima(hoje: Date = new Date()): string {
  return paraValorDeInput(subtraiAnos(apenasData(hoje), IDADE_MAXIMA_ANOS));
}

/**
 * Data mais recente aceita — vira o `max` do input.
 *
 * É `hoje`, não `hoje - IDADE_MINIMA_ANOS`: o `max` do input serve para
 * barrar o absurdo (nascer no futuro) direto no seletor do navegador. A
 * idade mínima é checada por `validarDataNascimento`, que consegue explicar
 * o motivo — `max` sozinho só faria o navegador recusar sem dizer por quê.
 */
export function dataNascimentoMaxima(hoje: Date = new Date()): string {
  return paraValorDeInput(apenasData(hoje));
}

/**
 * Diz o que está errado, em linguagem de gente, ou `null` se está certo.
 * Mesmo contrato de `validarWhatsapp`: devolver a mensagem em vez de um
 * booleano permite explicar o problema em vez de só pintar o campo de
 * vermelho.
 */
export function validarDataNascimento(valor: string, hoje: Date = new Date()): string | null {
  const bruto = valor.trim();
  if (!bruto) return 'Informe sua data de nascimento.';

  // `<input type="date">` entrega sempre AAAA-MM-DD. Qualquer outra coisa
  // veio de digitação manual, colagem ou de um navegador que caiu para
  // campo de texto — e aí o formato não é garantido.
  const partes = /^(\d{1,6})-(\d{2})-(\d{2})$/.exec(bruto);
  if (!partes) return 'Data inválida. Use o seletor de data.';

  const [, anoStr, mesStr, diaStr] = partes;
  const ano = Number(anoStr);
  const mes = Number(mesStr);
  const dia = Number(diaStr);

  // `new Date(2005, 1, 31)` vira 3 de março em vez de recusar. Comparar os
  // componentes de volta é o que pega 31/02 e afins.
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return 'Essa data não existe. Confira o dia e o mês.';
  }

  const referencia = apenasData(hoje);
  if (data > referencia) return 'A data de nascimento não pode estar no futuro.';
  if (data < subtraiAnos(referencia, IDADE_MAXIMA_ANOS)) {
    return `Confira o ano: ${ano} daria mais de ${IDADE_MAXIMA_ANOS} anos.`;
  }
  if (data > subtraiAnos(referencia, IDADE_MINIMA_ANOS)) {
    return 'Confira o ano de nascimento.';
  }

  return null;
}
