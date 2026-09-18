import { describe, it, expect } from 'vitest';
import { validarCorrecaoIA } from '@/lib/correcao-schema';
import { CASOS_REGRESSAO } from './regressao/casos';

describe('regressão — casos reais analisados manualmente', () => {
  for (const caso of CASOS_REGRESSAO) {
    it(`${caso.id} — continua passando pelas regras do validador`, () => {
      const r = validarCorrecaoIA(caso.respostaModelo, caso.texto);
      expect(r.success, r.success ? '' : r.error).toBe(true);
    });
  }

  it('cada caso de regressão tem nota_geral igual à soma das competências (sanidade do próprio fixture)', () => {
    for (const caso of CASOS_REGRESSAO) {
      const soma = caso.respostaModelo.competencias.reduce((acc, c) => acc + c.nota, 0);
      expect(soma, `caso ${caso.id}`).toBe(caso.respostaModelo.nota_geral);
    }
  });
});
