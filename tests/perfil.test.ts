import { describe, it, expect } from 'vitest';
import { perfilCompleto, type Perfil } from '@/lib/perfil';

function perfilDeTeste(overrides: Partial<Perfil> = {}): Perfil {
  return {
    nome_completo: 'Ana Clara Santos',
    whatsapp: '(11) 91234-5678',
    cidade_estado: 'Fortaleza - CE',
    data_nascimento: '2006-05-10',
    curso_dos_sonhos: 'Medicina',
    ...overrides,
  };
}

describe('perfilCompleto', () => {
  it('retorna false para perfil nulo', () => {
    expect(perfilCompleto(null)).toBe(false);
  });

  it('retorna true quando todos os campos obrigatórios estão preenchidos', () => {
    expect(perfilCompleto(perfilDeTeste())).toBe(true);
  });

  it.each([
    ['nome_completo', null],
    ['whatsapp', null],
    ['cidade_estado', null],
    ['data_nascimento', null],
    ['curso_dos_sonhos', null],
    ['nome_completo', '   '],
  ] as const)('retorna false quando %s está ausente/vazio', (campo, valor) => {
    expect(perfilCompleto(perfilDeTeste({ [campo]: valor } as Partial<Perfil>))).toBe(false);
  });
});
