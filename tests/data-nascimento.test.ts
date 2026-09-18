import { describe, it, expect } from 'vitest';
import {
  validarDataNascimento,
  dataNascimentoMinima,
  dataNascimentoMaxima,
} from '@/lib/data-nascimento';

/** Data fixa para os testes não passarem a falhar com a virada do ano. */
const HOJE = new Date(2026, 8, 18); // 18/09/2026

describe('validarDataNascimento — o caso que passou em produção', () => {
  it('recusa o ano de 5 dígitos que o formulário aceitava', () => {
    // Era isto que `<input type="date">` sem `max` engolia: o cadastro
    // passava e o dado sujo ia para `perfis.data_nascimento`.
    expect(validarDataNascimento('98534-05-10', HOJE)).not.toBeNull();
  });

  it('recusa data no futuro', () => {
    expect(validarDataNascimento('2030-01-01', HOJE)).toBe(
      'A data de nascimento não pode estar no futuro.'
    );
  });

  it('recusa o próprio dia de hoje', () => {
    expect(validarDataNascimento('2026-09-18', HOJE)).not.toBeNull();
  });
});

describe('validarDataNascimento — datas plausíveis', () => {
  it.each([
    ['2009-03-15', 'quem está no último ano da escola'],
    ['2006-05-10', 'vestibulando típico'],
    ['1996-11-30', 'quem já saiu da escola há anos'],
    ['1980-01-01', 'quem voltou a estudar mais tarde'],
  ])('aceita %s (%s)', (data) => {
    expect(validarDataNascimento(data, HOJE)).toBeNull();
  });
});

describe('validarDataNascimento — datas que não existem', () => {
  it.each([
    ['2005-02-31', '31 de fevereiro'],
    ['2005-04-31', '31 de abril'],
    ['2005-13-01', 'mês 13'],
  ])('recusa %s (%s)', (data) => {
    expect(validarDataNascimento(data, HOJE)).not.toBeNull();
  });

  it('aceita 29 de fevereiro em ano bissexto', () => {
    expect(validarDataNascimento('2004-02-29', HOJE)).toBeNull();
  });

  it('recusa 29 de fevereiro em ano comum', () => {
    expect(validarDataNascimento('2005-02-29', HOJE)).not.toBeNull();
  });
});

describe('validarDataNascimento — vazio e formato', () => {
  it.each([['', 'vazio'], ['   ', 'só espaços']])('recusa %s (%s)', (valor) => {
    expect(validarDataNascimento(valor, HOJE)).toBe('Informe sua data de nascimento.');
  });

  it.each([['10/05/2006', 'formato brasileiro'], ['2006', 'só o ano'], ['abc', 'texto']])(
    'recusa %s (%s)',
    (valor) => {
      expect(validarDataNascimento(valor, HOJE)).toBe('Data inválida. Use o seletor de data.');
    }
  );
});

describe('limites do input', () => {
  it('o máximo é hoje, para o seletor do navegador já barrar o futuro', () => {
    expect(dataNascimentoMaxima(HOJE)).toBe('2026-09-18');
  });

  it('o mínimo são 100 anos atrás', () => {
    expect(dataNascimentoMinima(HOJE)).toBe('1926-09-18');
  });

  it('os limites são aceitos pelo próprio validador (sem contradição entre input e regra)', () => {
    // Se `min`/`max` deixassem passar algo que `validarDataNascimento`
    // recusa, a pessoa escolheria uma data no seletor e o formulário
    // reclamaria mesmo assim — o pior tipo de erro de formulário.
    expect(validarDataNascimento(dataNascimentoMinima(HOJE), HOJE)).toBeNull();
  });
});
