/**
 * Máscara, validação e normalização de WhatsApp brasileiro.
 *
 * Este campo é o ativo comercial do cadastro: é por ele que a venda no X1
 * acontece. Um número digitado errado não dá erro em lugar nenhum — só vira
 * um lead morto na lista, descoberto semanas depois. Por isso a validação
 * aqui é mais estrita do que "tem algum dígito".
 */

/**
 * DDDs que existem de fato no Plano Nacional de Numeração. A lista é
 * explícita, e não uma faixa de 11 a 99, porque boa parte dos números
 * intermediários nunca foi atribuída (20, 23, 25, 26, 29, 30, 36, 39, 40,
 * 50, 52, 56-60, 70, 72, 76, 78, 80, 90). Aceitá-los deixaria passar
 * exatamente o tipo de erro de digitação que se quer barrar.
 */
const DDDS_VALIDOS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/** Deixa só dígitos e descarta o código do país, se a pessoa o digitou. */
export function apenasDigitos(valor: string): string {
  const digitos = valor.replace(/\D/g, '');
  // "+55 11 9...": remove o 55 só quando sobra um número completo depois
  // dele, para não mutilar um DDD 55 (Santa Maria/RS) digitado sozinho.
  if (digitos.length > 11 && digitos.startsWith('55')) return digitos.slice(2);
  return digitos;
}

/**
 * Formata progressivamente, enquanto a pessoa digita: (11) 91234-5678.
 * Nunca rejeita o que foi digitado — formatar é trabalho da máscara,
 * recusar é trabalho da validação. Uma máscara que apaga caractere no meio
 * da digitação é a forma mais rápida de fazer alguém desistir do formulário.
 */
export function formatarWhatsapp(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Diz o que está errado, em linguagem de gente, ou `null` se está certo.
 * Devolver a mensagem em vez de um booleano permite explicar o problema
 * ("esse DDD não existe") em vez de só pintar o campo de vermelho.
 */
export function validarWhatsapp(valor: string): string | null {
  const d = apenasDigitos(valor);

  if (d.length === 0) return 'Informe seu WhatsApp com DDD.';
  if (d.length < 11) return 'Faltam dígitos: use DDD + 9 dígitos, como (11) 91234-5678.';
  if (d.length > 11) return 'Dígitos demais. Use DDD + 9 dígitos, como (11) 91234-5678.';

  const ddd = Number(d.slice(0, 2));
  if (!DDDS_VALIDOS.has(ddd)) return `DDD ${d.slice(0, 2)} não existe. Confira o número.`;

  // Celular brasileiro tem nono dígito e ele é sempre 9. Um número de 11
  // dígitos que não começa com 9 depois do DDD é fixo digitado errado — e
  // fixo não recebe WhatsApp.
  if (d[2] !== '9') return 'Informe um celular: o número deve começar com 9 depois do DDD.';

  // Todos os dígitos iguais depois do DDD é o preenchimento de fuga
  // clássico: (11) 99999-9999.
  if (/^(\d)\1{8}$/.test(d.slice(2))) return 'Esse número não parece real. Confira o WhatsApp.';

  return null;
}

/**
 * Formato de armazenamento: E.164 (+5511912345678). É o que as ferramentas
 * de disparo e a API do WhatsApp esperam, então guardar já normalizado evita
 * ter que limpar a lista na hora de exportar — e garante que o mesmo número
 * digitado de duas formas não vire dois leads.
 */
export function normalizarWhatsapp(valor: string): string {
  const d = apenasDigitos(valor);
  return d.length === 11 ? `+55${d}` : d;
}
