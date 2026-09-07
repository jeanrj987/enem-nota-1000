import { describe, it, expect } from 'vitest';
import {
  apenasDigitos,
  formatarWhatsapp,
  validarWhatsapp,
  normalizarWhatsapp,
} from '@/lib/whatsapp';

describe('formatarWhatsapp — máscara progressiva', () => {
  it('formata em etapas, sem engasgar durante a digitação', () => {
    expect(formatarWhatsapp('')).toBe('');
    expect(formatarWhatsapp('1')).toBe('(1');
    expect(formatarWhatsapp('11')).toBe('(11');
    expect(formatarWhatsapp('119')).toBe('(11) 9');
    expect(formatarWhatsapp('1191234')).toBe('(11) 9123-4');
    expect(formatarWhatsapp('11912345678')).toBe('(11) 91234-5678');
  });

  it('ignora o que a pessoa digitar de pontuação', () => {
    expect(formatarWhatsapp('(11) 91234-5678')).toBe('(11) 91234-5678');
    expect(formatarWhatsapp('11 9 1234 5678')).toBe('(11) 91234-5678');
  });

  it('não deixa passar de 11 dígitos', () => {
    expect(formatarWhatsapp('119123456789999')).toBe('(11) 91234-5678');
  });

  it('aceita o número colado com código do país', () => {
    expect(formatarWhatsapp('+55 11 91234-5678')).toBe('(11) 91234-5678');
  });
});

describe('apenasDigitos', () => {
  it('remove o 55 do país só quando sobra número completo', () => {
    expect(apenasDigitos('+5511912345678')).toBe('11912345678');
  });

  // DDD 55 é Santa Maria/RS: cortar o "55" da frente aqui mutilaria um
  // número legítimo.
  it('preserva o DDD 55 digitado sozinho', () => {
    expect(apenasDigitos('(55) 99123-4567')).toBe('55991234567');
  });
});

describe('validarWhatsapp', () => {
  it('aceita celular válido', () => {
    expect(validarWhatsapp('(11) 91234-5678')).toBeNull();
    expect(validarWhatsapp('(55) 99123-4567')).toBeNull();
    expect(validarWhatsapp('+55 21 98888-7777')).toBeNull();
  });

  it('cobra o campo vazio', () => {
    expect(validarWhatsapp('')).toMatch(/Informe seu WhatsApp/);
  });

  it('recusa número incompleto', () => {
    expect(validarWhatsapp('(11) 9123')).toMatch(/Faltam dígitos/);
  });

  it('recusa DDD inexistente', () => {
    expect(validarWhatsapp('(20) 91234-5678')).toMatch(/DDD 20 não existe/);
    expect(validarWhatsapp('(00) 91234-5678')).toMatch(/DDD 00 não existe/);
  });

  it('recusa telefone fixo, que não recebe WhatsApp', () => {
    expect(validarWhatsapp('(11) 31234-5678')).toMatch(/deve começar com 9/);
  });

  it('recusa preenchimento de fuga', () => {
    expect(validarWhatsapp('(11) 99999-9999')).toMatch(/não parece real/);
  });
});

describe('normalizarWhatsapp', () => {
  it('guarda em E.164 para o disparo não precisar limpar depois', () => {
    expect(normalizarWhatsapp('(11) 91234-5678')).toBe('+5511912345678');
  });

  it('o mesmo número digitado de formas diferentes vira um lead só', () => {
    expect(normalizarWhatsapp('11912345678')).toBe(normalizarWhatsapp('+55 (11) 91234-5678'));
  });
});
